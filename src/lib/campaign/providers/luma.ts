import 'server-only'

import LumaAI from 'lumaai'
import { requireLumaEnv } from '@/lib/env'
import { logger } from '../logger'
import { retry, isRetryableHttpError } from './retry'
import type { CampaignProvider, ClipGenInput, ClipGenResult, ProgressFn } from './types'

// Luma Dream Machine (Ray 2) adapter for the campaign pipeline.
//
// Endpoint: https://api.lumalabs.ai/dream-machine/v1 (via SDK).
// Auth: Bearer ${LUMA_API_KEY}.
// Supports `keyframes.frame0 = { type: "image", url }` for image-conditioned
// generation. Max duration per call: 9s. Campaign clips are always 5s.

const TIMEOUT_MS = 8 * 60 * 1000
const POLL_INTERVAL_MS = 5000

export const lumaCampaignProvider: CampaignProvider = {
  name: 'luma',

  async generate(input, onProgress) {
    if (input.model !== 'ray-2') {
      throw new Error(`luma_model_unsupported: ${input.model}`)
    }

    const { apiKey } = requireLumaEnv()
    const client = new LumaAI({ authToken: apiKey })
    const log = logger.child({ provider: 'luma', clipId: input.clipId, model: input.model })

    await onProgress?.(5)
    log.info('luma_create_generation', { duration: input.duration, aspect: input.aspectRatio })

    const createBody: Parameters<typeof client.generations.video.create>[0] = {
      model: 'ray-2',
      aspect_ratio: input.aspectRatio,
      duration: input.duration === 5 ? '5s' : '9s',
      prompt: input.prompt.slice(0, 5000),
      resolution: input.resolution,
    }
    if (input.imageUrl) {
      createBody.keyframes = { frame0: { type: 'image', url: input.imageUrl } }
    }

    const gen = await retry(() => client.generations.video.create(createBody), {
      attempts: 5,
      baseDelayMs: 1000,
      shouldRetry: isRetryableHttpError,
      onRetry: (e, a) => log.warn('luma_create_retry', { attempt: a, err: (e as Error).message }),
    })
    if (!gen.id) throw new Error('luma_generation_no_id')
    log.info('luma_generation_created', { generationId: gen.id })
    await onProgress?.(10)

    const start = Date.now()
    while (true) {
      const status = await retry(() => client.generations.get(gen.id as string), {
        attempts: 5,
        baseDelayMs: 800,
        shouldRetry: isRetryableHttpError,
        onRetry: (e, a) => log.warn('luma_poll_retry', { attempt: a, err: (e as Error).message }),
      })
      if (status.state === 'completed') {
        const url = status.assets?.video
        if (!url) throw new Error('luma_completed_without_video')
        await onProgress?.(100)
        log.info('luma_generation_succeeded', { generationId: gen.id })
        return {
          remoteUrl: url,
          providerJobId: gen.id,
          providerModel: 'ray-2',
          durationSeconds: input.duration,
        }
      }
      if (status.state === 'failed') {
        throw new Error(`luma_failed: ${status.failure_reason ?? 'unknown'}`)
      }
      const elapsed = Date.now() - start
      await onProgress?.(Math.min(95, 10 + Math.round((elapsed / TIMEOUT_MS) * 85)))
      if (elapsed > TIMEOUT_MS) throw new Error('luma_timeout')
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  },
}
