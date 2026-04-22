import 'server-only'

import type { VideoProvider } from './types'
import { lumaProvider } from './luma'

// Google Veo 3.1 stub. Native-audio t2v/i2v for Concept 4 B-rolls and any
// shot that benefits from synced ambient audio. Veo lives on Google Cloud
// Vertex AI — access requires GCP project + service-account key.
//
// Expected integration:
//   POST vertex-ai endpoint: projects/<proj>/locations/<loc>/publishers/google/models/veo-3.1:predictLongRunning
//     body: { instances: [{ prompt, image?: { bytesBase64Encoded }, config: { aspectRatio, durationSeconds, generateAudio } }] }
//     returns: long-running operation name
//
// Until GOOGLE_VEO_PROJECT + GOOGLE_APPLICATION_CREDENTIALS_JSON are set,
// delegate to Luma (also strong on cinematic B-roll + smooth camera moves).

const VEO_ENABLED =
  Boolean(process.env.GOOGLE_VEO_PROJECT) &&
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)

export const veoProvider: VideoProvider = {
  name: 'veo',

  async run(ctx) {
    if (!VEO_ENABLED) {
      const result = await lumaProvider.run(ctx)
      return { ...result, providerModel: `veo-fallback:${result.providerModel}` }
    }
    throw new Error('veo_not_implemented')
  },
}
