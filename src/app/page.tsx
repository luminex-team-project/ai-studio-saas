import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Smartphone } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-28 sm:pt-32 sm:pb-36">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-space-gray/80 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-neon-purple" />
            Kling · Minimax AI · 60초 내 생성
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
            당신의 사진을
            <br />
            <span className="bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan bg-clip-text text-transparent">
              바이럴 영상으로
            </span>
          </h1>
          <p className="mt-8 text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
            전신 사진 한 장으로 트렌디한 숏폼 영상을 60초 만에 생성하세요.
            <br className="hidden sm:block" />
            AI 모델과 함께하는 제품 홍보 영상도 가능합니다.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth"
              className="neon-glow inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue px-7 text-base font-medium text-white transition hover:brightness-110"
            >
              지금 시작하기
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-7 text-base text-foreground transition hover:bg-metal-gray"
            >
              템플릿 둘러보기
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-20 aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl border border-border bg-space-gray">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.28),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.24),transparent_55%)]"
          />
          <div className="absolute inset-0 grid grid-cols-3 gap-4 p-6">
            {[
              { title: '댄스 챌린지', accent: 'from-neon-purple/30 to-neon-pink/20' },
              { title: '제품 언박싱', accent: 'from-neon-blue/30 to-neon-cyan/20' },
              { title: '트렌드 리액션', accent: 'from-neon-cyan/30 to-neon-purple/20' },
            ].map((c) => (
              <div
                key={c.title}
                className="relative overflow-hidden rounded-2xl border border-border bg-black/40"
              >
                <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${c.accent}`} />
                <div className="absolute bottom-3 left-3 text-xs text-foreground/90">
                  {c.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    {
      icon: Sparkles,
      title: 'AI 자동 생성',
      desc: '사진 업로드만 하면 AI가 자동으로 트렌디한 영상을 생성합니다',
      color: 'from-neon-purple to-neon-blue',
    },
    {
      icon: Users,
      title: '다양한 AI 모델',
      desc: '제품 홍보를 위한 프리미엄 AI 모델 라이브러리 제공',
      color: 'from-neon-blue to-neon-cyan',
    },
    {
      icon: Smartphone,
      title: 'SNS 최적화',
      desc: '인스타그램, 틱톡에 바로 업로드 가능한 9:16 포맷',
      color: 'from-neon-cyan to-neon-pink',
    },
  ]
  return (
    <section className="border-t border-border/60 px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-space-gray/60 p-7 transition hover:bg-metal-gray"
          >
            <span
              className={`inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}
            >
              <Icon className="size-5" />
            </span>
            <h3 className="mt-5 text-xl">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

