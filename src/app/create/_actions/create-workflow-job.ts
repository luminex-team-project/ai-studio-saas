'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Credit costs for the 4 new workflows. Tune alongside docs/pricing UI.
const CREDITS = {
  commercial_ad: 25,
  scene_reenact: 20,
  trend_clone: 10,
  ai_news: 15,
} as const

const BriefSchema = z.object({
  product_name: z.string().min(1).max(60),
  category: z.enum(['cosmetic', 'health-supplement']),
  usp: z.string().min(1).max(120),
  benefit: z.string().min(1).max(200),
  target: z.string().min(1).max(120),
  tone: z.enum(['friendly', 'premium', 'energetic', 'trustworthy']),
  duration_sec: z.union([z.literal(15), z.literal(20), z.literal(25), z.literal(30)]),
})

const StoryboardShotSchema = z.object({
  shot: z.enum(['hook', 'problem', 'use', 'cta']),
  label: z.string(),
  duration_sec: z.number().int().min(1).max(15),
  prompt: z.string().max(500),
})

const CommercialAdInput = z.object({
  product_model_id: z.string().uuid(),
  prompt_template_id: z.string().uuid(),
  source_image_paths: z.array(z.string().min(1)).min(1).max(3),
  brief: BriefSchema,
  storyboard: z.array(StoryboardShotSchema).length(4),
  delivery_type: z.enum(['self_post', 'b2b_delivery']).default('self_post'),
})

const SceneReenactInput = z.object({
  prompt_template_id: z.string().uuid(),
  face_image_paths: z.array(z.string().min(1)).min(1).max(3),
  reference_image_path: z.string().nullable(),
  scene: z.object({
    original_title: z.string().min(1).max(80),
    description: z.string().max(200),
    outfit: z.string().max(200),
    background: z.string().max(240),
  }),
})

const TrendCloneInput = z.object({
  prompt_template_id: z.string().uuid(),
  source_image_paths: z.array(z.string().min(1)).max(3),
  trend_reference_url: z.string().url().nullable(),
  trend_reference_path: z.string().nullable(),
  trend_name: z.string().max(80),
  trend_vibe: z.string().max(160),
}).refine(
  (d) => d.trend_reference_url !== null || d.trend_reference_path !== null,
  { message: 'trend_reference_required' },
)

const AiNewsInput = z.object({
  prompt_template_id: z.string().uuid(),
  angle: z.object({
    headline: z.string().min(1).max(40),
    source_url: z.string().url(),
    summary: z.string().min(1).max(400),
    key_numbers: z.string().max(120),
    korea_impact: z.string().max(120),
  }),
})

export type CreateJobResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string }

async function insertAndConsume(
  row: Record<string, unknown>,
  credits: number,
): Promise<CreateJobResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: job, error: insertErr } = await supabase
    .from('video_jobs')
    .insert({ ...row, user_id: user.id, credits_cost: credits } as never)
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
    await supabase
      .from('video_jobs')
      .update({ status: 'cancelled', error_message: consumeErr.message })
      .eq('id', job.id)
    const message =
      consumeErr.message === 'insufficient_credits' ? '크레딧이 부족해요' : consumeErr.message
    return { ok: false, error: message }
  }

  return { ok: true, jobId: job.id }
}

export async function createCommercialAdJob(
  input: z.input<typeof CommercialAdInput>,
): Promise<CreateJobResult> {
  const parsed = CommercialAdInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  return insertAndConsume(
    {
      type: 'commercial_ad',
      concept_id: 1,
      product_model_id: parsed.data.product_model_id,
      prompt_template_id: parsed.data.prompt_template_id,
      source_image_urls: parsed.data.source_image_paths,
      brief: parsed.data.brief,
      storyboard: parsed.data.storyboard,
      delivery_type: parsed.data.delivery_type,
      prompt: parsed.data.storyboard.map((s) => s.prompt).filter(Boolean).join(' | ') || null,
      options: {
        duration_sec: parsed.data.brief.duration_sec,
        tone: parsed.data.brief.tone,
      },
    },
    CREDITS.commercial_ad,
  )
}

export async function createSceneReenactJob(
  input: z.input<typeof SceneReenactInput>,
): Promise<CreateJobResult> {
  const parsed = SceneReenactInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const { scene } = parsed.data
  const prompt =
    `${scene.description} · Outfit: ${scene.outfit} · Background: ${scene.background} · 원작: ${scene.original_title}`.trim()

  return insertAndConsume(
    {
      type: 'scene_reenact',
      concept_id: 2,
      prompt_template_id: parsed.data.prompt_template_id,
      source_image_urls: parsed.data.face_image_paths,
      trend_reference_path: parsed.data.reference_image_path,
      prompt,
      options: {
        original_title: scene.original_title,
        outfit: scene.outfit,
        background: scene.background,
      },
    },
    CREDITS.scene_reenact,
  )
}

export async function createTrendCloneJob(
  input: z.input<typeof TrendCloneInput>,
): Promise<CreateJobResult> {
  const parsed = TrendCloneInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  return insertAndConsume(
    {
      type: 'trend_clone',
      concept_id: 3,
      prompt_template_id: parsed.data.prompt_template_id,
      source_image_urls: parsed.data.source_image_paths,
      trend_reference_url: parsed.data.trend_reference_url,
      trend_reference_path: parsed.data.trend_reference_path,
      prompt: parsed.data.trend_vibe || null,
      options: {
        trend_name: parsed.data.trend_name,
        trend_vibe: parsed.data.trend_vibe,
      },
    },
    CREDITS.trend_clone,
  )
}

export async function createAiNewsJob(
  input: z.input<typeof AiNewsInput>,
): Promise<CreateJobResult> {
  const parsed = AiNewsInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  return insertAndConsume(
    {
      type: 'ai_news',
      concept_id: 4,
      prompt_template_id: parsed.data.prompt_template_id,
      source_image_urls: [],
      prompt: parsed.data.angle.summary,
      options: {
        headline: parsed.data.angle.headline,
        source_url: parsed.data.angle.source_url,
        key_numbers: parsed.data.angle.key_numbers,
        korea_impact: parsed.data.angle.korea_impact,
      },
    },
    CREDITS.ai_news,
  )
}
