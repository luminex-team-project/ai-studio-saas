import 'server-only'

import { v2 as cloudinary } from 'cloudinary'
import { requireCloudinaryEnv } from '@/lib/env'

// Cloudinary is used for two things in this app:
//
//  1. **Staging source images** for providers that need a public URL
//     (Runway / Kling / Luma all fetch by URL, never accept raw bytes).
//     Supabase Storage gives us signed URLs, but those are short-lived and
//     have query strings that some providers reject. Cloudinary gives us a
//     stable public delivery URL.
//  2. **Transcoding provider output** — Kling returns raw .mp4 that is not
//     web-friendly for iOS Safari in some cases; Cloudinary's `eager`
//     transformations normalize to H.264/AAC + generate a thumbnail.
//
// Configured lazily on first use so dev without Cloudinary keys still boots.

let configured = false
function ensureConfigured() {
  if (configured) return
  const { cloudName, apiKey, apiSecret } = requireCloudinaryEnv()
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
  configured = true
}

export type CloudinaryImageResult = {
  publicId: string
  url: string // https, width/height normalized
  width: number
  height: number
  bytes: number
}

export type CloudinaryVideoResult = {
  publicId: string
  url: string
  thumbnailUrl: string
  durationSeconds: number
  bytes: number
}

/**
 * Upload an image buffer to Cloudinary and return the delivery URL.
 * The URL is public but guessability-resistant because of the random publicId.
 * We put everything under `ai-studio/<user>/<job>/` for tidiness + future cleanup.
 */
export async function uploadImageBuffer(
  buf: Buffer,
  opts: { userId: string; jobId: string; index?: number },
): Promise<CloudinaryImageResult> {
  ensureConfigured()
  const folder = `ai-studio/${opts.userId}/${opts.jobId}`
  // `upload_stream` handles Buffers; `upload` requires a path or URL.
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: opts.index !== undefined ? `source_${opts.index}` : undefined,
        overwrite: true,
        // Limit size so adapters don't accidentally ship 20MB to Kling.
        transformation: [{ width: 1536, height: 1536, crop: 'limit', quality: 'auto' }],
      },
      (err, res) => {
        if (err || !res) return reject(err ?? new Error('cloudinary_upload_failed'))
        resolve({
          publicId: res.public_id,
          url: res.secure_url,
          width: res.width ?? 0,
          height: res.height ?? 0,
          bytes: res.bytes ?? 0,
        })
      },
    )
    stream.end(buf)
  })
}

/**
 * Download a video from a provider's URL, transcode to web-safe H.264/AAC,
 * and generate a 1s thumbnail. Returns the final Cloudinary URL + thumb URL.
 * We use Cloudinary's `fetch` flow (it pulls by URL, no local download needed).
 */
export async function ingestProviderVideo(
  remoteUrl: string,
  opts: { userId: string; jobId: string },
): Promise<CloudinaryVideoResult> {
  ensureConfigured()
  const folder = `ai-studio/${opts.userId}/${opts.jobId}`
  const uploadRes = await cloudinary.uploader.upload(remoteUrl, {
    folder,
    resource_type: 'video',
    public_id: 'output',
    overwrite: true,
    // Normalize to web-safe mp4 + generate a keyframe thumb.
    eager: [
      { format: 'mp4', video_codec: 'h264', audio_codec: 'aac', quality: 'auto' },
      { format: 'jpg', width: 720, crop: 'fill', start_offset: '1.0' },
    ],
    eager_async: false,
  })

  const videoDerived = uploadRes.eager?.[0]
  const thumbDerived = uploadRes.eager?.[1]
  if (!videoDerived || !thumbDerived) {
    throw new Error('cloudinary_eager_missing')
  }

  return {
    publicId: uploadRes.public_id,
    url: videoDerived.secure_url,
    thumbnailUrl: thumbDerived.secure_url,
    durationSeconds: Math.round(uploadRes.duration ?? 0),
    bytes: uploadRes.bytes ?? 0,
  }
}

/** Delete everything under a job folder. Best-effort — swallow errors. */
export async function cleanupJobAssets(userId: string, jobId: string) {
  ensureConfigured()
  const folder = `ai-studio/${userId}/${jobId}`
  try {
    await cloudinary.api.delete_resources_by_prefix(folder, { resource_type: 'image' })
    await cloudinary.api.delete_resources_by_prefix(folder, { resource_type: 'video' })
    await cloudinary.api.delete_folder(folder)
  } catch {
    // best-effort
  }
}
