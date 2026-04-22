import { redirect } from 'next/navigation'
import { ShoppingBag, Wand2, TrendingUp, Newspaper } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WorkflowCard, type WorkflowCardProps } from '@/app/create/_components/workflow-card'

export const dynamic = 'force-dynamic'

const WORKFLOWS: WorkflowCardProps[] = [
  {
    href: '/create/commercial-ad',
    conceptNumber: 1,
    title: '상업용 광고 영상',
    subtitle: '화장품 · 건강식품 제품 홍보',
    description:
      '브리프 입력 → 4샷 스토리보드 설계 → AI 모델 픽 → 15~30초 광고 납품.',
    icon: ShoppingBag,
    accent: 'purple',
    badges: ['Seedance Identity Lock', '스토리보드 4샷', 'B2B 납품'],
    creditRange: '25 크레딧부터',
  },
  {
    href: '/create/scene-reenact',
    conceptNumber: 2,
    title: '명장면 재연',
    subtitle: '웹툰 · 애니 실사 연기',
    description:
      '명장면 클립 + 내 사진만 업로드. 캐릭터를 내 얼굴로 교체한 5~8초 와우 컷.',
    icon: Wand2,
    accent: 'blue',
    badges: ['사진 업로드', 'Cinema 2.35:1', '얼굴 보존'],
    creditRange: '20 크레딧부터',
  },
  {
    href: '/create/trend-clone',
    conceptNumber: 3,
    title: '트렌드 복제',
    subtitle: 'TikTok · Reels · Shorts',
    description:
      '트렌드 영상 URL 또는 파일 업로드. 구조 분석 후 내 버전으로 자동 복제.',
    icon: TrendingUp,
    accent: 'cyan',
    badges: ['URL 역분석', '사운드 매칭', '24h 내'],
    creditRange: '10 크레딧부터',
  },
  {
    href: '/create/ai-news',
    conceptNumber: 4,
    title: 'AI 뉴스 60초',
    subtitle: '핫 이슈 빠른 큐레이션',
    description:
      '헤드라인 + 공식 URL 입력. 아바타 진행 + B-roll 자동 합성 60초 영상.',
    icon: Newspaper,
    accent: 'pink',
    badges: ['HeyGen 아바타', 'Veo B-roll', '12h 내'],
    creditRange: '15 크레딧부터',
  },
]

export default async function CreateModePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create')

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-5xl leading-tight">어떤 영상을 만들까요?</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          4가지 용도 중 하나를 선택해주세요
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {WORKFLOWS.map((w) => (
          <WorkflowCard key={w.href} {...w} />
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        💡 이전 플로우(셀피 / 제품 / 씬)는 기존 링크로 유지됩니다.
        {' '}
        <a href="/create/selfie" className="text-neon-purple underline-offset-2 hover:underline">
          셀피
        </a>
        {' · '}
        <a href="/create/product" className="text-neon-purple underline-offset-2 hover:underline">
          제품
        </a>
        {' · '}
        <a href="/create/scene" className="text-neon-purple underline-offset-2 hover:underline">
          씬
        </a>
      </p>
    </div>
  )
}
