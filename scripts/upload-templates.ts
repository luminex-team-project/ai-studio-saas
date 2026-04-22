#!/usr/bin/env node
// Upload template preview assets to Supabase Storage and sync public URLs
// back to the `templates` table.
//
// Layout:
//   assets/templates/<slug>/preview.mp4      — required
//   assets/templates/<slug>/thumbnail.jpg    — optional, auto-derived if missing
//   assets/templates/<slug>/thumbnail.png    — alternative
//
// Run: npx tsx --env-file=.env.local scripts/upload-templates.ts
// Or:  npx tsx --env-file=.env.local scripts/upload-templates.ts <slug> [<slug>...]

import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, extname, basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

const BUCKET = 'templates'
const ASSETS_ROOT = resolve(process.cwd(), 'assets/templates')

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required in .env.local`)
  return v
}

function admin() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function findThumbnail(slugDir: string): Promise<string | null> {
  for (const name of ['thumbnail.jpg', 'thumbnail.jpeg', 'thumbnail.png', 'thumbnail.webp']) {
    const p = resolve(slugDir, name)
    if (await fileExists(p)) return p
  }
  return null
}

async function uploadOne(
  client: ReturnType<typeof admin>,
  slug: string,
  localPath: string,
  remoteName: string,
): Promise<string> {
  const buf = await readFile(localPath)
  const mime = MIME[extname(localPath).toLowerCase()]
  if (!mime) throw new Error(`unsupported extension: ${localPath}`)

  const key = `${slug}/${remoteName}`
  const { error } = await client.storage.from(BUCKET).upload(key, buf, {
    contentType: mime,
    upsert: true,
  })
  if (error) throw new Error(`upload ${key} failed: ${error.message}`)
  const { data } = client.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

async function processSlug(client: ReturnType<typeof admin>, slug: string): Promise<{
  slug: string
  preview?: string
  thumb?: string | null
  skipped?: string
}> {
  const dir = resolve(ASSETS_ROOT, slug)
  if (!(await fileExists(dir))) {
    return { slug, skipped: `no dir at ${dir}` }
  }

  const previewPath = resolve(dir, 'preview.mp4')
  if (!(await fileExists(previewPath))) {
    return { slug, skipped: `missing preview.mp4 in ${dir}` }
  }

  const thumbPath = await findThumbnail(dir)

  const previewUrl = await uploadOne(client, slug, previewPath, 'preview.mp4')
  const thumbUrl = thumbPath
    ? await uploadOne(client, slug, thumbPath, `thumbnail${extname(thumbPath).toLowerCase()}`)
    : null

  const { error: updateErr } = await client
    .from('templates')
    .update({
      preview_video_url: previewUrl,
      ...(thumbUrl ? { thumbnail_url: thumbUrl } : {}),
    })
    .eq('slug', slug)
  if (updateErr) throw new Error(`db update failed for ${slug}: ${updateErr.message}`)

  return { slug, preview: previewUrl, thumb: thumbUrl }
}

async function main() {
  const args = process.argv.slice(2)

  if (!(await fileExists(ASSETS_ROOT))) {
    console.error(`missing ${ASSETS_ROOT} — create it and add <slug>/preview.mp4`)
    process.exit(1)
  }

  const slugs =
    args.length > 0
      ? args
      : (await readdir(ASSETS_ROOT, { withFileTypes: true }))
          .filter((d) => d.isDirectory())
          .map((d) => d.name)

  if (slugs.length === 0) {
    console.error(`no slug dirs in ${ASSETS_ROOT}`)
    process.exit(1)
  }

  const client = admin()

  for (const slug of slugs) {
    try {
      const r = await processSlug(client, slug)
      if (r.skipped) {
        console.log(`⚠  ${slug} — ${r.skipped}`)
      } else {
        console.log(`✅ ${slug}`)
        console.log(`   preview: ${r.preview}`)
        if (r.thumb) console.log(`   thumb:   ${r.thumb}`)
      }
    } catch (e) {
      console.error(`❌ ${slug}:`, e instanceof Error ? e.message : e)
    }
  }

  // Final sanity check — list rows with missing URLs so the operator knows.
  const { data: missing } = await client
    .from('templates')
    .select('slug, preview_video_url')
    .is('preview_video_url', null)
  if (missing && missing.length > 0) {
    console.log(
      `\ntemplates still missing preview_video_url: ${missing
        .map((m) => m.slug)
        .join(', ')}`,
    )
  }
  void basename
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
