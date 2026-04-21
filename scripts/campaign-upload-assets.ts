#!/usr/bin/env node
// Upload the 3 EloM mask source images to Cloudinary so provider APIs have a
// stable public URL to fetch. Writes output/sources.json as the manifest the
// campaign worker reads at runtime.
//
// Source precedence:
//   1. Local files at assets/mask_{0,1,2}.jpg — fastest path for testing.
//   2. Supabase bucket `sources/{userId}/bench/mask_{0,1,2}.jpg` — production
//      path matching the user's existing upload flow. userId resolved from
//      env BENCH_USER_ID, or BENCH_USER_EMAIL → profile lookup.

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { createAdminClient } from '../src/lib/supabase/admin'
import { requireCloudinaryEnv } from '../src/lib/env'
import { ASSETS_DIR, OUTPUT_DIR, SOURCES_JSON } from '../src/lib/campaign/paths'
import { CAMPAIGN_ID, type SourceImage } from '../src/lib/campaign/timeline'
import type { SourcesManifest } from '../src/lib/campaign/sources'
import { logger } from '../src/lib/campaign/logger'

const MASK_IMAGES: SourceImage[] = ['mask_0', 'mask_1', 'mask_2']
const CLOUDINARY_FOLDER = process.env.CAMPAIGN_CLOUDINARY_FOLDER ?? 'elom-viral'

function configureCloudinary() {
  const { cloudName, apiKey, apiSecret } = requireCloudinaryEnv()
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

async function localMaskBuffer(key: SourceImage): Promise<Buffer | null> {
  const local = path.join(ASSETS_DIR, `${key}.jpg`)
  try {
    await stat(local)
    return await readFile(local)
  } catch {
    return null
  }
}

async function resolveUserId(): Promise<string> {
  const direct = process.env.BENCH_USER_ID
  if (direct) return direct
  const email = process.env.BENCH_USER_EMAIL ?? 'acepark14@gmail.com'
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  if (error) throw new Error(`profile_lookup_failed: ${error.message}`)
  if (!data) {
    throw new Error(
      `no profile for email=${email}. Sign in once at /auth/signin to create one, or set BENCH_USER_ID directly.`,
    )
  }
  return data.id
}

async function supabaseMaskBuffer(key: SourceImage, userId: string): Promise<Buffer> {
  const admin = createAdminClient()
  const bucketKey = `${userId}/bench/${key}.jpg`
  const { data, error } = await admin.storage.from('sources').download(bucketKey)
  if (error || !data) {
    throw new Error(
      `supabase_mask_download_failed ${bucketKey}: ${error?.message ?? 'unknown'}. Upload it to the 'sources' bucket first.`,
    )
  }
  return Buffer.from(await data.arrayBuffer())
}

async function uploadBufferToCloudinary(buf: Buffer, key: SourceImage, campaignId: string) {
  const folder = `${CLOUDINARY_FOLDER}/${campaignId}/source`
  return await new Promise<{ publicId: string; url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: key,
        overwrite: true,
        transformation: [{ width: 1536, height: 1536, crop: 'limit', quality: 'auto' }],
      },
      (err, res) => {
        if (err || !res) return reject(err ?? new Error('cloudinary_upload_failed'))
        resolve({ publicId: res.public_id, url: res.secure_url })
      },
    )
    stream.end(buf)
  })
}

async function main() {
  configureCloudinary()
  await mkdir(OUTPUT_DIR, { recursive: true })

  let userId: string | null = null
  const images = {} as SourcesManifest['images']

  for (const key of MASK_IMAGES) {
    logger.info('mask_resolve', { key })
    let buf = await localMaskBuffer(key)
    if (!buf) {
      if (!userId) userId = await resolveUserId()
      logger.info('mask_from_supabase', { key, userId })
      buf = await supabaseMaskBuffer(key, userId)
    } else {
      logger.info('mask_from_local', { key, bytes: buf.byteLength })
    }
    const uploaded = await uploadBufferToCloudinary(buf, key, CAMPAIGN_ID)
    images[key] = uploaded
    logger.info('mask_uploaded', { key, url: uploaded.url })
  }

  const manifest: SourcesManifest = {
    campaignId: CAMPAIGN_ID,
    uploadedAt: new Date().toISOString(),
    images,
  }
  await writeFile(SOURCES_JSON, JSON.stringify(manifest, null, 2), 'utf8')
  logger.info('sources_manifest_written', { path: SOURCES_JSON })
}

main().catch((err) => {
  logger.error('upload_failed', { err: (err as Error).message })
  process.exit(1)
})
