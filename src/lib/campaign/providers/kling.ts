import 'server-only'

import jwt from 'jsonwebtoken'
import { requireKlingEnv } from '@/lib/env'
import { logger } from '../logger'
import { retry, isRetryableHttpError } from './retry'
import type { CampaignProvider, ClipGenInput, ClipGenResult, ProgressFn } from './types'

// Kling v2-1-master adapter for the campaign pipeline.
//
// Endpoint: https://api-singapore.klingai.com
// Auth: HS256 JWT signed with KLING_API_SECRET, iss=KLING_API_KEY, exp=+30m.
// Model: kling-v2-1-master, mode=pro, cfg_scale 0.8 (for text/logo fidelity).
// Accepts image as a URL (preferred) — base64 also works but URL avoids
// ballooning request size.

const KLING_BASE = 'https://api-singapore.klingai.com'
const TIMEOUT_MS = 7 * 60 * 1000
const POLL_INTERVAL_MS = 6000

function signJwt(): string {
  const { apiKey, apiSecret } = requireKlingEnv()
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: apiKey, exp: now + 1800, nbf: now - 5 },
    apiSecret,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } },
  )
}

type KlingEnvelope<T> = { code: number; message: string; data: T }

async function klingFetch<T>(
  method: 'GET' | 'POST',
  pathname: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${KLING_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${signJwt()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    // Preserve status code in the message so the retry classifier can match.
    throw new Error(`kling_${method}_${pathname}_${res.status}: ${text.slice(0, 300)}`)
  }
  const parsed = JSON.parse(text) as KlingEnvelope<T>
  if (parsed.code !== 0) {
    throw new Error(`kling_api_error_${parsed.code}: ${parsed.message}`)
  }
  return parsed.data
}

type KlingCreateResp = { task_id: string; task_status: string }

type KlingPollResp = {
  task_id: string
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
  task_status_msg?: string
  task_result?: { videos: Array<{ id: string; url: string; duration: string }> }
}

export const klingCampaignProvider: CampaignProvider = {
  name: 'kling',

  async generate(input, onProgress) {
    if (input.model !== 'kling-v2-1-master') {
      throw new Error(`kling_model_unsupported: ${input.model}`)
    }
    if (!input.imageUrl) {
      throw new Error('kling_image2video_requires_image')
    }

    const log = logger.child({ provider: 'kling', clipId: input.clipId, model: input.model })
    await onProgress?.(5)
    log.info('kling_create_task', { mode: 'pro', cfg: input.cfgScale ?? 0.8 })

    const createBody = {
      model_name: 'kling-v2-1-master',
      image: input.imageUrl,
      prompt: input.prompt.slice(0, 2500),
      negative_prompt: input.negativePrompt.slice(0, 2500),
      mode: 'pro' as const,
      aspect_ratio: input.aspectRatio,
      duration: input.duration === 5 ? '5' : '10',
      cfg_scale: input.cfgScale ?? 0.8,
    }

    const created = await retry(
      () => klingFetch<KlingCreateResp>('POST', '/v1/videos/image2video', createBody),
      {
        attempts: 5,
        baseDelayMs: 1000,
        shouldRetry: isRetryableHttpError,
        onRetry: (e, a) => log.warn('kling_create_retry', { attempt: a, err: (e as Error).message }),
      },
    )
    log.info('kling_task_created', { taskId: created.task_id })
    await onProgress?.(10)

    const start = Date.now()
    while (true) {
      const resp = await retry(
        () => klingFetch<KlingPollResp>('GET', `/v1/videos/image2video/${created.task_id}`),
        {
          attempts: 5,
          baseDelayMs: 800,
          shouldRetry: isRetryableHttpError,
          onRetry: (e, a) =>
            log.warn('kling_poll_retry', { attempt: a, err: (e as Error).message }),
        },
      )
      if (resp.task_status === 'succeed') {
        const url = resp.task_result?.videos?.[0]?.url
        if (!url) throw new Error('kling_succeeded_without_video')
        await onProgress?.(100)
        log.info('kling_task_succeeded', { taskId: created.task_id })
        const reportedDuration = Number(resp.task_result?.videos?.[0]?.duration ?? input.duration)
        return {
          remoteUrl: url,
          providerJobId: created.task_id,
          providerModel: 'kling-v2-1-master',
          durationSeconds: Number.isFinite(reportedDuration) ? reportedDuration : input.duration,
        }
      }
      if (resp.task_status === 'failed') {
        throw new Error(`kling_task_failed: ${resp.task_status_msg ?? 'unknown'}`)
      }
      const elapsed = Date.now() - start
      await onProgress?.(Math.min(95, 10 + Math.round((elapsed / TIMEOUT_MS) * 85)))
      if (elapsed > TIMEOUT_MS) throw new Error('kling_task_timeout')
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  },
}
