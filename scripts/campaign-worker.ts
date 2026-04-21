#!/usr/bin/env node
// Standalone BullMQ worker for the EloM campaign clip-generation queue.
//
// Run with:  npm run campaign:worker
//
// Requires: REDIS_URL in .env.local plus at least one provider's credentials
// (RUNWAY_API_KEY / LUMA_API_KEY / KLING_API_KEY + KLING_API_SECRET).

import { startCampaignWorker } from '../src/lib/campaign/worker'
import { getRedisConnection } from '../src/lib/queue/redis'
import { logger } from '../src/lib/campaign/logger'
import { CAMPAIGN_QUEUE_NAME } from '../src/lib/campaign/queue'

const concurrency = Number(process.env.CAMPAIGN_WORKER_CONCURRENCY ?? 4)
const worker = startCampaignWorker(concurrency)

logger.info('campaign_worker_ready', { queue: CAMPAIGN_QUEUE_NAME, concurrency })

async function shutdown(signal: string) {
  logger.warn('campaign_worker_shutdown', { signal })
  await worker.close()
  await getRedisConnection().quit()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
