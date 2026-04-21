#!/usr/bin/env node
// Standalone BullMQ worker for video_jobs.
//
// Run with:  npm run worker
//
// Requires: REDIS_URL set in .env.local. tsx auto-loads TS from src/.

import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { runVideoJob } from '../src/lib/video-providers/runner'

const rawRedisUrl = process.env.REDIS_URL
if (!rawRedisUrl) {
  console.error('REDIS_URL is required. Set it in .env.local.')
  process.exit(1)
}

// Upstash requires TLS; auto-upgrade redis:// for upstash.io hosts.
const redisUrl = (() => {
  try {
    const u = new URL(rawRedisUrl)
    if (u.protocol === 'redis:' && u.hostname.endsWith('upstash.io')) u.protocol = 'rediss:'
    return u.toString()
  } catch {
    return rawRedisUrl
  }
})()

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const worker = new Worker<{ jobId: string }>(
  'video-jobs',
  async (job) => {
    const { jobId } = job.data
    console.log(`[worker] starting ${jobId}`)
    const result = await runVideoJob(jobId)
    if (!result.ok) {
      console.error(`[worker] failed ${jobId}:`, result.error)
      throw new Error(result.error)
    }
    console.log(`[worker] completed ${jobId}`)
    return result
  },
  {
    connection,
    concurrency: 2,
    lockDuration: 10 * 60 * 1000,
  },
)

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err?.message)
})

process.on('SIGTERM', async () => {
  console.log('[worker] SIGTERM received, shutting down...')
  await worker.close()
  await connection.quit()
  process.exit(0)
})

console.log('[worker] ready — listening on queue "video-jobs"')
