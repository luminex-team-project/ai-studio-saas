import 'server-only'

import type { VideoProvider } from './types'
import { klingProvider } from './kling'

// HeyGen Photo Avatar stub. Concept 4 AI news avatar talking heads.
// HEYGEN_API_KEY + per-user avatar/voice IDs required.
// Expected API shape (v2):
//   POST https://api.heygen.com/v2/video/generate
//     body: { video_inputs: [{ character: { type: 'avatar', avatar_id }, voice: { type: 'audio'|'text', input_text } }], dimension: { width, height } }
//     returns: { video_id }
//   GET https://api.heygen.com/v1/video_status.get?video_id=...
//     returns: { data: { status, video_url, thumbnail_url, duration } }

const HEYGEN_ENABLED = Boolean(process.env.HEYGEN_API_KEY)

export const heygenProvider: VideoProvider = {
  name: 'heygen',

  async run(ctx) {
    if (!HEYGEN_ENABLED) {
      const result = await klingProvider.run(ctx)
      return { ...result, providerModel: `heygen-fallback:${result.providerModel}` }
    }
    throw new Error('heygen_not_implemented')
  },
}
