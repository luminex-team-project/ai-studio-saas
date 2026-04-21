import 'server-only'

import { readFile } from 'node:fs/promises'
import { SOURCES_JSON } from './paths'
import type { SourceImage } from './timeline'

// sources.json is written by scripts/campaign-upload-assets.ts and maps the
// three source images used by the campaign to provider-reachable URLs.
// The worker reads it on startup; if it's missing we fail fast with a helpful
// message instead of generating silently from the wrong inputs.

export type SourcesManifest = {
  campaignId: string
  uploadedAt: string
  images: Record<SourceImage, { publicId: string; url: string }>
}

let cached: SourcesManifest | null = null

export async function loadSourcesManifest(): Promise<SourcesManifest> {
  if (cached) return cached
  let raw: string
  try {
    raw = await readFile(SOURCES_JSON, 'utf8')
  } catch {
    throw new Error(
      `sources.json not found at ${SOURCES_JSON}. Run \`npm run campaign:upload\` first to upload mask_0..2 to Cloudinary.`,
    )
  }
  const parsed = JSON.parse(raw) as SourcesManifest
  if (!parsed?.images?.mask_0 || !parsed.images.mask_1 || !parsed.images.mask_2) {
    throw new Error(`sources.json missing one or more of mask_0/mask_1/mask_2 entries`)
  }
  cached = parsed
  return parsed
}

export async function sourceImageUrl(key: SourceImage): Promise<string> {
  const m = await loadSourcesManifest()
  return m.images[key].url
}
