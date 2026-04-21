#!/usr/bin/env node
// Single-command campaign runner:
//   1. Verify sources.json exists (fail fast otherwise).
//   2. Enqueue 8 distinct clip-generation jobs.
//   3. Print a live progress table every 5 s until all jobs settle.
//   4. Invoke the compositor for all 3 reels.
//   5. Print a final summary.
//
// The worker (`npm run campaign:worker`) must already be running in another
// terminal — this script only produces + orchestrates.

import { readFile } from 'node:fs/promises'
import { enqueueCampaign } from '../src/lib/campaign/enqueue'
import { composeAll } from '../src/lib/campaign/compositor/compose'
import {
  getCampaignQueue,
  getCampaignQueueEvents,
  CAMPAIGN_ID,
} from '../src/lib/campaign/queue'
import { SOURCES_JSON } from '../src/lib/campaign/paths'
import { CLIP_INDEX, type ClipId } from '../src/lib/campaign/timeline'
import { getRedisConnection } from '../src/lib/queue/redis'
import { logger } from '../src/lib/campaign/logger'

const PROGRESS_INTERVAL_MS = 5000

async function ensureSourcesManifest() {
  try {
    await readFile(SOURCES_JSON, 'utf8')
  } catch {
    throw new Error(
      `${SOURCES_JSON} not found. Run \`npm run campaign:upload\` first to upload mask_0..2 to Cloudinary.`,
    )
  }
}

type JobRow = {
  clipId: ClipId
  provider: string
  state: string
  attempts: number
  elapsedSec: number
}

async function readStates(jobIds: string[]): Promise<JobRow[]> {
  const q = getCampaignQueue()
  const now = Date.now()
  const rows: JobRow[] = []
  for (const jobId of jobIds) {
    const job = await q.getJob(jobId)
    if (!job) {
      rows.push({
        clipId: 'unknown' as ClipId,
        provider: '-',
        state: 'missing',
        attempts: 0,
        elapsedSec: 0,
      })
      continue
    }
    const state = await job.getState()
    const clipId = (job.data as { clipId: ClipId }).clipId
    const spec = CLIP_INDEX[clipId]
    const startedAt = job.processedOn ?? job.timestamp
    rows.push({
      clipId,
      provider: spec?.provider ?? '-',
      state,
      attempts: job.attemptsMade,
      elapsedSec: Math.round((now - startedAt) / 1000),
    })
  }
  return rows
}

function printTable(rows: JobRow[]) {
  const header = 'clipId'.padEnd(10) + 'provider'.padEnd(10) + 'state'.padEnd(14) + 'attempt'.padEnd(10) + 'elapsed'
  const line = '-'.repeat(header.length)
  const body = rows.map(
    (r) =>
      r.clipId.padEnd(10) +
      r.provider.padEnd(10) +
      r.state.padEnd(14) +
      String(r.attempts).padEnd(10) +
      `${r.elapsedSec}s`,
  )
  process.stdout.write('\n' + [header, line, ...body].join('\n') + '\n')
}

async function waitForJobs(jobIds: string[], events = getCampaignQueueEvents()) {
  const settled = new Set<string>()
  const failed = new Map<string, string>()

  const start = Date.now()
  const timeoutMs = 30 * 60 * 1000

  // Poll states every 5s and emit the progress table until all jobs settle.
  while (settled.size < jobIds.length) {
    const rows = await readStates(jobIds)
    printTable(rows)
    for (const row of rows) {
      const jobId = `campaign:${CAMPAIGN_ID}:${row.clipId}`
      if (row.state === 'completed' || row.state === 'failed') {
        settled.add(jobId)
        if (row.state === 'failed') failed.set(jobId, 'see worker logs')
      }
    }
    if (Date.now() - start > timeoutMs) {
      logger.error('wait_for_jobs_timeout', { settled: settled.size, total: jobIds.length })
      break
    }
    if (settled.size === jobIds.length) break
    await new Promise((r) => setTimeout(r, PROGRESS_INTERVAL_MS))
  }

  // Silence unused binding — kept for future eager event wiring.
  void events

  return { settled, failed }
}

async function main() {
  logger.info('run_all_start', { campaignId: CAMPAIGN_ID })

  await ensureSourcesManifest()

  const jobs = await enqueueCampaign({ campaignId: CAMPAIGN_ID })
  const jobIds = jobs.map((j) => j.id).filter((id): id is string => typeof id === 'string')
  logger.info('run_all_enqueued', { count: jobIds.length, jobIds })

  const { settled, failed } = await waitForJobs(jobIds)
  logger.info('run_all_jobs_settled', {
    settled: settled.size,
    failed: failed.size,
  })

  // Always try to compose; the compositor skips reels whose clips failed.
  const results = await composeAll(CAMPAIGN_ID)

  // ── Summary ───────────────────────────────────────────────────────────
  process.stdout.write('\n=== Composition Summary ===\n')
  for (const r of results) {
    if (r.ok) {
      const mb = (r.bytes / 1024 / 1024).toFixed(2)
      process.stdout.write(
        `[REEL ${r.reelId}] OK  ${r.outputPath}  ${mb} MB  ${r.durationSeconds.toFixed(2)}s\n` +
          (r.bgmMissing ? '  ⚠ BGM missing — silent base track\n' : '') +
          (r.sfxMissingIndexes.length
            ? `  ⚠ ${r.sfxMissingIndexes.length} SFX cue(s) missing — substituted with silence\n`
            : ''),
      )
    } else {
      process.stdout.write(`[REEL ${r.reelId}] SKIPPED (${r.reason})\n`)
    }
  }

  await getRedisConnection().quit()
  process.exit(0)
}

main().catch(async (err) => {
  logger.error('run_all_failed', { err: (err as Error).message })
  try {
    await getRedisConnection().quit()
  } catch {
    // ignore
  }
  process.exit(1)
})
