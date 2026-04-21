import 'server-only'

import type { Provider } from '../timeline'
import { runwayCampaignProvider } from './runway'
import { lumaCampaignProvider } from './luma'
import { klingCampaignProvider } from './kling'
import type { CampaignProvider } from './types'

const PROVIDERS: Record<Provider, CampaignProvider> = {
  runway: runwayCampaignProvider,
  luma: lumaCampaignProvider,
  kling: klingCampaignProvider,
}

export function campaignProviderFor(kind: Provider): CampaignProvider {
  const p = PROVIDERS[kind]
  if (!p) throw new Error(`unknown_campaign_provider: ${kind}`)
  return p
}

export type { CampaignProvider, ClipGenInput, ClipGenResult, ProgressFn } from './types'
