#!/usr/bin/env node
// One-shot demo: generate the "Kkomi runs up, gets cute, sits on command"
// video from the templates reference photos. Copies the person photo into
// the user's sources/, inserts a video_jobs row, and enqueues it on BullMQ.
//
// Run: tsx --env-file=.env.local scripts/run-dog-demo.ts

import { createClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import type { Database } from '../src/lib/supabase/types'

const USER_EMAIL = 'acepark14@gmail.com'
const TEMPLATE_SLUG = 'cute-dog-greeting'
const SOURCE_FILE = 'HS_2.JPG'

const PROMPT = [
  '영상 속 여성이 셀카를 찍던 자세에서 카메라를 천천히 내린다.',
  "그녀의 반려견 '꼬미'가 프레임 안으로 신나게 뛰어 들어온다.",
  '꼬미는 작은 흰색 말티즈이며, 풍성한 곱슬 털과 검은 눈동자, 까만 코를 가졌다.',
  '꼬미는 여성에게 빠르게 달려가, 꼬리를 세차게 흔들며 앞발을 들고 점프해 애교를 부린다.',
  '여성이 밝게 웃으며 "앉아!" 라고 부드럽지만 단호하게 명령하면,',
  '꼬미는 동작을 멈추고 천천히 자리에 앉으며 여성을 올려다본다.',
  '한 샷으로 자연스럽게 이어진다. 따뜻한 실내 조명, 9:16 세로 영상.',
].join(' ')

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} required`)
  return v
}

async function main() {
  const admin = createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  // 1. Look up user id by email.
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, credits')
    .eq('email', USER_EMAIL)
    .maybeSingle()
  if (profileErr || !profile) {
    throw new Error(`profile_lookup_failed: ${profileErr?.message ?? 'not found'}`)
  }
  console.log(`✓ user=${profile.id} credits=${profile.credits}`)

  // 2. Copy person photo from templates bucket → sources/<user_id>/...
  const { data: photoBlob, error: dlErr } = await admin.storage
    .from('templates')
    .download(`${TEMPLATE_SLUG}/${SOURCE_FILE}`)
  if (dlErr || !photoBlob) {
    throw new Error(`download_source_failed: ${dlErr?.message ?? 'no data'}`)
  }
  const sourceKey = `${profile.id}/dog-demo-${Date.now()}-person.jpg`
  const { error: upErr } = await admin.storage.from('sources').upload(
    sourceKey,
    Buffer.from(await photoBlob.arrayBuffer()),
    { contentType: 'image/jpeg', upsert: false },
  )
  if (upErr) throw new Error(`upload_source_failed: ${upErr.message}`)
  console.log(`✓ staged source → sources/${sourceKey}`)

  // 3. Resolve template id.
  const { data: tmpl } = await admin
    .from('templates')
    .select('id')
    .eq('slug', TEMPLATE_SLUG)
    .maybeSingle()

  // 4. Insert the video_jobs row.
  const { data: job, error: insertErr } = await admin
    .from('video_jobs')
    .insert({
      user_id: profile.id,
      type: 'selfie',
      status: 'pending',
      template_id: tmpl?.id ?? null,
      source_image_urls: [sourceKey],
      prompt: PROMPT,
      phase: 'final_15s',
      provider_kind: 'kling',
      options: { aspect_ratio: '9:16', duration: '15', music: '없음' },
      credits_cost: 10,
    })
    .select('id')
    .single()
  if (insertErr || !job) throw new Error(`insert_job_failed: ${insertErr?.message}`)
  console.log(`✓ job inserted id=${job.id}`)

  // 5. Enqueue to BullMQ.
  const rawUrl = requireEnv('REDIS_URL')
  const u = new URL(rawUrl)
  if (u.protocol === 'redis:' && u.hostname.endsWith('upstash.io')) u.protocol = 'rediss:'
  const conn = new IORedis(u.toString(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  const q = new Queue('video-jobs', { connection: conn })
  await q.add('generate', { jobId: job.id }, { jobId: `video-${job.id}` })
  console.log(`✓ enqueued → watch worker logs. jobId=${job.id}`)
  await q.close()
  await conn.quit()
}

main().catch((e) => {
  console.error('✗', e)
  process.exit(1)
})
