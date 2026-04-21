#!/usr/bin/env node
// Phase-1 + Phase-2 provider benchmark.
//
// Phase 1: run 9 × 5-second clips (3 scenarios × 3 providers) for comparison.
// Phase 2: run 3 × 15-second clips using the winner provider per scenario
//          (pass winners via CLI args).
//
// Usage:
//   npm run bench:phase1                    # runs the 9-clip comparison
//   npm run bench:phase2 kling kling luma   # runs 3 final clips with the
//                                           #   mapped winners (positional)
//
// Prereqs:
//   - All API keys set in .env.local (Kling + Runway + Luma + Cloudinary + Supabase service role)
//   - Redis URL set + `npm run worker` running in another terminal
//   - A test user's UUID exported as BENCH_USER_ID (used as the job owner).
//     Alternatively, set BENCH_USER_EMAIL and we'll look it up.
//   - Three source images for scenario #1 (mask pack) uploaded to Supabase
//     storage under `sources/<user_id>/bench/mask_{0,1,2}.jpg`. If missing,
//     scenario #1 is skipped with a warning.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import type { Database } from '../src/lib/supabase/types'

type ProviderKind = 'kling' | 'runway' | 'luma'
type Admin = SupabaseClient<Database>

const ALL_PROVIDERS: ProviderKind[] = ['kling', 'runway', 'luma']

function availableProviders(): ProviderKind[] {
  const keyed: Record<ProviderKind, boolean> = {
    kling: Boolean(process.env.KLING_API_KEY && process.env.KLING_API_SECRET),
    runway: Boolean(process.env.RUNWAY_API_KEY),
    luma: Boolean(process.env.LUMA_API_KEY),
  }
  const filter = (process.env.BENCH_PROVIDERS ?? '').trim()
  const explicit = filter
    ? (filter.split(',').map((s) => s.trim()) as ProviderKind[])
    : null
  return ALL_PROVIDERS.filter((p) => keyed[p] && (!explicit || explicit.includes(p)))
}

const SCENARIOS: Array<{
  key: string
  name: string
  prompt: string
  needsImages: boolean
  aspect: '9:16' | '16:9' | '1:1'
}> = [
  {
    key: 'mask_pack',
    name: '1. 뷰티 / EIŌM 트러블 패치 마스크',
    prompt:
      '사진 속 모델과 닮은 20대 여성이 정원에서 트러블 패치 마스크팩을 꺼내 설명하고, 팩을 얼굴에 올린 뒤 카메라를 보며 환하게 웃는 15초 제품 리뷰. 자연광, 소프트 포커스, 따뜻한 톤',
    needsImages: true,
    aspect: '9:16',
  },
  {
    key: 'arcade',
    name: '2. 오락 / 펌프 아케이드 발판게임',
    prompt:
      '예쁘고 귀엽고 활발한 여중생 4명이 아케이드 펌프 발판게임을 하며 협동모드로 즐기고 배꼽잡고 웃는 역동적인 15초. 네온 조명, 얼굴 클로즈업 교차, 하이파이브 엔딩',
    needsImages: false,
    aspect: '9:16',
  },
  {
    key: 'wealth',
    name: '3. 웹앱 / 0.1% 부의 비결',
    prompt:
      '성공한 상위 0.1% 부자의 생활을 보여주는 시네마틱 몽타주 15초. 고층 오피스 전망, 새벽 운동, 독서하는 모습, 창가에 서서 사색하는 장면. 느린 카메라 무빙, 따뜻한 황금빛 톤, 내레이터 없음',
    needsImages: false,
    aspect: '9:16',
  },
]

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env var: ${name}`)
    process.exit(1)
  }
  return v
}

function normalizedRedisUrl(): string {
  const raw = getEnv('REDIS_URL')
  try {
    const u = new URL(raw)
    if (u.protocol === 'redis:' && u.hostname.endsWith('upstash.io')) u.protocol = 'rediss:'
    return u.toString()
  } catch {
    return raw
  }
}

async function resolveUserId(
  admin: Admin,
): Promise<string> {
  const direct = process.env.BENCH_USER_ID
  if (direct) return direct
  // Default to the canonical project owner email; override via BENCH_USER_EMAIL.
  const email = process.env.BENCH_USER_EMAIL ?? 'acepark14@gmail.com'
  const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!data) {
    console.error(`No profile found for email=${email}. Sign in once at localhost:3000/auth to create it.`)
    process.exit(1)
  }
  return data.id as string
}

async function listMaskImages(
  admin: Admin,
  userId: string,
): Promise<string[]> {
  // Expected convention: sources/<user_id>/bench/mask_0.jpg, mask_1.jpg, mask_2.jpg
  const prefix = `${userId}/bench`
  const { data, error } = await admin.storage.from('sources').list(prefix, { limit: 10 })
  if (error || !data) return []
  const keys = data
    .filter((f) => /mask_\d+\.(jpe?g|png)$/i.test(f.name))
    .map((f) => `${prefix}/${f.name}`)
  return keys.sort().slice(0, 3)
}

async function createJob(
  admin: Admin,
  userId: string,
  params: {
    prompt: string
    providerOverride: ProviderKind
    phase: 'preview_5s' | 'final_15s'
    aspect: '9:16' | '16:9' | '1:1'
    sourceImagePaths: string[]
  },
): Promise<string> {
  const creditsCost = params.phase === 'preview_5s' ? 3 : 15
  const { data, error } = await admin
    .from('video_jobs')
    .insert({
      user_id: userId,
      type: params.sourceImagePaths.length > 0 ? 'product' : 'text2video',
      status: 'pending',
      prompt: params.prompt,
      scenario: params.prompt,
      phase: params.phase,
      provider_kind: params.providerOverride,
      options: {
        aspect_ratio: params.aspect,
        provider_override: params.providerOverride,
        benchmark: true,
      },
      source_image_urls: params.sourceImagePaths,
      credits_cost: creditsCost,
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`job_insert_failed: ${error?.message ?? 'unknown'}`)
  }
  return data.id
}

async function runPhase1() {
  const adminUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const adminKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const admin = createClient<Database>(adminUrl, adminKey)
  const userId = await resolveUserId(admin)
  console.log(`[bench] user=${userId}`)

  const maskImages = await listMaskImages(admin, userId)
  if (maskImages.length === 0) {
    console.warn(
      '[bench] mask pack images not found — scenario #1 will be skipped.\n' +
        `        Upload 3 images to sources/${userId}/bench/mask_{0,1,2}.jpg first.`,
    )
  }

  const providers = availableProviders()
  if (providers.length === 0) {
    console.error('[bench] no providers with API keys set. Fill .env.local.')
    process.exit(1)
  }
  console.log(`[bench] providers=${providers.join(',')}`)

  const redis = new IORedis(normalizedRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  const queue = new Queue('video-jobs', { connection: redis })
  const events = new QueueEvents('video-jobs', { connection: redis })
  await events.waitUntilReady()

  const runs: Array<{ scenario: string; provider: ProviderKind; jobId: string }> = []

  for (const scenario of SCENARIOS) {
    if (scenario.needsImages && maskImages.length === 0) continue
    for (const provider of providers) {
      const jobId = await createJob(admin, userId, {
        prompt: scenario.prompt,
        providerOverride: provider,
        phase: 'preview_5s',
        aspect: scenario.aspect,
        sourceImagePaths: scenario.needsImages ? maskImages : [],
      })
      await queue.add('generate', { jobId }, { jobId: `video-${jobId}` })
      runs.push({ scenario: scenario.key, provider, jobId })
      console.log(`[bench] queued ${scenario.key}/${provider} → ${jobId}`)
    }
  }

  console.log(`\n[bench] ${runs.length} jobs queued. Waiting for completion...\n`)

  // Poll DB until every job completes or fails.
  const start = Date.now()
  const timeoutMs = 30 * 60 * 1000
  while (true) {
    const ids = runs.map((r) => r.jobId)
    const { data } = await admin
      .from('video_jobs')
      .select('id, status, output_video_url, output_thumbnail_url, error_message, duration_seconds, provider_model')
      .in('id', ids)
    const done = (data ?? []).filter((r) => r.status === 'completed' || r.status === 'failed')
    console.log(`[bench] ${done.length}/${runs.length} done`)
    if (done.length === runs.length) break
    if (Date.now() - start > timeoutMs) {
      console.error('[bench] timeout')
      break
    }
    await new Promise((r) => setTimeout(r, 10_000))
  }

  // Summary
  const { data: finalRows } = await admin
    .from('video_jobs')
    .select('id, status, output_video_url, output_thumbnail_url, error_message, duration_seconds, provider_model, options')
    .in('id', runs.map((r) => r.jobId))

  console.log('\n===== Phase 1 Results =====')
  for (const run of runs) {
    const row = finalRows?.find((r) => r.id === run.jobId)
    const opts = (row?.options ?? {}) as { provider_override?: string }
    console.log(
      `${run.scenario.padEnd(10)} ${String(run.provider).padEnd(8)} ${String(row?.status ?? 'unknown').padEnd(10)} ${row?.duration_seconds ?? '-'}s model=${row?.provider_model ?? opts.provider_override ?? '-'} ${row?.error_message ?? ''}`,
    )
  }
  console.log('\nReview videos in the app UI at /my-videos to pick winners.')
  await events.close()
  await queue.close()
  await redis.quit()
}

async function runPhase2(winners: ProviderKind[]) {
  if (winners.length !== 3) {
    console.error('Usage: bench:phase2 <winner1> <winner2> <winner3>')
    process.exit(1)
  }
  const admin = createClient<Database>(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )
  const userId = await resolveUserId(admin)
  const maskImages = await listMaskImages(admin, userId)
  const redis = new IORedis(normalizedRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  const queue = new Queue('video-jobs', { connection: redis })

  const runs: Array<{ scenario: string; provider: ProviderKind; jobId: string }> = []
  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]
    if (scenario.needsImages && maskImages.length === 0) {
      console.warn(`skip ${scenario.key} — mask images missing`)
      continue
    }
    const provider = winners[i]
    const jobId = await createJob(admin, userId, {
      prompt: scenario.prompt,
      providerOverride: provider,
      phase: 'final_15s',
      aspect: scenario.aspect,
      sourceImagePaths: scenario.needsImages ? maskImages : [],
    })
    await queue.add('generate', { jobId }, { jobId: `video-${jobId}` })
    runs.push({ scenario: scenario.key, provider, jobId })
    console.log(`[bench] queued ${scenario.key}/${provider} (15s) → ${jobId}`)
  }

  await queue.close()
  await redis.quit()
  console.log(`\n[bench] ${runs.length} final-15s jobs queued. Watch /my-videos for results.`)
}

// Entry point
const phase = process.argv[2]
if (phase === 'phase1') {
  runPhase1().catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else if (phase === 'phase2') {
  const winners = process.argv.slice(3) as ProviderKind[]
  runPhase2(winners).catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else {
  console.log(`Usage:
  tsx scripts/benchmark-providers.ts phase1
  tsx scripts/benchmark-providers.ts phase2 <s1_winner> <s2_winner> <s3_winner>

Scenarios:
  1. mask_pack   — needs source images at sources/<user>/bench/mask_{0,1,2}.jpg
  2. arcade      — text-only
  3. wealth      — text-only

Winners must be one of: kling | runway | luma`)
}
