import 'server-only'

import type { VideoProvider } from './types'
import { klingProvider } from './kling'

// Seedance 2.0 Identity Lock stub.
//
// Goal: Concept 1 commercial ads using yuna/jihoon/haewon reference identities.
// Actual API wiring requires ByteDance Volcano / FAL / Replicate access keys
// which are not yet provisioned (see content-marketing/ README).
//
// Until the real API lands, we fall back to Kling so existing submissions keep
// working. The job row still records provider_kind='seedance' so analytics +
// /admin can track which rows were seeded through this path, and the worker
// can be upgraded atomically once SEEDANCE_API_KEY is set.

const SEEDANCE_ENABLED = Boolean(process.env.SEEDANCE_API_KEY)

export const seedanceProvider: VideoProvider = {
  name: 'seedance',

  async run(ctx) {
    if (!SEEDANCE_ENABLED) {
      // Fallback path — delegate to Kling, keep provider_model tagged so we
      // can distinguish seeded fallbacks from pure-Kling rows in analytics.
      const result = await klingProvider.run(ctx)
      return {
        ...result,
        providerModel: `seedance-fallback:${result.providerModel}`,
      }
    }
    // TODO: implement Seedance 2.0 Identity Lock t2v/i2v once API access is
    // provisioned. Expected shape:
    //   POST https://api.seedance.ai/v2/generate
    //     body: { identity_lock_id, prompt, mode: 't2v'|'i2v', ref_image, duration, aspect_ratio }
    //     returns: { job_id, status, output_url (when ready) }
    //
    // Use ctx.job.product_model_id → fetch product_models.seedance_identity_lock_id.
    throw new Error('seedance_not_implemented')
  },
}
