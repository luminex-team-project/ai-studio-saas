import 'server-only'

import { addCampaignClipJob } from './queue'
import {
  CAMPAIGN_ID,
  CLIPS,
  distinctClipIdsForCampaign,
  type ClipId,
} from './timeline'
import { logger } from './logger'

// Enqueue helpers. The default `enqueueCampaign()` enqueues only the 8
// distinct clips referenced by REEL_A/B/C (hook_a dedups with clip_1 since
// their prompts are identical — clip_1 is a fallback). Pass `includeFallback`
// to also enqueue clip_1 if you need it standalone.

export type EnqueueOptions = {
  campaignId?: string
  includeFallback?: boolean
  only?: ClipId[]
}

export async function enqueueCampaign(opts: EnqueueOptions = {}) {
  const campaignId = opts.campaignId ?? CAMPAIGN_ID
  const allClipIds = new Set<ClipId>(CLIPS.map((c) => c.id))
  let targets: ClipId[]

  if (opts.only?.length) {
    targets = opts.only.filter((id) => allClipIds.has(id))
  } else {
    targets = distinctClipIdsForCampaign()
    if (opts.includeFallback && !targets.includes('clip_1')) {
      targets = [...targets, 'clip_1']
    }
  }

  logger.info('enqueue_campaign', { campaignId, count: targets.length, clips: targets })

  const jobs = []
  for (const clipId of targets) {
    const job = await addCampaignClipJob(clipId, {}, campaignId)
    jobs.push(job)
  }
  return jobs
}
