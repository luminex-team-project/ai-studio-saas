import 'server-only'

import jwt from 'jsonwebtoken'
import { requireKlingEnv } from '@/lib/env'
import { stageSourceImagesToCloudinary, mirrorProviderOutputToSupabase } from '@/lib/media/storage-bridge'
import type { VideoProvider, ProviderInputs, DurationTarget } from './types'

// Kling official API (Singapore gateway).
//
// Auth: HS256 JWT signed with the `sk` (secret), `iss = ak`, exp=+30m, nbf=-5s.
// Docs: https://app.klingai.com/global/dev/document-api
//
// Max single-call duration is 10s. For 15s we generate 10s then extend by 5s.
// Phase-1 preview uses `std` mode with kling-v2-5-turbo (cheapest).
// Phase-2 final uses `pro` mode with kling-v2-6 (best quality).

const KLING_BASE = 'https://api-singapore.klingai.com'

const MODEL_BY_PHASE = {
  preview_5s: { modelT2V: 'kling-v2-5-turbo', modelI2V: 'kling-v2-5-turbo', mode: 'std' as const },
  final_15s: { modelT2V: 'kling-v2-6', modelI2V: 'kling-v2-6', mode: 'pro' as const },
}

function signJwt(): string {
  const { apiKey, apiSecret } = requireKlingEnv()
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: apiKey, exp: now + 1800, nbf: now - 5 },
    apiSecret,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } },
  )
}

async function klingFetch<T = unknown>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${KLING_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${signJwt()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`kling_${method}_${path}_failed: ${res.status} ${text}`)
  }
  // Kling wraps everything in { code, message, data, ... }
  const parsed = JSON.parse(text) as { code: number; message: string; data: T }
  if (parsed.code !== 0) {
    throw new Error(`kling_error ${parsed.code}: ${parsed.message}`)
  }
  return parsed.data
}

type KlingCreateResp = {
  task_id: string
  task_status: string
}

type KlingPollResp = {
  task_id: string
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
  task_status_msg?: string
  task_result?: {
    videos: Array<{ id: string; url: string; duration: string }>
  }
}

async function createTextToVideoTask(input: ProviderInputs, phase: 'preview_5s' | 'final_15s') {
  const { modelT2V, mode } = MODEL_BY_PHASE[phase]
  // Kling only supports 5 or 10 seconds per call.
  const duration = input.target >= 10 ? '10' : '5'
  const data = await klingFetch<KlingCreateResp>('POST', '/v1/videos/text2video', {
    model_name: modelT2V,
    prompt: input.prompt.slice(0, 2500),
    mode,
    aspect_ratio: input.aspectRatio,
    duration,
    cfg_scale: 0.5,
  })
  return data.task_id
}

async function createImageToVideoTask(input: ProviderInputs, phase: 'preview_5s' | 'final_15s') {
  if (input.imageUrls.length === 0) {
    throw new Error('kling_image2video_requires_image')
  }
  const { modelI2V, mode } = MODEL_BY_PHASE[phase]
  const duration = input.target >= 10 ? '10' : '5'
  const data = await klingFetch<KlingCreateResp>('POST', '/v1/videos/image2video', {
    model_name: modelI2V,
    image: input.imageUrls[0], // Kling accepts URL here
    prompt: input.prompt.slice(0, 2500),
    mode,
    aspect_ratio: input.aspectRatio,
    duration,
    cfg_scale: 0.5,
  })
  return data.task_id
}

async function extendVideo(
  videoId: string,
  extendPrompt: string,
): Promise<string> {
  const data = await klingFetch<KlingCreateResp>('POST', '/v1/videos/video-extend', {
    video_id: videoId,
    prompt: extendPrompt.slice(0, 2500),
    cfg_scale: 0.5,
  })
  return data.task_id
}

async function pollTask(
  resource: 'text2video' | 'image2video' | 'video-extend',
  taskId: string,
  onProgress: (p: number) => Promise<void>,
  progressFrom: number,
  progressTo: number,
): Promise<KlingPollResp> {
  // Budget: ~6 minutes per generation. Poll every 5s.
  const start = Date.now()
  const timeoutMs = 6 * 60 * 1000
  let lastProgress = progressFrom
  while (true) {
    const resp = await klingFetch<KlingPollResp>('GET', `/v1/videos/${resource}/${taskId}`)
    if (resp.task_status === 'succeed') {
      await onProgress(progressTo)
      return resp
    }
    if (resp.task_status === 'failed') {
      throw new Error(`kling_task_failed: ${resp.task_status_msg ?? 'unknown'}`)
    }
    // Smoothly advance progress toward progressTo as time elapses.
    const elapsed = Date.now() - start
    const ratio = Math.min(elapsed / timeoutMs, 0.9)
    const next = Math.min(
      progressTo - 2,
      Math.round(progressFrom + (progressTo - progressFrom) * ratio),
    )
    if (next > lastProgress) {
      lastProgress = next
      await onProgress(next)
    }
    if (elapsed > timeoutMs) throw new Error('kling_task_timeout')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

export const klingProvider: VideoProvider = {
  name: 'kling',

  async run({ job, onProgress }) {
    const phase = (job.phase === 'final_15s' ? 'final_15s' : 'preview_5s') as
      | 'preview_5s'
      | 'final_15s'
    const target: DurationTarget = phase === 'final_15s' ? 15 : 5
    const aspectRatio =
      (job.options as { aspect_ratio?: '16:9' | '9:16' | '1:1' })?.aspect_ratio ?? '9:16'
    const prompt = job.prompt ?? job.scenario ?? ''

    await onProgress(10)

    // If source images exist, stage them to Cloudinary first.
    const imageUrls = job.source_image_urls.length
      ? await stageSourceImagesToCloudinary(job)
      : []
    await onProgress(20)

    const isImageFlow = imageUrls.length > 0
    const resource = isImageFlow ? 'image2video' : 'text2video'

    // Step 1: base clip (5s or 10s).
    const baseTaskId = isImageFlow
      ? await createImageToVideoTask({ prompt, imageUrls, target, aspectRatio }, phase)
      : await createTextToVideoTask({ prompt, imageUrls, target, aspectRatio }, phase)
    const basePhaseTo = target >= 15 ? 55 : 80
    const baseResult = await pollTask(resource, baseTaskId, onProgress, 20, basePhaseTo)

    let finalVideoUrl = baseResult.task_result!.videos[0].url
    const baseVideoId = baseResult.task_result!.videos[0].id

    // Step 2: extend by 5s if we need 15s final output.
    if (target >= 15) {
      const extendTaskId = await extendVideo(baseVideoId, prompt)
      const extendResult = await pollTask('video-extend', extendTaskId, onProgress, 55, 88)
      // Extension returns the extended video as a new entry — prefer it.
      const extended = extendResult.task_result?.videos?.[0]?.url
      if (extended) finalVideoUrl = extended
    }

    // Step 3: mirror to Supabase Storage via Cloudinary.
    await onProgress(90)
    const mirrored = await mirrorProviderOutputToSupabase(finalVideoUrl, job)
    await onProgress(100)

    const { modelT2V } = MODEL_BY_PHASE[phase]
    return {
      outputVideoUrl: mirrored.videoKey,
      outputThumbnailUrl: mirrored.thumbKey,
      durationSeconds: mirrored.durationSeconds || target,
      providerJobId: baseTaskId,
      providerModel: modelT2V,
    }
  },
}
