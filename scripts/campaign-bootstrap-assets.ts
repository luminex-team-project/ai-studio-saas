#!/usr/bin/env node
// Bootstrap local campaign assets:
//   1. Pretendard Bold font from the official GitHub release (CC0 licensed).
//   2. (Best-effort) Sync SFX + BGM audio from Supabase bucket `campaign-assets`
//      to local assets/sfx/ and assets/bgm/.
//
// Safe to re-run: only downloads what's missing. Never fails the process —
// the compositor already handles missing audio gracefully with anullsrc.

import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { createAdminClient } from '../src/lib/supabase/admin'
import {
  BGM_DIR,
  FONTS_DIR,
  SFX_DIR,
} from '../src/lib/campaign/paths'
import { logger } from '../src/lib/campaign/logger'

// Pretendard Bold — official release, 1.3MB.
const PRETENDARD_URL =
  'https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip'
const PRETENDARD_BOLD_DIRECT =
  'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf'

const SUPABASE_BUCKET = process.env.CAMPAIGN_ASSETS_BUCKET ?? 'campaign-assets'
const SFX_FILES = ['whoosh.mp3', 'chime.mp3', 'droplet.mp3', 'impact.mp3']
const BGM_FILES = ['lofi_drop.mp3']

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function downloadFontIfMissing() {
  await mkdir(FONTS_DIR, { recursive: true })
  // libass accepts both .ttf and .otf; the Pretendard release ships OTF for
  // the static variant. We save as .otf and the compositor's ASS header uses
  // the family name "Pretendard" which fontconfig resolves by either extension.
  const targetTtf = path.join(FONTS_DIR, 'Pretendard-Bold.ttf')
  const targetOtf = path.join(FONTS_DIR, 'Pretendard-Bold.otf')
  if ((await exists(targetTtf)) || (await exists(targetOtf))) {
    logger.info('font_present', { dir: FONTS_DIR })
    return
  }
  logger.info('font_download_start', { url: PRETENDARD_BOLD_DIRECT })
  const res = await fetch(PRETENDARD_BOLD_DIRECT)
  if (!res.ok) {
    logger.warn('font_download_failed', {
      status: res.status,
      hint: `Grab Pretendard-Bold.ttf manually from ${PRETENDARD_URL} and place in ${FONTS_DIR}`,
    })
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(targetOtf, buf)
  logger.info('font_downloaded', { path: targetOtf, bytes: buf.byteLength })
}

async function syncAudioFromSupabase(
  subpath: 'sfx' | 'bgm',
  files: string[],
  targetDir: string,
) {
  await mkdir(targetDir, { recursive: true })
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err) {
    logger.warn('supabase_admin_unavailable', {
      err: (err as Error).message,
      hint: 'SUPABASE_SERVICE_ROLE_KEY is required to sync audio from Supabase',
    })
    return
  }

  for (const file of files) {
    const localPath = path.join(targetDir, file)
    if (await exists(localPath)) continue
    const key = `${subpath}/${file}`
    const { data, error } = await admin.storage.from(SUPABASE_BUCKET).download(key)
    if (error || !data) {
      logger.warn('audio_missing_in_bucket', {
        bucket: SUPABASE_BUCKET,
        key,
        err: error?.message,
        hint: `Upload ${file} to ${SUPABASE_BUCKET}/${key} — the compositor will otherwise fall back to silence for this cue`,
      })
      continue
    }
    const buf = Buffer.from(await data.arrayBuffer())
    await writeFile(localPath, buf)
    logger.info('audio_downloaded', { localPath, bytes: buf.byteLength })
  }
}

async function main() {
  logger.info('bootstrap_start', {
    fontsDir: FONTS_DIR,
    sfxDir: SFX_DIR,
    bgmDir: BGM_DIR,
    bucket: SUPABASE_BUCKET,
  })
  await downloadFontIfMissing()
  await syncAudioFromSupabase('sfx', SFX_FILES, SFX_DIR)
  await syncAudioFromSupabase('bgm', BGM_FILES, BGM_DIR)
  logger.info('bootstrap_done')
}

main().catch((err) => {
  logger.error('bootstrap_failed', { err: (err as Error).message })
  process.exit(1)
})
