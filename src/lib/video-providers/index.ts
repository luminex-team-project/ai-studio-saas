import 'server-only'

import type { VideoJobRow } from '@/lib/supabase/types'
import { klingProvider } from './kling'
import { lumaProvider } from './luma'
import { runwayProvider } from './runway'
import { mockVideoProvider } from './mock'
import type { ProviderKind, VideoProvider } from './types'

// Routing rules for the 3 scenarios mapped in the design doc:
//
//  1. Beauty / mask pack (image-to-video, single model talking to camera):
//     Kling 2.5 Pro — best face/skin consistency, handles product hand-off.
//  2. Game arcade / multi-person action (text-to-video, dynamic crowd scene):
//     Kling 2.5 Pro — best with multiple subjects + fast motion.
//  3. Narrative / concept montage (text-to-video, abstract):
//     Luma Ray 2 — strongest on smooth camera moves + scene transitions.
//
// `options.provider_override` in the job row bypasses the rules so the
// Phase-1 comparison test can pin a specific provider per run.

const PROVIDERS: Record<ProviderKind, VideoProvider> = {
  kling: klingProvider,
  runway: runwayProvider,
  luma: lumaProvider,
  mock: mockVideoProvider,
}

type ScenarioTag = 'beauty' | 'people_action' | 'narrative' | 'product' | 'other'

function tagScenario(job: VideoJobRow): ScenarioTag {
  const haystack = `${job.prompt ?? ''} ${job.scenario ?? ''}`.toLowerCase()
  // Keep this intentionally small + explicit. Tags should match the 3
  // reference scenarios and nothing else; unmatched → 'other' → default.
  if (/(마스크팩|화장품|뷰티|립|크림|스킨|토너|mask|beauty|skincare)/.test(haystack)) {
    return 'beauty'
  }
  if (/(게임|아케이드|댄스|액션|발판|pump|협동|친구들|여중생|남중생|arcade|game)/.test(haystack)) {
    return 'people_action'
  }
  if (/(사주|관상|부|0\.1%|성공|내러티브|스토리|narrative|concept)/.test(haystack)) {
    return 'narrative'
  }
  if (job.type === 'product') return 'product'
  return 'other'
}

function routeByTag(tag: ScenarioTag, hasImage: boolean): ProviderKind {
  switch (tag) {
    case 'beauty':
      // i2v: Kling wins on realistic face + product. Falls back to Runway if
      // no image provided (shouldn't happen for beauty, but safe).
      return hasImage ? 'kling' : 'luma'
    case 'people_action':
      return 'kling'
    case 'narrative':
      return 'luma'
    case 'product':
      return hasImage ? 'kling' : 'luma'
    case 'other':
    default:
      return hasImage ? 'kling' : 'luma'
  }
}

export function resolveProvider(job: VideoJobRow): VideoProvider {
  // Honor an explicit override first — needed for the Phase-1 comparison
  // where we pin every combination of (scenario × provider).
  const opts = (job.options ?? {}) as {
    provider_override?: ProviderKind
    force_mock?: boolean
  }
  if (opts.force_mock) return PROVIDERS.mock
  if (opts.provider_override && PROVIDERS[opts.provider_override]) {
    return PROVIDERS[opts.provider_override]
  }
  // Typed column wins over freeform text column.
  if (job.provider_kind && PROVIDERS[job.provider_kind]) {
    return PROVIDERS[job.provider_kind]
  }
  const tag = tagScenario(job)
  const hasImage = job.source_image_urls.length > 0
  return PROVIDERS[routeByTag(tag, hasImage)]
}

export function providerByName(name: ProviderKind): VideoProvider {
  return PROVIDERS[name]
}

export type { VideoProvider, ProviderKind } from './types'
