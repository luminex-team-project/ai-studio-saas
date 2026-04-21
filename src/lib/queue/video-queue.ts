import 'server-only'

import { Queue, QueueEvents, type JobsOptions } from 'bullmq'
import { getRedisConnection } from './redis'

// BullMQ queue for video generation jobs. The producer side lives here and is
// imported from server actions + the /api/worker/process route. The consumer
// side is in scripts/worker.mjs running as a separate Node process.

export const VIDEO_QUEUE_NAME = 'video-jobs'

export type VideoJobPayload = {
  jobId: string // video_jobs.id
}

let queueSingleton: Queue<VideoJobPayload> | null = null

export function getVideoQueue() {
  if (queueSingleton) return queueSingleton
  queueSingleton = new Queue<VideoJobPayload>(VIDEO_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 500 },  // keep 500 for debugging
      removeOnFail: { count: 500 },
      attempts: 1, // we refund credits ourselves; retries are opt-in
    },
  })
  return queueSingleton
}

export async function enqueueVideoJob(jobId: string, opts: JobsOptions = {}) {
  const q = getVideoQueue()
  return q.add('generate', { jobId }, { jobId: `video-${jobId}`, ...opts })
}

let eventsSingleton: QueueEvents | null = null

export function getVideoQueueEvents() {
  if (eventsSingleton) return eventsSingleton
  eventsSingleton = new QueueEvents(VIDEO_QUEUE_NAME, {
    connection: getRedisConnection(),
  })
  return eventsSingleton
}
