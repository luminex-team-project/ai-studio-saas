import 'server-only'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { hasCloudinaryEnv, requireCloudinaryEnv } from '@/lib/env'
import { logger } from './logger'
import type { ClipId } from './timeline'

// Storage helpers shared by the campaign worker:
//  - download a provider's remote mp4 to output/raw/{clipId}.mp4
//  - (best-effort) back it up to Cloudinary under {folder}/{campaignId}/raw/{clipId}
//
// Cloudinary backup never blocks: a failure there is logged and swallowed so
// the local pipeline keeps moving.

let cloudinaryConfigured = false
function configureCloudinary() {
  if (cloudinaryConfigured) return
  const { cloudName, apiKey, apiSecret } = requireCloudinaryEnv()
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
  cloudinaryConfigured = true
}

export async function downloadToFile(remoteUrl: string, destPath: string): Promise<number> {
  await mkdir(path.dirname(destPath), { recursive: true })
  const res = await fetch(remoteUrl)
  if (!res.ok) {
    throw new Error(`download_${res.status}: ${remoteUrl.slice(0, 120)}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
  return buf.byteLength
}

export async function cloudinaryBackupRaw(opts: {
  campaignId: string
  clipId: ClipId
  remoteUrl: string
  folder?: string
}): Promise<string | null> {
  if (!hasCloudinaryEnv()) return null
  try {
    configureCloudinary()
    const folder = `${opts.folder ?? 'elom-viral'}/${opts.campaignId}/raw`
    const result = await cloudinary.uploader.upload(opts.remoteUrl, {
      folder,
      resource_type: 'video',
      public_id: opts.clipId,
      overwrite: true,
    })
    return result.secure_url
  } catch (err) {
    logger.warn('cloudinary_backup_failed', {
      clipId: opts.clipId,
      err: (err as Error).message,
    })
    return null
  }
}
