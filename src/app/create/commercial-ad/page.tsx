import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchProductModels, fetchPromptTemplates } from '@/lib/supabase/workflow-queries'
import { CommercialAdWizard } from './wizard'

export const dynamic = 'force-dynamic'

export default async function CommercialAdCreatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/commercial-ad')

  const [modelRows, templateRows] = await Promise.all([
    fetchProductModels(supabase, { activeOnly: true }),
    fetchPromptTemplates(supabase, { conceptId: 1, activeOnly: true }),
  ])

  const referencePublicUrl = (path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('templates').getPublicUrl(path)
    return data.publicUrl ?? null
  }

  const models = modelRows.map((m) => ({
    id: m.id,
    slug: m.slug,
    display_name: m.display_name,
    age_label: m.age_label,
    persona: m.persona,
    best_for: m.best_for ?? [],
    front_image_url: referencePublicUrl(m.reference_front_path),
  }))

  const templates = templateRows.map((t) => ({
    id: t.id,
    category: t.category,
    subcategory: t.subcategory,
    display_name: t.display_name,
    description: t.description,
    duration_sec: t.duration_sec,
    recommended_model_slugs: t.recommended_model_slugs ?? [],
    caption_template: t.caption_template,
  }))

  return <CommercialAdWizard userId={user.id} models={models} templates={templates} />
}
