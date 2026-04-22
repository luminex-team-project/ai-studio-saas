import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ProductModelRow, PromptTemplateRow } from './types'

// Thin typed wrappers for the 4-workflow tables (product_models,
// prompt_templates) while types.generated.ts catches up with the
// 20260423 migrations. Delete this file after `npm run db:types`.

type Client = SupabaseClient<Database>

// `from<TableName>()` won't type-check the new tables until codegen runs.
// These helpers accept the client, route through a generic cast, and return
// strongly-typed rows so callers don't pollute each call site with casts.

export async function fetchProductModels(
  supabase: Client,
  opts: { activeOnly?: boolean } = {},
): Promise<ProductModelRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = (supabase as any).from('product_models').select('*')
  if (opts.activeOnly) query = query.eq('is_active', true)
  query = query.order('display_order', { ascending: true })
  const { data } = await query
  return (data ?? []) as ProductModelRow[]
}

export async function fetchPromptTemplates(
  supabase: Client,
  opts: { conceptId?: 1 | 2 | 3 | 4; activeOnly?: boolean } = {},
): Promise<PromptTemplateRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = (supabase as any).from('prompt_templates').select('*')
  if (opts.conceptId !== undefined) query = query.eq('concept_id', opts.conceptId)
  if (opts.activeOnly) query = query.eq('is_active', true)
  query = query
    .order('concept_id', { ascending: true })
    .order('display_order', { ascending: true })
  const { data } = await query
  return (data ?? []) as PromptTemplateRow[]
}
