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
