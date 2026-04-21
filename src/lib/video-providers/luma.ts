import 'server-only'

import LumaAI from 'lumaai'
import { requireLumaEnv } from '@/lib/env'
import { stageSourceImagesToCloudinary, mirrorProviderOutputToSupabase } from '@/lib/media/storage-bridge'
import type { VideoProvider, DurationTarget } from './types'

// Luma Dream Machine (Ray 2) adapter.
//
// Model selection:
//   - preview (5s): ray-flash-2 (fastest/cheapest)
//   - final (15s target → 9s actual): ray-2 (highest quality, max 9s/gen)
//
// Luma supports max 9s per generation. For true 15s we'd chain a 2nd gen
// via `keyframes.frame0 = { type: 'generation', id }` + Cloudinary concat.
// For budget reasons we ship 9s-single for final and treat that as "close
// enough" to 15s, matching the Runway cap. Document the actual durationSeconds.

function lumaClient() {
  const { apiKey } = requireLumaEnv()
  return new LumaAI({ authToken: apiKey })
}

function aspectRatioFor(input: '16:9' | '9:16' | '1:1'): '16:9' | '9:16' | '1:1' {
  return input
}

async function waitForGeneration(
  client: LumaAI,
  id: string,
  onProgress: (p: number) => Promise<void>,
  progressFrom: number,
  progressTo: number,
): Promise<string> {
  const start = Date.now()
  const timeoutMs = 8 * 60 * 1000
  let lastProgress = progressFrom
  while (true) {
    const gen = await client.generations.get(id)
    if (gen.state === 'completed') {
      const url = gen.assets?.video
      if (!url) throw new Error('luma_completed_without_video')
      await onProgress(progressTo)
      return url
    }
    if (gen.state === 'failed') {
      throw new Error(`luma_failed: ${gen.failure_reason ?? 'unknown'}`)
    }
    const elapsed = Date.now() - start
    const next = Math.min(
      progressTo - 2,
      Math.round(progressFrom + (progressTo - progressFrom) * Math.min(elapsed / timeoutMs, 0.9)),
    )
    if (next > lastProgress) {
      lastProgress = next
      await onProgress(next)
    }
    if (elapsed > timeoutMs) throw new Error('luma_timeout')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

export const lumaProvider: VideoProvider = {
  name: 'luma',

  async run({ job, onProgress }) {
    const phase = (job.phase === 'final_15s' ? 'final_15s' : 'preview_5s') as
      | 'preview_5s'
      | 'final_15s'
    const target: DurationTarget = phase === 'final_15s' ? 15 : 5
    const aspectRatio =
      (job.options as { aspect_ratio?: '16:9' | '9:16' | '1:1' })?.aspect_ratio ?? '9:16'
    const prompt = job.prompt ?? job.scenario ?? ''

    await onProgress(10)

    const imageUrls = job.source_image_urls.length
      ? await stageSourceImagesToCloudinary(job)
      : []
    await onProgress(20)

    const client = lumaClient()

    // Phase decides the model; target decides the per-call duration.
    const model: 'ray-2' | 'ray-flash-2' = phase === 'final_15s' ? 'ray-2' : 'ray-flash-2'
    const perCallDuration: '5s' | '9s' = target >= 10 ? '9s' : '5s'

    const createBody: Parameters<typeof client.generations.video.create>[0] = {
      model,
      aspect_ratio: aspectRatioFor(aspectRatio),
      duration: perCallDuration,
      prompt: prompt.slice(0, 5000),
      resolution: '720p',
    }

    if (imageUrls.length > 0) {
      createBody.keyframes = {
        frame0: { type: 'image', url: imageUrls[0] },
      }
    }

    const gen = await client.generations.video.create(createBody)
    if (!gen.id) throw new Error('luma_generation_no_id')

    const videoUrl = await waitForGeneration(client, gen.id, onProgress, 25, 88)
    await onProgress(90)

    const mirrored = await mirrorProviderOutputToSupabase(videoUrl, job)
    await onProgress(100)

    return {
      outputVideoUrl: mirrored.videoKey,
      outputThumbnailUrl: mirrored.thumbKey,
      durationSeconds: mirrored.durationSeconds || (perCallDuration === '9s' ? 9 : 5),
      providerJobId: gen.id,
      providerModel: model,
    }
  },
}
