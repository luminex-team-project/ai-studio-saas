import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductWizard, type ModelOption } from './wizard'

export const dynamic = 'force-dynamic'

const ACCENTS = [
  'from-neon-purple/30 to-neon-pink/15',
  'from-neon-blue/30 to-neon-cyan/15',
  'from-neon-cyan/30 to-neon-blue/15',
  'from-neon-pink/30 to-neon-purple/15',
  'from-neon-blue/30 to-neon-purple/15',
  'from-neon-purple/30 to-neon-cyan/15',
]

export default async function ProductCreatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/product')

  const { data: rows } = await supabase
    .from('ai_models')
    .select('id, slug, name, style, age_range, popular')
    .order('display_order', { ascending: true })

  const models: ModelOption[] = (rows ?? []).map((m, i) => ({
    id: m.id,
    name: m.name,
    style: m.style ?? '',
    age: m.age_range ?? '',
    popular: m.popular,
    accent: ACCENTS[i % ACCENTS.length],
  }))

  return <ProductWizard userId={user.id} models={models} />
}
