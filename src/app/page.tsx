import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Wand2,
  TrendingUp,
  Newspaper,
  Check,
} from 'lucide-react'
import { WorkflowCard, type WorkflowCardProps } from '@/app/create/_components/workflow-card'

export default function LandingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <Workflows />
      <HowItWorks />
      <PricingTeaser />
    </main>
  )
}

const WORKFLOWS: WorkflowCardProps[] = [
  {
    href: '/create/commercial-ad',
    conceptNumber: 1,
    title: '상업용 광고 영상',
    subtitle: '화장품 · 건강식품 등 제품 홍보',
    description:
      'AI 모델이 제품을 자연스럽게 사용하는 15~30초 광고. 브리프 → 스토리보드 → 납품까지.',
    icon: ShoppingBag,
    accent: 'purple',
    badges: ['Seedance Identity Lock', 'Kling 3.0', 'B2B 납품'],
    creditRange: '25 크레딧부터',
  },
  {
    href: '/create/scene-reenact',
    conceptNumber: 2,
    title: '명장면 재연',
    subtitle: '웹툰 · 애니메이션 실사 연기',
    description:
      '사진 한 장만 첨부하면 명장면 속 캐릭터를 내 얼굴로 교체. 와우 모먼트 5~8초 쇼츠.',
    icon: Wand2,
    accent: 'blue',
    badges: ['얼굴 일관성', 'Cinema 2.35:1', 'Kling i2v'],
    creditRange: '20 크레딧부터',
  },
  {
    href: '/create/trend-clone',
    conceptNumber: 3,
    title: '트렌드 복제',
    subtitle: 'TikTok · Reels · Shorts',
    description:
      '트렌드 영상 URL 또는 파일만 넣으면 구조 분석 후 내 버전으로 복제. 당일 게시용.',
    icon: TrendingUp,
    accent: 'cyan',
    badges: ['URL 역분석', '사운드 매칭', '24시간 내'],
    creditRange: '10 크레딧부터',
  },
  {
    href: '/create/ai-news',
    conceptNumber: 4,
    title: 'AI 뉴스 60초',
    subtitle: '핫 이슈 빠른 큐레이션',
    description:
      '뉴스 헤드라인 + URL만 입력. 아바타 진행 + B-roll 자동 합성으로 60초 영상 완성.',
    icon: Newspaper,
    accent: 'pink',
    badges: ['HeyGen 아바타', 'Veo B-roll', '12시간 내'],
    creditRange: '15 크레딧부터',
  },
]

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(circle_at_80%_85%,rgba(6,182,212,0.16),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-space-gray/80 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-neon-purple" />
            4가지 AI 영상 워크플로우 · Kling · Seedance · HeyGen
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
            기획부터 납품까지,
            <br />
            <span className="bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan bg-clip-text text-transparent">
              AI 영상 한 번에
            </span>
          </h1>
          <p className="mt-8 text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
            상업 광고 · 명장면 재연 · 트렌드 복제 · AI 뉴스까지.
            <br className="hidden sm:block" />
            각 용도에 최적화된 워크플로우로 60초 안에 영상을 만드세요.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth"
              className="neon-glow inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-base font-medium text-white transition hover:brightness-110"
            >
              무료 100 크레딧으로 시작
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#workflows"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-7 text-base text-foreground transition hover:bg-metal-gray"
            >
              워크플로우 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Workflows() {
  return (
    <section id="workflows" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            4가지 용도 × 맞춤 워크플로우
          </h2>
          <p className="mt-4 text-muted-foreground">
            용도마다 다른 도구 조합과 파이프라인. 일반 t2v 도구로는 만들 수 없는 퀄리티를 기본값으로.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {WORKFLOWS.map((w) => (
            <WorkflowCard key={w.href} {...w} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: '용도 선택',
      desc: '4가지 워크플로우 중 하나 픽. 각자 다른 입력/출력 구조.',
    },
    {
      n: '02',
      title: '소재 업로드',
      desc: '제품 사진 / 셀카 / 트렌드 URL / 뉴스 헤드라인.',
    },
    {
      n: '03',
      title: 'AI 생성',
      desc: 'Seedance Identity Lock · Kling 3.0 · Veo 3.1 · HeyGen 조합.',
    },
    {
      n: '04',
      title: '다운로드 · 게시',
      desc: '9:16 MP4. 쇼츠/릴스/틱톡 즉시 업로드. B2B는 Google Drive 링크.',
    },
  ]
  return (
    <section className="border-t border-border/60 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">제작 흐름 4단계</h2>
          <p className="mt-4 text-muted-foreground">기획 브리프부터 납품까지 한 화면에서.</p>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-border bg-space-gray/40 p-6">
              <span className="font-display text-sm text-neon-purple">{s.n}</span>
              <h3 className="mt-3 text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function PricingTeaser() {
  const features = [
    '신규 가입 시 100 크레딧 무료',
    '9:16 1080p MP4 다운로드',
    '워터마크 제거 (Pro 플랜~)',
    'B2B 납품 (수정 2회 포함)',
  ]
  return (
    <section className="border-t border-border/60 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-space-gray/80 to-space-gray/40 p-8 sm:p-12">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">지금 시작하세요</h2>
              <p className="mt-3 text-muted-foreground">
                가입 즉시 100 크레딧. 화장품 광고 2.5편 / 명장면 재연 5편 제작 가능.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="size-4 text-neon-purple" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/auth"
                className="neon-glow inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-base text-white transition hover:brightness-110"
              >
                무료 시작
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-7 text-base text-foreground transition hover:bg-metal-gray"
              >
                요금 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
