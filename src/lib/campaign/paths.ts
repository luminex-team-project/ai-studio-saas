import path from 'node:path'
import type { ClipId, ReelVariant } from './timeline'

// All filesystem conventions for the campaign pipeline live here so the
// worker, compositor, and scripts agree on a single layout.

export const REPO_ROOT = process.cwd()
export const OUTPUT_DIR = path.join(REPO_ROOT, 'output')
export const RAW_DIR = path.join(OUTPUT_DIR, 'raw')
export const COMPOSED_DIR = path.join(OUTPUT_DIR, 'composed')
export const SOURCES_JSON = path.join(OUTPUT_DIR, 'sources.json')

export const ASSETS_DIR = path.join(REPO_ROOT, 'assets')
export const SFX_DIR = path.join(ASSETS_DIR, 'sfx')
export const BGM_DIR = path.join(ASSETS_DIR, 'bgm')
export const LUT_DIR = path.join(ASSETS_DIR, 'lut')
export const FONTS_DIR = path.join(ASSETS_DIR, 'fonts')

export function rawClipPath(clipId: ClipId): string {
  return path.join(RAW_DIR, `${clipId}.mp4`)
}

export function rawClipFailurePath(clipId: ClipId): string {
  return path.join(RAW_DIR, `${clipId}.failed.json`)
}

export function composedReelPath(campaignId: string, reelId: ReelVariant['id']): string {
  return path.join(COMPOSED_DIR, `${campaignId}_hook_${reelId}.mp4`)
}

/** BullMQ jobId → dedupes re-enqueues of the same clip within a campaign. */
export function queueJobIdFor(campaignId: string, clipId: ClipId): string {
  return `campaign:${campaignId}:${clipId}`
}
