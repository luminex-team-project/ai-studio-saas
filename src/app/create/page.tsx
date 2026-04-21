import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Camera, Package, Check, Wand2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
        <p className="mt-4 text-xl text-muted-foreground">원하는 타입을 선택해주세요</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <ModeCard
          href="/create/selfie"
          icon={Camera}
          accent="from-neon-purple to-neon-pink"
          title="내 사진으로 영상"
          desc="전신 사진 한 장만 업로드하면 트렌디한 숏폼 영상으로 변환됩니다. 댄스 챌린지, 패션 리뷰, 일상 브이로그 등 다양한 템플릿을 선택할 수 있어요."
          bullets={['60초 내 자동 생성', '100+ 트렌드 템플릿', '크레딧 10개 사용']}
          ctaAccent="text-neon-purple"
        />
        <ModeCard
          href="/create/product"
          icon={Package}
          accent="from-neon-blue to-neon-cyan"
          title="제품 홍보 영상"
          desc="제품 사진과 AI 모델을 선택하면 전문적인 홍보 영상이 완성됩니다. 언박싱, 사용 리뷰, 비포/애프터 등 마케팅에 최적화된 시나리오를 제공합니다."
          bullets={['AI 모델 라이브러리', '다양한 시나리오', '크레딧 25개 사용']}
          ctaAccent="text-neon-cyan"
          badge={{ label: '프리미엄', color: 'neon-cyan' }}
        />
        <ModeCard
          href="/create/scene"
          icon={Wand2}
          accent="from-neon-cyan to-neon-purple"
          title="텍스트로 장면 생성"
          desc="사진 없이 프롬프트만으로 15초 영상을 만듭니다. 내러티브, 컨셉 몽타주, 액션 씬 등 상상하는 장면을 AI가 시네마틱하게 구성합니다."
          bullets={['사진 불필요', '장면 구성 자동 최적화', '크레딧 15개 사용']}
          ctaAccent="text-neon-cyan"
        />
      </div>
    </div>
  )
}

function ModeCard({
  href,
  icon: Icon,
  accent,
  title,
  desc,
  bullets,
  ctaAccent,
  badge,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  title: string
  desc: string
  bullets: string[]
  ctaAccent: string
  badge?: { label: string; color: 'neon-cyan' | 'neon-purple' }
}) {
  const badgeClass =
    badge?.color === 'neon-cyan'
      ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
      : 'bg-neon-purple/20 text-neon-purple border-neon-purple/40'
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-border bg-space-gray/60 p-8 transition hover:bg-metal-gray"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-px bg-gradient-to-br ${accent} opacity-0 transition group-hover:opacity-10`}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={`inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-[0_0_24px_rgba(139,92,246,0.4)]`}
        >
          <Icon className="size-7" />
        </span>
        {badge ? (
          <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass}`}>
            {badge.label}
          </span>
        ) : null}
      </div>
      <h2 className="relative mt-6 text-3xl">{title}</h2>
      <p className="relative mt-4 leading-relaxed text-muted-foreground">{desc}</p>
      <ul className="relative mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-sm">
            <span className={`inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white`}>
              <Check className="size-3" />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className={`relative mt-8 inline-flex items-center gap-2 text-sm ${ctaAccent}`}>
        <span>시작하기</span>
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
