import 'server-only'

import type { VideoProvider } from './types'
import { klingProvider } from './kling'

// Hedra lipsync stub. Post-production layer for talking shots — turns a
// silent portrait video + audio track into lipsynced output. Not a primary
// generator; used via pipeline chaining when a shot carries dialogue.
//
// Expected integration (Hedra Studio API):
//   POST https://mercury.dev.dream-machine.lumalabs.ai/character/generations
//     body: { audio_source, avatar_image_url, aspect_ratio }
//     returns: { generation_id }
//
// Keep this as a named provider even though the MVP uses Kling directly —
// enables future pipeline step: Kling t2v (silent) → Hedra lipsync pass.

const HEDRA_ENABLED = Boolean(process.env.HEDRA_API_KEY)

export const hedraProvider: VideoProvider = {
  name: 'hedra',

  async run(ctx) {
    if (!HEDRA_ENABLED) {
      const result = await klingProvider.run(ctx)
      return { ...result, providerModel: `hedra-fallback:${result.providerModel}` }
    }
    throw new Error('hedra_not_implemented')
  },
}
