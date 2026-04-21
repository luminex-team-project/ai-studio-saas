import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { VideoProvider } from './types'

// Dev/demo provider: no real generation. Walks through the 4 stages with short
// delays, copies the first source image into the `thumbnails` bucket as the
// output thumbnail, and returns without an output video. `/result` gracefully
// renders the thumbnail when no video is present.

const STAGE_PROGRESSES = [20, 40, 60, 80, 100]

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockVideoProvider: VideoProvider = {
  name: 'mock',

  async run({ job, onProgress }) {
    for (const p of STAGE_PROGRESSES) {
      await wait(1500)
      await onProgress(p)
    }

    // Copy the first source image into `thumbnails/<user_id>/<job_id>.jpg`
    // as a placeholder "output" so /result can render something real.
    let thumbnailPath: string | null = null
    const firstSource = job.source_image_urls[0]
    if (firstSource) {
      const admin = createAdminClient()
      const { data: file, error: dlErr } = await admin.storage
        .from('sources')
        .download(firstSource)
      if (!dlErr && file) {
        const targetKey = `${job.user_id}/${job.id}.jpg`
        const { error: upErr } = await admin.storage
          .from('thumbnails')
          .upload(targetKey, file, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          })
        if (!upErr) thumbnailPath = targetKey
      }
    }

    return {
      outputVideoUrl: null,
      outputThumbnailUrl: thumbnailPath,
      durationSeconds: 15,
      providerJobId: `mock_${job.id}`,
      providerModel: 'mock',
    }
  },
}
