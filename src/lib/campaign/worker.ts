import 'server-only'

import { Worker, type Job } from 'bullmq'
import { writeFile } from 'node:fs/promises'
import { getRedisConnection } from '@/lib/queue/redis'
import { CAMPAIGN_QUEUE_NAME, type CampaignJobPayload } from './queue'
import { CLIP_INDEX, type ClipSpec } from './timeline'
import { campaignProviderFor, type ClipGenInput } from './providers'
import { sourceImageUrl } from './sources'
import { downloadToFile, cloudinaryBackupRaw } from './storage'
import { rawClipFailurePath, rawClipPath } from './paths'
import { logger } from './logger'

// Campaign worker — processes one job per clip. Work unit:
//   1. Resolve ClipSpec from the timeline manifest (SSoT).
//   2. Resolve source image URL from sources.json (Cloudinary-backed).
//   3. Dispatch to the matching provider adapter (Runway / Luma / Kling).
//   4. Download the provider's remote mp4 to output/raw/{clipId}.mp4.
//   5. Best-effort Cloudinary backup under ${folder}/{campaignId}/raw/{clipId}.
//   6. Return a compact result row for the queue.
//
// Retries: BullMQ handles up to 3 attempts with 10s exponential backoff
// (configured on the queue). On final failure the worker writes a
// {clipId}.failed.json sidecar so the compositor can skip the affected reel.

export type CampaignWorkerResult = {
  clipId: ClipSpec['id']
  provider: ClipSpec['provider']
  model: ClipSpec['model']
  localPath: string
  bytes: number
  cloudinaryUrl: string | null
  providerJobId: string
  durationSeconds: number
}

async function processCampaignJob(
  job: Job<CampaignJobPayload>,
): Promise<CampaignWorkerResult> {
  const { campaignId, clipId } = job.data
  const spec = CLIP_INDEX[clipId]
  if (!spec) throw new Error(`unknown_clip_id: ${clipId}`)

  const log = logger.child({
    campaignId,
    clipId,
    provider: spec.provider,
    model: spec.model,
    attempt: job.attemptsMade + 1,
  })

  log.info('campaign_job_start', { role: spec.role, sourceImage: spec.sourceImage })
  await job.updateProgress(2)

  const imageUrl = await sourceImageUrl(spec.sourceImage)

  const input: ClipGenInput = {
    clipId: spec.id,
    provider: spec.provider,
    model: spec.model,
    prompt: spec.prompt,
    negativePrompt: spec.negativePrompt,
    imageUrl,
    duration: spec.duration,
    aspectRatio: spec.aspectRatio,
    resolution: spec.resolution,
    seed: spec.seed,
    cfgScale: spec.cfgScale,
  }

  const provider = campaignProviderFor(spec.provider)
  const genResult = await provider.generate(input, (pct) => job.updateProgress(Math.min(90, pct)))
  log.info('campaign_generate_done', { providerJobId: genResult.providerJobId })

  const localPath = rawClipPath(spec.id)
  const bytes = await downloadToFile(genResult.remoteUrl, localPath)
  log.info('campaign_clip_downloaded', { localPath, bytes })

  const cloudinaryUrl = await cloudinaryBackupRaw({
    campaignId,
    clipId: spec.id,
    remoteUrl: genResult.remoteUrl,
  })

  await job.updateProgress(100)

  return {
    clipId: spec.id,
    provider: spec.provider,
    model: spec.model,
    localPath,
    bytes,
    cloudinaryUrl,
    providerJobId: genResult.providerJobId,
    durationSeconds: genResult.durationSeconds,
  }
}

async function writeFailureSidecar(
  payload: CampaignJobPayload | undefined,
  err: Error,
  attemptsMade: number,
) {
  if (!payload) return
  const data = {
    campaignId: payload.campaignId,
    clipId: payload.clipId,
    error: err.message,
    stack: err.stack,
    attemptsMade,
    failedAt: new Date().toISOString(),
  }
  try {
    await writeFile(rawClipFailurePath(payload.clipId), JSON.stringify(data, null, 2))
  } catch (e) {
    logger.warn('failure_sidecar_write_failed', { err: (e as Error).message })
  }
}

export function startCampaignWorker(concurrency = 4) {
  const worker = new Worker<CampaignJobPayload, CampaignWorkerResult>(
    CAMPAIGN_QUEUE_NAME,
    processCampaignJob,
    {
      connection: getRedisConnection(),
      concurrency,
      lockDuration: 10 * 60 * 1000,
    },
  )

  worker.on('completed', (job) => {
    logger.info('campaign_job_completed', { jobId: job.id, clipId: job.data.clipId })
  })

  worker.on('failed', async (job, err) => {
    if (!job) {
      logger.error('campaign_job_failed_no_ref', { err: err?.message })
      return
    }
    const finalAttempt = job.attemptsMade >= (job.opts.attempts ?? 3)
    logger.error('campaign_job_failed', {
      jobId: job.id,
      clipId: job.data?.clipId,
      err: err?.message,
      attemptsMade: job.attemptsMade,
      final: finalAttempt,
    })
    if (finalAttempt) {
      await writeFailureSidecar(job.data, err, job.attemptsMade)
    }
  })

  return worker
}
