import 'server-only'

import RunwayML, { TaskFailedError } from '@runwayml/sdk'
import { requireRunwayEnv } from '@/lib/env'
import { logger } from '../logger'
import { retry, isRetryableHttpError } from './retry'
import type { CampaignProvider, ClipGenInput, ClipGenResult, ProgressFn } from './types'

// Runway Gen-4 Turbo adapter for the campaign pipeline.
//
// Model: gen4_turbo (image-to-video, 5s/10s, 720×1280 or 1280×720).
// Endpoint: https://api.dev.runwayml.com (via SDK).
// Auth: Bearer token, `X-Runway-Version: 2024-11-06` header injected by SDK.

const TIMEOUT_MS = 10 * 60 * 1000
const POLL_INTERVAL_MS = 5000

function ratioFor(aspect: ClipGenInput['aspectRatio']): '720:1280' | '1280:720' | '960:960' {
  if (aspect === '9:16') return '720:1280'
  if (aspect === '1:1') return '960:960'
  return '1280:720'
}

async function waitForTask(
  client: RunwayML,
  taskId: string,
  onProgress: ProgressFn | undefined,
  log: ReturnType<typeof logger.child>,
): Promise<string> {
  const start = Date.now()
  while (true) {
    const task = await retry(() => client.tasks.retrieve(taskId), {
      attempts: 5,
      baseDelayMs: 800,
      shouldRetry: isRetryableHttpError,
      onRetry: (e, a) =>
        log.warn('runway_poll_retry', { attempt: a, err: (e as Error).message }),
    })
    if (task.status === 'SUCCEEDED') {
      const url = task.output?.[0]
      if (!url) throw new Error('runway_task_no_output')
      await onProgress?.(100)
      return url
    }
    if (task.status === 'FAILED') {
      throw new TaskFailedError(task as never)
    }
    const elapsed = Date.now() - start
    const native = task.status === 'RUNNING' ? task.progress ?? 0 : 0
    await onProgress?.(Math.min(95, Math.round(native * 100)))
    if (elapsed > TIMEOUT_MS) throw new Error('runway_task_timeout')
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
}

export const runwayCampaignProvider: CampaignProvider = {
  name: 'runway',

  async generate(input, onProgress) {
    if (input.model !== 'gen4_turbo') {
      throw new Error(`runway_model_unsupported: ${input.model}`)
    }
    if (!input.imageUrl) {
      throw new Error('runway_gen4_turbo_requires_image')
    }

    const { apiKey } = requireRunwayEnv()
    const client = new RunwayML({ apiKey })
    const log = logger.child({ provider: 'runway', clipId: input.clipId, model: input.model })

    await onProgress?.(5)
    log.info('runway_create_task', { duration: input.duration, ratio: ratioFor(input.aspectRatio) })

    const task = await retry(
      () =>
        client.imageToVideo.create({
          model: 'gen4_turbo',
          promptImage: input.imageUrl,
          promptText: input.prompt.slice(0, 1000),
          ratio: ratioFor(input.aspectRatio),
          duration: input.duration,
          seed: input.seed,
        }),
      {
        attempts: 5,
        baseDelayMs: 1000,
        shouldRetry: isRetryableHttpError,
        onRetry: (e, a) =>
          log.warn('runway_create_retry', { attempt: a, err: (e as Error).message }),
      },
    )

    log.info('runway_task_created', { taskId: task.id })
    await onProgress?.(10)

    const remoteUrl = await waitForTask(client, task.id, onProgress, log)
    log.info('runway_task_succeeded', { taskId: task.id })

    return {
      remoteUrl,
      providerJobId: task.id,
      providerModel: 'gen4_turbo',
      durationSeconds: input.duration,
    }
  },
}
