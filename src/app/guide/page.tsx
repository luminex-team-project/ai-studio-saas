import Link from 'next/link'
import { Camera, Package, Wand2, CreditCard, Sparkles, Zap } from 'lucide-react'

export const metadata = {
  title: '도움말',
  description: 'Premium AI Studio 사용 가이드',
}

const TOC = [
  { id: 'getting-started', label: '시작하기' },
  { id: 'selfie', label: '내 사진으로 영상' },
  { id: 'product', label: '제품 홍보 영상' },
  { id: 'scene', label: '텍스트로 장면 생성' },
  { id: 'credits', label: '크레딧 시스템' },
  { id: 'tips', label: '결과물 품질을 높이는 팁' },
  { id: 'faq', label: '자주 묻는 질문' },
]

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
      <header className="text-center">
        <h1 className="font-display text-5xl">도움말</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Premium AI Studio 사용 가이드
        </p>
      </header>

      <nav className="mt-10 rounded-2xl border border-border bg-space-gray/40 p-5">
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">목차</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TOC.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="text-sm text-foreground/80 transition hover:text-neon-purple"
              >
                · {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="getting-started" title="시작하기" icon={Sparkles} accent="from-neon-purple to-neon-blue">
        <p>
          Premium AI Studio는 사진이나 텍스트만으로 15초짜리 숏폼 영상을 자동 생성하는 서비스입니다.
          Google 또는 카카오로 로그인하면 즉시 <strong className="text-foreground">100 크레딧</strong>이
          무료로 지급되며, 첫 영상을 바로 만들 수 있어요.
        </p>
        <ol className="mt-4 space-y-2 pl-6 text-sm text-muted-foreground [counter-reset:step]">
          <li>로그인 후 <Link href="/dashboard" className="text-neon-purple underline-offset-2 hover:underline">대시보드</Link>에서 시작합니다.</li>
          <li>영상 타입을 선택합니다 — 셀피 / 제품 / 텍스트 3가지 중 하나.</li>
          <li>안내에 따라 사진을 업로드하거나 프롬프트를 입력합니다.</li>
          <li>AI가 60초~3분 내에 영상을 생성합니다.</li>
          <li>완성된 영상은 <Link href="/my-videos" className="text-neon-purple underline-offset-2 hover:underline">내 영상</Link>에서 언제든 다시 볼 수 있습니다.</li>
        </ol>
      </Section>

      <Section id="selfie" title="내 사진으로 영상" icon={Camera} accent="from-neon-purple to-neon-pink">
        <p>
          전신 또는 상반신 사진 한 장만 있으면 트렌디한 숏폼 영상으로 변환됩니다. 댄스 챌린지,
          패션 리뷰, 일상 브이로그 등 <strong className="text-foreground">100+ 템플릿</strong> 중에서
          골라 사용합니다.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>· 크레딧: <strong className="text-foreground">10 크레딧</strong> / 영상 1개</li>
          <li>· 권장 사진: 얼굴이 선명하게 보이는 정면 / 전신 사진</li>
          <li>· 출력 길이: 15 / 30 / 60초 선택 가능</li>
        </ul>
      </Section>

      <Section id="product" title="제품 홍보 영상" icon={Package} accent="from-neon-blue to-neon-cyan">
        <p>
          제품 사진과 AI 모델을 조합해 전문적인 홍보 영상을 만듭니다. 언박싱, 사용 리뷰,
          비포/애프터 등 마케팅에 바로 쓸 수 있는 시나리오가 준비되어 있습니다.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>· 크레딧: <strong className="text-foreground">25 크레딧</strong> / 영상 1개</li>
          <li>· 업로드 가능: 최대 3장의 제품 사진 (다양한 각도 권장)</li>
          <li>· AI 모델 라이브러리에서 제품 컨셉에 맞는 모델 선택 가능</li>
        </ul>
      </Section>

      <Section id="scene" title="텍스트로 장면 생성" icon={Wand2} accent="from-neon-cyan to-neon-purple">
        <p>
          사진 없이 텍스트 프롬프트만으로 15초 영상을 생성합니다. 추상적인 컨셉, 내러티브 몽타주,
          상상하는 상황 등 자유롭게 묘사할 수 있어요.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>· 크레딧: <strong className="text-foreground">15 크레딧</strong> / 영상 1개</li>
          <li>· 프롬프트는 장면 구성 / 인물 묘사 / 분위기 / 카메라 무빙 순으로 작성하면 결과가 좋아집니다</li>
          <li>· 화면 비율 선택: 9:16 (쇼츠·릴스) / 16:9 (유튜브) / 1:1 (피드 광고)</li>
        </ul>
      </Section>

      <Section id="credits" title="크레딧 시스템" icon={CreditCard} accent="from-neon-pink to-neon-purple">
        <p>
          영상 생성에는 크레딧이 사용되며, 생성 <strong className="text-foreground">실패 시 자동 환불</strong>됩니다.
          가입 시 100 크레딧이 무료로 지급되고, 부족하면 <Link href="/pricing" className="text-neon-purple underline-offset-2 hover:underline">요금제</Link>에서 충전할 수 있습니다.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-space-gray/80 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">영상 타입</th>
                <th className="px-4 py-3 text-right font-normal">소요 크레딧</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-4 py-3">셀피 영상</td><td className="px-4 py-3 text-right">10</td></tr>
              <tr><td className="px-4 py-3">텍스트 → 장면</td><td className="px-4 py-3 text-right">15</td></tr>
              <tr><td className="px-4 py-3">제품 홍보 영상</td><td className="px-4 py-3 text-right">25</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="tips" title="결과물 품질을 높이는 팁" icon={Zap} accent="from-neon-purple to-neon-cyan">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">· 사진은 해상도와 조명이 전부입니다.</strong> 뿌옇거나 역광인 사진은 AI가 얼굴 특징을 잘 잡지 못합니다.
          </li>
          <li>
            <strong className="text-foreground">· 프롬프트는 구체적으로.</strong> "따뜻한 분위기" 보다는 "오후 햇살, 한강, 카페 테라스, 아이스 아메리카노, 미소"처럼 구체적인 묘사가 좋습니다.
          </li>
          <li>
            <strong className="text-foreground">· 제품 영상은 3장 풀로.</strong> 정면 / 측면 / 사용 예시 사진을 모두 넣으면 AI 모델이 자연스럽게 제품을 다룹니다.
          </li>
          <li>
            <strong className="text-foreground">· 실패하면 프롬프트 톤을 바꿔보세요.</strong> 동일 프롬프트 재시도보다 단어 몇 개만 바꾸는 쪽이 성공률이 높아요.
          </li>
        </ul>
      </Section>

      <Section id="faq" title="자주 묻는 질문" icon={Sparkles} accent="from-neon-blue to-neon-purple">
        <div className="space-y-4">
          {[
            {
              q: '생성된 영상은 상업적으로 사용 가능한가요?',
              a: '네, 유료 플랜 사용자는 본인이 생성한 영상에 대한 상업적 이용 권한을 가집니다. 가입 시 지급된 무료 크레딧으로 만든 영상은 개인적 이용만 가능합니다.',
            },
            {
              q: '내 사진은 AI 학습에 사용되나요?',
              a: '아니요. 업로드한 사진은 영상 생성 목적으로만 사용되며, 모델 학습에 사용되지 않습니다. 계정 삭제 시 모든 사진이 영구 삭제됩니다.',
            },
            {
              q: '영상 생성이 멈춘 것 같아요',
              a: '프로바이더 서버 상황에 따라 최대 6분까지 걸릴 수 있습니다. 10분이 지나도 진행이 없으면 자동으로 실패 처리되고 크레딧이 환불됩니다.',
            },
            {
              q: '크레딧 환불은 얼마나 걸리나요?',
              a: '생성 실패 시 즉시 자동 환불되고, 구매 후 7일 이내 미사용 크레딧은 전액 환불 가능합니다.',
            },
          ].map((f) => (
            <details key={f.q} className="group rounded-xl border border-border bg-space-gray/40 p-4 transition open:bg-metal-gray">
              <summary className="flex cursor-pointer items-center justify-between text-sm">
                <span>{f.q}</span>
                <span aria-hidden className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <div className="mt-14 rounded-2xl border border-border bg-space-gray/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          여기서 답을 찾지 못하셨나요? 우측 상단 <strong className="text-foreground">더보기</strong> 메뉴의 <strong className="text-foreground">문의</strong>를 통해 문의해주세요.
        </p>
      </div>
    </div>
  )
}

function Section({
  id,
  title,
  icon: Icon,
  accent,
  children,
}: {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <Icon className="size-5" />
        </span>
        <h2 className="font-display text-3xl">{title}</h2>
      </div>
      <div className="mt-5 leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}
