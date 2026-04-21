import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { hasCloudinaryEnv } from '@/lib/env'
import { uploadImageBuffer, ingestProviderVideo } from './cloudinary'
import type { VideoJobRow } from '@/lib/supabase/types'

// Bridge between Supabase Storage (where users upload) and the external
// providers (which fetch by URL). Cloudinary is the preferred path:
//  - Staging: upload → stable public URL
//  - Return : transcode → normalized mp4 + thumbnail
//
// When Cloudinary is not configured, we fall back to Supabase signed URLs
// for staging (providers accept query-string-bearing HTTPS URLs in our
// testing), and we upload the raw provider .mp4 directly to Supabase
// storage for output (no transcoding, no thumbnail extraction).

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6 // 6h — long enough for slow generations

/**
 * Produce provider-reachable URLs for each source image attached to the job.
 */
export async function stageSourceImagesToCloudinary(job: VideoJobRow): Promise<string[]> {
  if (job.source_image_urls.length === 0) return []
  const admin = createAdminClient()

  // Cloudinary path — preferred.
  if (hasCloudinaryEnv()) {
    const urls: string[] = []
    for (let i = 0; i < job.source_image_urls.length; i++) {
      const key = job.source_image_urls[i]
      const { data, error } = await admin.storage.from('sources').download(key)
      if (error || !data) {
        throw new Error(`source_download_failed: ${key} — ${error?.message ?? 'unknown'}`)
      }
      const buf = Buffer.from(await data.arrayBuffer())
      const uploaded = await uploadImageBuffer(buf, {
        userId: job.user_id,
        jobId: job.id,
        index: i,
      })
      urls.push(uploaded.url)
    }
    return urls
  }

  // Fallback: Supabase signed URLs.
  const urls: string[] = []
  for (const key of job.source_image_urls) {
    const { data, error } = await admin.storage
      .from('sources')
      .createSignedUrl(key, SIGNED_URL_TTL_SECONDS)
    if (error || !data?.signedUrl) {
      throw new Error(`source_sign_failed: ${key} — ${error?.message ?? 'unknown'}`)
    }
    urls.push(data.signedUrl)
  }
  return urls
}

/**
 * Ingest a provider's output video and mirror it into Supabase Storage so
 * the app's /result page keeps working. With Cloudinary this also
 * transcodes + generates a thumbnail. Without Cloudinary we upload the raw
 * mp4 and derive a simple thumbnail from the first source image if present.
 */
export async function mirrorProviderOutputToSupabase(
  providerVideoUrl: string,
  job: VideoJobRow,
): Promise<{ videoKey: string; thumbKey: string | null; durationSeconds: number }> {
  const admin = createAdminClient()
  const videoKey = `${job.user_id}/${job.id}.mp4`
  const thumbKey = `${job.user_id}/${job.id}.jpg`

  if (hasCloudinaryEnv()) {
    const ingested = await ingestProviderVideo(providerVideoUrl, {
      userId: job.user_id,
      jobId: job.id,
    })
    const [videoRes, thumbRes] = await Promise.all([
      fetch(ingested.url).then((r) => r.arrayBuffer()),
      fetch(ingested.thumbnailUrl).then((r) => r.arrayBuffer()),
    ])
    const [vUp, tUp] = await Promise.all([
      admin.storage.from('videos').upload(videoKey, Buffer.from(videoRes), {
        contentType: 'video/mp4',
        upsert: true,
      }),
      admin.storage.from('thumbnails').upload(thumbKey, Buffer.from(thumbRes), {
        contentType: 'image/jpeg',
        upsert: true,
      }),
    ])
    if (vUp.error) throw new Error(`video_upload_failed: ${vUp.error.message}`)
    if (tUp.error) throw new Error(`thumb_upload_failed: ${tUp.error.message}`)
    return { videoKey, thumbKey, durationSeconds: ingested.durationSeconds }
  }

  // Fallback: straight proxy — download provider video, upload as-is.
  const videoRes = await fetch(providerVideoUrl)
  if (!videoRes.ok) {
    throw new Error(`provider_video_download_failed: ${videoRes.status}`)
  }
  const buf = Buffer.from(await videoRes.arrayBuffer())
  const vUp = await admin.storage.from('videos').upload(videoKey, buf, {
    contentType: 'video/mp4',
    upsert: true,
  })
  if (vUp.error) throw new Error(`video_upload_failed: ${vUp.error.message}`)

  // Use the first source image as a thumbnail stand-in when no Cloudinary
  // derivation exists. For pure text-to-video jobs we skip the thumbnail.
  let thumb: string | null = null
  if (job.source_image_urls.length > 0) {
    const { data } = await admin.storage.from('sources').download(job.source_image_urls[0])
    if (data) {
      const thumbBuf = Buffer.from(await data.arrayBuffer())
      const tUp = await admin.storage.from('thumbnails').upload(thumbKey, thumbBuf, {
        contentType: 'image/jpeg',
        upsert: true,
      })
      if (!tUp.error) thumb = thumbKey
    }
  }

  return { videoKey, thumbKey: thumb, durationSeconds: 0 }
}
