import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SelfieWizard, type TemplateOption } from './wizard'

export const dynamic = 'force-dynamic'

const ACCENTS = [
  'from-neon-purple/35 to-neon-pink/15',
  'from-neon-blue/35 to-neon-cyan/15',
  'from-neon-cyan/35 to-neon-purple/15',
  'from-neon-pink/35 to-neon-blue/15',
  'from-neon-purple/35 to-neon-blue/15',
  'from-neon-blue/35 to-neon-pink/15',
]

type Search = { template?: string | string[] }

export default async function SelfieCreatePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/selfie')

  const params = await searchParams
  const rawTemplate = Array.isArray(params.template) ? params.template[0] : params.template

  const { data: rows } = await supabase
    .from('templates')
    .select(
      'id, slug, name, category, popular, preview_video_url, thumbnail_url, example_prompt, replace_target_hint',
    )
    .order('display_order', { ascending: true })

  const templates: TemplateOption[] = (rows ?? []).map((t, i) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: t.category,
    popular: t.popular,
    previewVideoUrl: t.preview_video_url,
    thumbnailUrl: t.thumbnail_url,
    examplePrompt: t.example_prompt,
    replaceTargetHint: t.replace_target_hint,
    accent: ACCENTS[i % ACCENTS.length],
  }))

  // Pre-select by slug or id (gallery links use id; direct share links prefer slug).
  const preselected =
    templates.find((t) => t.id === rawTemplate || t.slug === rawTemplate)?.id ?? null

  return (
    <SelfieWizard userId={user.id} templates={templates} preselectedId={preselected} />
  )
}
