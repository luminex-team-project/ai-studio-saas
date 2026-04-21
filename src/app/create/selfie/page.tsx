import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SelfieWizard, type TemplateOption } from './wizard'

export const dynamic = 'force-dynamic'

export default async function SelfieCreatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/selfie')

  const { data: rows } = await supabase
    .from('templates')
    .select('id, slug, name, category, popular')
    .order('display_order', { ascending: true })

  const templates: TemplateOption[] = (rows ?? []).map((t, i) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    popular: t.popular,
    accent: ACCENTS[i % ACCENTS.length],
  }))

  return <SelfieWizard userId={user.id} templates={templates} />
}

const ACCENTS = [
  'from-neon-purple/35 to-neon-pink/15',
  'from-neon-blue/35 to-neon-cyan/15',
  'from-neon-cyan/35 to-neon-purple/15',
  'from-neon-pink/35 to-neon-blue/15',
  'from-neon-purple/35 to-neon-blue/15',
  'from-neon-blue/35 to-neon-pink/15',
]
