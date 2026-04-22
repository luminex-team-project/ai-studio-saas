// Database types — re-export from the CLI-generated file + convenience aliases.
//
// Regenerate with: npm run db:types
// (runs `supabase gen types typescript --linked > types.generated.ts`)

import type { Database as GeneratedDatabase } from './types.generated'

export type { Database } from './types.generated'
export type { Json } from './types.generated'

type PublicSchema = GeneratedDatabase['public']

export type ProfileRow = PublicSchema['Tables']['profiles']['Row']
export type ProfileInsert = PublicSchema['Tables']['profiles']['Insert']
export type ProfileUpdate = PublicSchema['Tables']['profiles']['Update']

export type TemplateRow = PublicSchema['Tables']['templates']['Row']
export type TemplateInsert = PublicSchema['Tables']['templates']['Insert']
export type TemplateUpdate = PublicSchema['Tables']['templates']['Update']

export type AiModelRow = PublicSchema['Tables']['ai_models']['Row']
export type AiModelInsert = PublicSchema['Tables']['ai_models']['Insert']
export type AiModelUpdate = PublicSchema['Tables']['ai_models']['Update']

export type VideoJobRow = PublicSchema['Tables']['video_jobs']['Row']
export type VideoJobInsert = PublicSchema['Tables']['video_jobs']['Insert']
export type VideoJobUpdate = PublicSchema['Tables']['video_jobs']['Update']

export type TransactionRow = PublicSchema['Tables']['transactions']['Row']
export type TransactionInsert = PublicSchema['Tables']['transactions']['Insert']
export type TransactionUpdate = PublicSchema['Tables']['transactions']['Update']

export type TemplateCategory = PublicSchema['Enums']['template_category']
export type VideoJobType = PublicSchema['Enums']['video_job_type']
export type VideoJobStatus = PublicSchema['Enums']['video_job_status']
export type TransactionKind = PublicSchema['Enums']['transaction_kind']
export type TransactionStatus = PublicSchema['Enums']['transaction_status']

// ═══════════════════════════════════════════════════════════════
// 4-Workflow redesign (Concept 1-4) — tables + columns added in
// supabase/migrations/20260423000[0-2]00_*.sql.
//
// These types are MANUAL STUBS while the generated types catch up.
// Run `npm run db:types` after the migration lands to regenerate
// types.generated.ts, then delete these manual types in favor of
// PublicSchema['Tables']['product_models']['Row'] etc.
// ═══════════════════════════════════════════════════════════════

export type ProductModelRow = {
  id: string
  slug: string
  display_name: string
  age_label: string
  persona: string
  physical_description: string | null
  brand_tone: string | null
  best_for: string[]
  reference_front_path: string | null
  reference_three_quarter_path: string | null
  reference_side_path: string | null
  seedance_identity_lock_id: string | null
  midjourney_cref_url: string | null
  elevenlabs_voice_id: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type PromptTemplateStage = {
  stage: string
  tool?: string
  mode?: string
  prompt?: string
  script?: string
  params?: string
  duration?: number
  negative?: string
  checklist?: string[]
  instruction?: string
  template?: string
  [key: string]: unknown
}

export type PromptTemplateRow = {
  id: string
  concept_id: 1 | 2 | 3 | 4
  concept_name: string
  category: string | null
  subcategory: string
  display_name: string
  description: string | null
  duration_sec: number
  platform_target: string[]
  recommended_model_slugs: string[]
  stages: PromptTemplateStage[]
  variables: Record<string, string>
  caption_template: string | null
  hashtags_pool: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Extended VideoJobRow (manual overlay until types regenerate).
export type VideoJobRowExtended = VideoJobRow & {
  concept_id: number | null
  product_model_id: string | null
  prompt_template_id: string | null
  trend_reference_url: string | null
  trend_reference_path: string | null
  storyboard: unknown | null
  brief: unknown | null
  delivery_type: 'self_post' | 'b2b_delivery' | null
}
