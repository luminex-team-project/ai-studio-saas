'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Credits costs — keep in sync with UI copy.
const CREDITS = { selfie: 10, product: 25, scene: 15, scene_preview: 3 } as const

const MusicEnum = z.enum(['트렌디 팝', '힙합 비트', '일렉트로닉', '없음'])
const DurationEnum = z.enum(['15', '30', '60'])
const AspectRatioEnum = z.enum(['16:9', '9:16', '1:1'])
const ProviderOverrideEnum = z.enum(['runway', 'kling', 'luma'])
const PhaseEnum = z.enum(['preview_5s', 'final_15s'])

const SelfieInput = z.object({
  template_id: z.string().uuid().nullable(),
  source_image_paths: z.array(z.string().min(1)).min(1).max(3),
  prompt: z.string().min(5).max(2000).optional(),
  options: z.object({
    duration: DurationEnum,
    music: MusicEnum,
  }),
})

const ProductInput = z.object({
  ai_model_id: z.string().uuid(),
  scenario: z.string().min(1),
  source_image_paths: z.array(z.string().min(1)).min(1).max(3),
})

const SceneInput = z.object({
  prompt: z.string().min(5).max(5000),
  aspect_ratio: AspectRatioEnum.default('9:16'),
  phase: PhaseEnum.default('final_15s'),
  provider_override: ProviderOverrideEnum.optional(),
})

export type CreateJobResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string }

type SelfieInputT = z.infer<typeof SelfieInput>
type ProductInputT = z.infer<typeof ProductInput>
type SceneInputT = z.input<typeof SceneInput>

async function insertJobAndConsume(
  insert: Parameters<
    Awaited<ReturnType<typeof createClient>>['from']
  >[0] extends infer _T
    ? Record<string, unknown>
    : never,
  credits: number,
): Promise<CreateJobResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: job, error: insertErr } = await supabase
    .from('video_jobs')
    .insert(insert as never)
    .select('id')
    .single()
  if (insertErr || !job) {
    return { ok: false, error: insertErr?.message ?? 'failed_to_create_job' }
  }

  const { error: consumeErr } = await supabase.rpc('consume_credits', {
    p_credits: credits,
    p_video_job_id: job.id,
  })

  if (consumeErr) {
    // Roll back: mark job cancelled so it doesn't linger as pending.
    await supabase
      .from('video_jobs')
      .update({ status: 'cancelled', error_message: consumeErr.message })
      .eq('id', job.id)

    const message =
      consumeErr.message === 'insufficient_credits'
        ? '크레딧이 부족해요'
        : consumeErr.message
    return { ok: false, error: message }
  }

  return { ok: true, jobId: job.id }
}

export async function createSelfieJob(input: SelfieInputT): Promise<CreateJobResult> {
  const parsed = SelfieInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  return insertJobAndConsume(
    {
      user_id: user.id,
      type: 'selfie',
      template_id: parsed.data.template_id,
      source_image_urls: parsed.data.source_image_paths,
      prompt: parsed.data.prompt ?? null,
      options: parsed.data.options,
      credits_cost: CREDITS.selfie,
    },
    CREDITS.selfie,
  )
}

export async function createSceneJob(input: SceneInputT): Promise<CreateJobResult> {
  const parsed = SceneInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const creditsCost =
    parsed.data.phase === 'preview_5s' ? CREDITS.scene_preview : CREDITS.scene

  return insertJobAndConsume(
    {
      user_id: user.id,
      type: 'text2video',
      scenario: parsed.data.prompt,
      prompt: parsed.data.prompt,
      phase: parsed.data.phase,
      provider_kind: parsed.data.provider_override ?? null,
      options: {
        aspect_ratio: parsed.data.aspect_ratio,
        provider_override: parsed.data.provider_override,
      },
      source_image_urls: [],
      credits_cost: creditsCost,
    },
    creditsCost,
  )
}

export async function createProductJob(input: ProductInputT): Promise<CreateJobResult> {
  const parsed = ProductInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  return insertJobAndConsume(
    {
      user_id: user.id,
      type: 'product',
      ai_model_id: parsed.data.ai_model_id,
      scenario: parsed.data.scenario,
      source_image_urls: parsed.data.source_image_paths,
      credits_cost: CREDITS.product,
    },
    CREDITS.product,
  )
}
