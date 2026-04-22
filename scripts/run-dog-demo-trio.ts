#!/usr/bin/env node
// Three parallel takes on the Kkomi dog-greeting demo, published to the
// public templates bucket at templates/demo/{v1,v2,v3}.mp4.
//
//   v1 · Kling multi-image2video (person + dog photos both referenced)
//   v2 · Kling single image2video with time-sliced prompt (person photo only)
//   v3 · Runway Act-Two with reference performance video
//
// Run: tsx --env-file=.env.local scripts/run-dog-demo-trio.ts

import jwt from 'jsonwebtoken'
import RunwayML from '@runwayml/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

const SUPABASE_URL = must('NEXT_PUBLIC_SUPABASE_URL')
const SRK = must('SUPABASE_SERVICE_ROLE_KEY')
const KL_AK = must('KLING_API_KEY')
const KL_SK = must('KLING_API_SECRET')
const RW_KEY = must('RUNWAY_API_KEY')

function must(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} missing`)
  return v
}

const admin = createClient<Database>(SUPABASE_URL, SRK, { auth: { persistSession: false }})

// Public URLs from the `templates` bucket (public: true).
const PERSON_URL = `${SUPABASE_URL}/storage/v1/object/public/templates/cute-dog-greeting/HS_2.JPG`
const DOG_URL = `${SUPABASE_URL}/storage/v1/object/public/templates/cute-dog-greeting/Kkomi_Geminai.png`
const REF_VIDEO_URL = `${SUPABASE_URL}/storage/v1/object/public/templates/cute-dog-greeting/preview.mp4`

const KLING_BASE = 'https://api-singapore.klingai.com'

function klingJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: KL_AK, exp: now + 1800, nbf: now - 5 },
    KL_SK,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' }},
  )
}

async function klingFetch<T = unknown>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${KLING_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${klingJwt()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`kling_${method}_${path}: ${res.status} ${text.slice(0, 300)}`)
  const parsed = JSON.parse(text) as { code: number; message: string; data: T }
  if (parsed.code !== 0) throw new Error(`kling_api_error ${parsed.code}: ${parsed.message}`)
  return parsed.data
}

async function klingPoll(resource: string, taskId: string): Promise<string> {
  const timeoutMs = 6 * 60 * 1000
  const start = Date.now()
  while (true) {
    const data = await klingFetch<{
      task_id: string
      task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
      task_status_msg?: string
      task_result?: { videos: Array<{ id: string; url: string; duration: string }> }
    }>('GET', `/v1/videos/${resource}/${taskId}`)
    if (data.task_status === 'succeed') {
      const url = data.task_result?.videos?.[0]?.url
      if (!url) throw new Error('kling_no_video')
      return url
    }
    if (data.task_status === 'failed') {
      throw new Error(`kling_failed: ${data.task_status_msg ?? 'unknown'}`)
    }
    if (Date.now() - start > timeoutMs) throw new Error('kling_timeout')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

const V1_PROMPT = [
  '영상 속 여성(첫 번째 참조 이미지)이 자신의 반려견 꼬미(두 번째 참조 이미지, 작은 흰색 말티즈)를',
  '반갑게 맞이한다. 꼬미는 꼬리를 세차게 흔들며 신나게 뛰어와 여성에게 애교를 부린다.',
  '여성이 따뜻하게 웃으며 부드럽게 "앉아!"라고 말하면, 꼬미는 순종적으로 자리에 앉는다.',
  '한 샷으로 자연스럽게 이어지며, 따뜻한 실내 조명과 세로 9:16 비율로 촬영한다.',
].join(' ')

const V2_PROMPT = [
  '[0-2초] 영상 속 여성이 셀카를 찍다가 카메라를 천천히 내리며 아래 바닥을 바라본다.',
  '[2-4초] 프레임 왼쪽 아래에서 작은 흰색 말티즈 한 마리가 신나게 달려 들어온다.',
  '꼬리를 세차게 흔들고 귀를 펄럭이며 여성 쪽으로 빠르게 다가간다.',
  '[4-6초] 강아지가 여성의 다리 옆에 도착해 앞발을 들고 점프하며 애교를 부린다.',
  '여성은 밝게 웃으며 강아지를 내려다본다.',
  '[6-8초] 여성이 오른손을 내려 펴 보이며 단호하게 "앉아!"라고 말한다.',
  '[8-10초] 강아지가 천천히 동작을 멈추고 자리에 차분히 앉아 여성을 올려다본다.',
  '따뜻한 실내 조명, 9:16 세로 비율, 부드러운 카메라 흔들림.',
].join(' ')

// ═══════════════════════════════════════════════════════════
// v1 · Kling multi-image2video
// ═══════════════════════════════════════════════════════════
async function runV1(): Promise<string> {
  console.log('[v1] starting — Kling multi-image2video')
  // Kling's multi-image endpoint varies by API version; try the most common
  // names until one works.
  const payloads = [
    {
      path: '/v1/videos/multi-image2video',
      body: {
        model_name: 'kling-v1-6',
        image_list: [{ image: PERSON_URL }, { image: DOG_URL }],
        prompt: V1_PROMPT.slice(0, 2500),
        mode: 'pro',
        aspect_ratio: '9:16',
        duration: '10',
      },
    },
    {
      path: '/v1/videos/image2video',
      body: {
        model_name: 'kling-v1-6',
        image: PERSON_URL,
        image_tail: DOG_URL,
        prompt: V1_PROMPT.slice(0, 2500),
        mode: 'pro',
        aspect_ratio: '9:16',
        duration: '10',
      },
    },
  ]

  let taskId: string | null = null
  let chosenResource = 'image2video'
  for (const attempt of payloads) {
    try {
      const data = await klingFetch<{ task_id: string }>('POST', attempt.path, attempt.body)
      taskId = data.task_id
      chosenResource = attempt.path.split('/').pop()!
      console.log(`[v1] accepted on ${attempt.path}, task=${taskId}`)
      break
    } catch (e) {
      console.log(`[v1] rejected on ${attempt.path}: ${(e as Error).message.slice(0, 140)}`)
    }
  }
  if (!taskId) throw new Error('v1_all_endpoints_failed')

  const videoUrl = await klingPoll(chosenResource, taskId)
  console.log('[v1] done')
  return videoUrl
}

// ═══════════════════════════════════════════════════════════
// v2 · Kling image2video with time-sliced prompt
// ═══════════════════════════════════════════════════════════
async function runV2(): Promise<string> {
  console.log('[v2] starting — Kling image2video (time-sliced prompt)')
  const data = await klingFetch<{ task_id: string }>('POST', '/v1/videos/image2video', {
    model_name: 'kling-v2-6',
    image: PERSON_URL,
    prompt: V2_PROMPT.slice(0, 2500),
    mode: 'pro',
    aspect_ratio: '9:16',
    duration: '10',
    cfg_scale: 0.6,
  })
  console.log(`[v2] task=${data.task_id}`)
  const url = await klingPoll('image2video', data.task_id)
  console.log('[v2] done')
  return url
}

// ═══════════════════════════════════════════════════════════
// v3 · Runway Act-Two (character image + reference performance video)
// ═══════════════════════════════════════════════════════════
async function runV3(): Promise<string> {
  console.log('[v3] starting — Runway Act-Two')
  const rw = new RunwayML({ apiKey: RW_KEY })
  const created = await rw.characterPerformance.create({
    character: { type: 'image', uri: PERSON_URL },
    model: 'act_two',
    reference: { type: 'video', uri: REF_VIDEO_URL },
    ratio: '720:1280',
    bodyControl: true,
    expressionIntensity: 3,
  })
  console.log(`[v3] task=${created.id}`)
  const timeoutMs = 10 * 60 * 1000
  const start = Date.now()
  while (true) {
    const t = await rw.tasks.retrieve(created.id)
    if (t.status === 'SUCCEEDED') {
      if (!t.output?.[0]) throw new Error('runway_no_output')
      console.log('[v3] done')
      return t.output[0]
    }
    if (t.status === 'FAILED') throw new Error(`runway_failed: ${JSON.stringify(t)}`)
    if (Date.now() - start > timeoutMs) throw new Error('runway_timeout')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

// ═══════════════════════════════════════════════════════════
// Download remote URL and upload to templates/demo/<name>
// ═══════════════════════════════════════════════════════════
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
  const { data } = admin.storage.from('templates').getPublicUrl(key)
  return data.publicUrl
}

async function main() {
  const results: Record<string, { url?: string; error?: string }> = {
    v1: {},
    v2: {},
    v3: {},
  }

  const tasks = [
    runV1().then((u) => publish(u, 'v1')).then(
      (u) => { results.v1.url = u },
      (e: Error) => { results.v1.error = e.message },
    ),
    runV2().then((u) => publish(u, 'v2')).then(
      (u) => { results.v2.url = u },
      (e: Error) => { results.v2.error = e.message },
    ),
    runV3().then((u) => publish(u, 'v3')).then(
      (u) => { results.v3.url = u },
      (e: Error) => { results.v3.error = e.message },
    ),
  ]

  await Promise.all(tasks)

  console.log('\n==== RESULTS ====')
  for (const [k, v] of Object.entries(results)) {
    if (v.url) console.log(`${k}: ${v.url}`)
    else console.log(`${k}: ❌ ${v.error}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
