import 'server-only'

import { Queue, QueueEvents, type JobsOptions } from 'bullmq'
import { getRedisConnection } from '@/lib/queue/redis'
import { CAMPAIGN_ID, type ClipId } from './timeline'
import { queueJobIdFor } from './paths'

// Campaign clip-generation queue. Single queue, all providers multiplex on
// the worker side; simpler to operate than per-provider queues.
//
// JobId = `campaign:${CAMPAIGN_ID}:${clipId}` → BullMQ treats a re-add of the
// same jobId as a no-op for queued/active jobs, and produces the same id on
// the completed set, so re-running `run-all` never regenerates finished clips.

export const CAMPAIGN_QUEUE_NAME = 'campaign-gen-clips'

export type CampaignJobPayload = {
  campaignId: string
  clipId: ClipId
}

let queueSingleton: Queue<CampaignJobPayload> | null = null

export function getCampaignQueue(): Queue<CampaignJobPayload> {
  if (queueSingleton) return queueSingleton
  queueSingleton = new Queue<CampaignJobPayload>(CAMPAIGN_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  })
  return queueSingleton
}

let eventsSingleton: QueueEvents | null = null

export function getCampaignQueueEvents(): QueueEvents {
  if (eventsSingleton) return eventsSingleton
  eventsSingleton = new QueueEvents(CAMPAIGN_QUEUE_NAME, {
    connection: getRedisConnection(),
  })
  return eventsSingleton
}

export async function addCampaignClipJob(
  clipId: ClipId,
  opts: JobsOptions = {},
  campaignId: string = CAMPAIGN_ID,
) {
  const q = getCampaignQueue()
  return q.add(
    'generate',
    { campaignId, clipId },
    {
      jobId: queueJobIdFor(campaignId, clipId),
      ...opts,
    },
  )
}

export { CAMPAIGN_ID } from './timeline'
