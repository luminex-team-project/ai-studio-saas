import 'server-only'

import type { VideoJobRow } from '@/lib/supabase/types'
import { klingProvider } from './kling'
import { lumaProvider } from './luma'
import { runwayProvider } from './runway'
import { mockVideoProvider } from './mock'
import { seedanceProvider } from './seedance'
import { heygenProvider } from './heygen'
import { veoProvider } from './veo'
import { hedraProvider } from './hedra'
import type { ProviderKind, VideoProvider } from './types'

// Routing rules cover:
//
//  - Legacy 3 providers (Kling/Runway/Luma) for selfie/product/text2video.
//  - 4 new workflow providers (Seedance/HeyGen/Veo/Hedra) for the 4 concept
//    job types. The new providers currently fall back to their closest legacy
//    peer (Seedance→Kling, HeyGen→Kling, Veo→Luma, Hedra→Kling) until the real
//    API keys are provisioned — see each provider file for the TODO markers.
//
//  Override precedence:
//    options.force_mock → mock
//    options.provider_override → named provider
//    job.provider_kind → named provider
//    concept_id → workflow routing
//    scenario tag → legacy routing

const PROVIDERS: Record<ProviderKind, VideoProvider> = {
  kling: klingProvider,
  runway: runwayProvider,
  luma: lumaProvider,
  mock: mockVideoProvider,
  seedance: seedanceProvider,
  heygen: heygenProvider,
  veo: veoProvider,
  hedra: hedraProvider,
}

type ScenarioTag = 'beauty' | 'people_action' | 'narrative' | 'product' | 'other'

function tagScenario(job: VideoJobRow): ScenarioTag {
  const haystack = `${job.prompt ?? ''} ${job.scenario ?? ''}`.toLowerCase()
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

// Concept-level routing for the 4 new workflows.
// `job.type` is narrowed by the generated types to the legacy 3 values —
// cast to string so the runtime check matches migration-added values
// before `npm run db:types` is re-run.
function routeByConcept(job: VideoJobRow): ProviderKind | null {
  const jobType = job.type as string
  switch (jobType) {
    case 'commercial_ad':
      // Identity-locked product ads → Seedance 2.0 (stub → Kling).
      return 'seedance'
    case 'scene_reenact':
      // Face-preserving i2v → Kling (uses user-uploaded selfie as ref).
      return 'kling'
    case 'trend_clone':
      // Vibe-driven remix. If user uploaded reference image → Kling i2v,
      // else → Luma for "full AI meta" t2v track.
      return job.source_image_urls.length > 0 ? 'kling' : 'luma'
    case 'ai_news':
      // Talking-head avatar → HeyGen (stub → Kling). B-roll is handled by a
      // separate chained job once the news pipeline is wired.
      return 'heygen'
    default:
      return null
  }
}

export function resolveProvider(job: VideoJobRow): VideoProvider {
  const opts = (job.options ?? {}) as {
    provider_override?: ProviderKind
    force_mock?: boolean
  }
  if (opts.force_mock) return PROVIDERS.mock
  if (opts.provider_override && PROVIDERS[opts.provider_override]) {
    return PROVIDERS[opts.provider_override]
  }
  if (job.provider_kind && PROVIDERS[job.provider_kind]) {
    return PROVIDERS[job.provider_kind]
  }
  const conceptRoute = routeByConcept(job)
  if (conceptRoute) return PROVIDERS[conceptRoute]
  const tag = tagScenario(job)
  const hasImage = job.source_image_urls.length > 0
  return PROVIDERS[routeByTag(tag, hasImage)]
}

export function providerByName(name: ProviderKind): VideoProvider {
  return PROVIDERS[name]
}

export type { VideoProvider, ProviderKind } from './types'
