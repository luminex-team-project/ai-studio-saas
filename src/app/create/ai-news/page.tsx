import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchPromptTemplates } from '@/lib/supabase/workflow-queries'
import { AiNewsWizard } from './wizard'

export const dynamic = 'force-dynamic'

export default async function AiNewsCreatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/ai-news')

  const rows = await fetchPromptTemplates(supabase, { conceptId: 4, activeOnly: true })

  const templates = rows.map((t) => ({
    id: t.id,
    category: t.category,
    subcategory: t.subcategory,
    display_name: t.display_name,
    description: t.description,
    duration_sec: t.duration_sec,
    recommended_model_slugs: t.recommended_model_slugs ?? [],
    caption_template: t.caption_template,
  }))

  return <AiNewsWizard templates={templates} />
}
