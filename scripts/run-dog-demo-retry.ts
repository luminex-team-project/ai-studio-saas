#!/usr/bin/env node
// Recover v1 and v3 from the trio run:
//   v1 · keep polling the existing Kling multi-image2video task
//   v3 · re-upload a looped >3s reference video, retry Runway Act-Two
//
// Run: tsx --env-file=.env.local scripts/run-dog-demo-retry.ts
import jwt from 'jsonwebtoken'
import RunwayML from '@runwayml/sdk'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

const SUPABASE_URL = must('NEXT_PUBLIC_SUPABASE_URL')
const SRK = must('SUPABASE_SERVICE_ROLE_KEY')
const KL_AK = must('KLING_API_KEY')
const KL_SK = must('KLING_API_SECRET')
const RW_KEY = must('RUNWAY_API_KEY')

function must(n: string): string {
  const v = process.env[n]
  if (!v) throw new Error(`${n} missing`)
  return v
}

const admin = createClient<Database>(SUPABASE_URL, SRK, { auth: { persistSession: false }})
const PERSON_URL = `${SUPABASE_URL}/storage/v1/object/public/templates/cute-dog-greeting/HS_2.JPG`

// Task IDs from the previous run (will be re-polled with longer timeout).
const V1_TASK_ID = '875717822407245901'

function klingJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: KL_AK, exp: now + 1800, nbf: now - 5 },
    KL_SK,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' }},
  )
}

async function klingGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`https://api-singapore.klingai.com${path}`, {
    headers: { Authorization: `Bearer ${klingJwt()}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`kling_GET_${path}: ${res.status} ${text.slice(0, 300)}`)
  const parsed = JSON.parse(text) as { code: number; message: string; data: T }
  if (parsed.code !== 0) throw new Error(`kling_err ${parsed.code}: ${parsed.message}`)
  return parsed.data
}

async function pollKlingV1(): Promise<string> {
  console.log(`[v1] polling existing task ${V1_TASK_ID} with 15min budget`)
  const timeoutMs = 15 * 60 * 1000
  const start = Date.now()
  // Try multiple endpoints since we don't remember which resource the multi
  // endpoint mapped to for status reads.
  const resources = ['multi-image2video', 'image2video']
  while (true) {
    for (const r of resources) {
      try {
        const data = await klingGet<{
          task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
          task_status_msg?: string
          task_result?: { videos: Array<{ url: string }> }
        }>(`/v1/videos/${r}/${V1_TASK_ID}`)
        if (data.task_status === 'succeed') {
          const url = data.task_result?.videos?.[0]?.url
          if (!url) throw new Error('v1_no_video')
          return url
        }
        if (data.task_status === 'failed') {
          throw new Error(`v1_failed: ${data.task_status_msg ?? 'unknown'}`)
        }
        // Found the right resource and still running — log and keep polling.
        console.log(`[v1] status=${data.task_status} (resource=${r}) elapsed=${Math.round((Date.now()-start)/1000)}s`)
        break
      } catch (e) {
        // try next resource
        const msg = (e as Error).message
        if (!msg.includes('kling_GET_')) throw e
      }
    }
    if (Date.now() - start > timeoutMs) throw new Error('v1_timeout_retry')
    await new Promise((r) => setTimeout(r, 10000))
  }
}

async function runV3(): Promise<string> {
  // Upload the 5s looped reference video to a new key.
  const buf = await readFile('/tmp/kkomi/preview_long.mp4')
  const key = 'cute-dog-greeting/preview_long.mp4'
  const { error: upErr } = await admin.storage.from('templates').upload(key, buf, {
    contentType: 'video/mp4',
    upsert: true,
  })
  if (upErr) throw new Error(`upload_ref: ${upErr.message}`)
  const refUrl = admin.storage.from('templates').getPublicUrl(key).data.publicUrl
  console.log(`[v3] ref video: ${refUrl}`)

  const rw = new RunwayML({ apiKey: RW_KEY })
  const created = await rw.characterPerformance.create({
    character: { type: 'image', uri: PERSON_URL },
    model: 'act_two',
    reference: { type: 'video', uri: refUrl },
    ratio: '720:1280',
    bodyControl: true,
    expressionIntensity: 3,
  })
  console.log(`[v3] task=${created.id}`)
  const timeoutMs = 15 * 60 * 1000
  const start = Date.now()
  while (true) {
    const t = await rw.tasks.retrieve(created.id)
    if (t.status === 'SUCCEEDED') {
      if (!t.output?.[0]) throw new Error('runway_no_output')
      return t.output[0]
    }
    if (t.status === 'FAILED') throw new Error(`runway_failed: ${JSON.stringify(t)}`)
    if (Date.now() - start > timeoutMs) throw new Error('v3_timeout')
    console.log(`[v3] status=${t.status} elapsed=${Math.round((Date.now()-start)/1000)}s`)
    await new Promise((r) => setTimeout(r, 8000))
  }
}

async function publish(remoteUrl: string, name: string): Promise<string> {
  const res = await fetch(remoteUrl)
  if (!res.ok) throw new Error(`download ${name}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const key = `demo/${name}.mp4`
  const { error } = await admin.storage.from('templates').upload(key, buf, {
    contentType: 'video/mp4',
    upsert: true,
  })
  if (error) throw new Error(`upload ${name}: ${error.message}`)
  return admin.storage.from('templates').getPublicUrl(key).data.publicUrl
}

async function main() {
  const results: Record<string, { url?: string; error?: string }> = { v1: {}, v3: {}}
  await Promise.all([
    pollKlingV1().then((u) => publish(u, 'v1')).then(
      (u) => { results.v1.url = u },
      (e: Error) => { results.v1.error = e.message },
    ),
    runV3().then((u) => publish(u, 'v3')).then(
      (u) => { results.v3.url = u },
      (e: Error) => { results.v3.error = e.message },
    ),
  ])
  console.log('\n==== RESULTS ====')
  for (const [k, v] of Object.entries(results)) {
    if (v.url) console.log(`${k}: ${v.url}`)
    else console.log(`${k}: ❌ ${v.error}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
