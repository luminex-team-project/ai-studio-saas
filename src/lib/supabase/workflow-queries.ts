import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ProductModelRow, PromptTemplateRow } from './types'

// Thin typed wrappers for the 4-workflow tables (product_models /
// prompt_templates) used by /create/* server pages and /admin pages.
// Centralising the queries keeps select-list strings in one spot if/when
// columns evolve.

type Client = SupabaseClient<Database>

export async function fetchProductModels(
  supabase: Client,
  opts: { activeOnly?: boolean } = {},
): Promise<ProductModelRow[]> {
  let query = supabase.from('product_models').select('*')
  if (opts.activeOnly) query = query.eq('is_active', true)
  query = query.order('display_order', { ascending: true })
  const { data } = await query
  return data ?? []
}

export async function fetchPromptTemplates(
  supabase: Client,
  opts: { conceptId?: 1 | 2 | 3 | 4; activeOnly?: boolean } = {},
): Promise<PromptTemplateRow[]> {
  let query = supabase.from('prompt_templates').select('*')
  if (opts.conceptId !== undefined) query = query.eq('concept_id', opts.conceptId)
  if (opts.activeOnly) query = query.eq('is_active', true)
  query = query
    .order('concept_id', { ascending: true })
    .order('display_order', { ascending: true })
  const { data } = await query
  return data ?? []
}
