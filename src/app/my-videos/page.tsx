import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyVideosGrid, type VideoCard } from './grid'

export const dynamic = 'force-dynamic'

const ACCENTS = [
  'from-neon-purple/35 to-neon-pink/15',
  'from-neon-blue/35 to-neon-cyan/15',
  'from-neon-cyan/35 to-neon-purple/15',
  'from-neon-pink/35 to-neon-blue/15',
]

export default async function MyVideosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/my-videos')

  const { data: rows } = await supabase
    .from('video_jobs')
    .select(
      'id, type, status, duration_seconds, created_at, template_id, ai_model_id, output_thumbnail_url',
    )
    .eq('user_id', user.id)
    .in('status', ['completed', 'processing'])
    .order('created_at', { ascending: false })
    .limit(60)

  const videos: VideoCard[] = (rows ?? []).map((v, i) => ({
    id: v.id,
    type: v.type,
    status: v.status,
    duration: v.duration_seconds ? `${v.duration_seconds}s` : '—',
    title:
      v.type === 'selfie'
        ? '셀피 영상'
        : v.type === 'product'
          ? '제품 홍보 영상'
          : '텍스트 영상',
    createdAt: v.created_at,
    thumbnail: v.output_thumbnail_url,
    accent: ACCENTS[i % ACCENTS.length],
  }))

  return <MyVideosGrid videos={videos} />
}
