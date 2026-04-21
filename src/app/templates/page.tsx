import { createClient } from '@/lib/supabase/server'
import { TemplatesGallery, type TemplateCard } from './gallery'

export const dynamic = 'force-dynamic'

const ACCENTS = [
  'from-neon-purple/40 to-neon-pink/15',
  'from-neon-blue/40 to-neon-cyan/15',
  'from-neon-cyan/40 to-neon-blue/15',
  'from-neon-pink/40 to-neon-purple/15',
  'from-neon-purple/40 to-neon-blue/15',
  'from-neon-blue/40 to-neon-pink/15',
  'from-neon-pink/40 to-neon-cyan/15',
  'from-neon-cyan/40 to-neon-purple/15',
]

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('templates')
    .select('id, slug, name, category, trending, likes_count, uses_count')
    .order('display_order', { ascending: true })

  const templates: TemplateCard[] = (rows ?? []).map((t, i) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: t.category,
    trending: t.trending,
    likes: t.likes_count,
    uses: t.uses_count,
    accent: ACCENTS[i % ACCENTS.length],
  }))

  return (
    <main className="flex-1">
      <TemplatesGallery templates={templates} />
    </main>
  )
}
