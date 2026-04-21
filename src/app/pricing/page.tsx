import { Check } from 'lucide-react'
import { PLAN_LIST, type Plan } from '@/lib/payments/plans'
import { cn } from '@/lib/utils'
import { BuyButton } from './buy-button'

const FAQ = [
  {
    question: '크레딧은 어떻게 사용하나요?',
    answer:
      '셀피 영상 1개당 10 크레딧, 제품 영상 1개당 25 크레딧이 사용됩니다. 생성 실패 시 크레딧이 차감되지 않습니다.',
  },
  {
    question: '유효기간이 지나면 어떻게 되나요?',
    answer:
      '유효기간 내 사용하지 못한 크레딧은 자동으로 소멸됩니다. 추가 구매 시 유효기간이 가장 긴 크레딧부터 사용됩니다.',
  },
  {
    question: '환불이 가능한가요?',
    answer:
      '구매 후 7일 이내, 크레딧 사용 전이라면 전액 환불 가능합니다. 일부 사용 후에는 환불이 불가능합니다.',
  },
] as const

const wonFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

export default function PricingPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="text-center">
            <h1 className="font-display text-5xl">크레딧 충전</h1>
            <p className="mt-4 text-xl text-muted-foreground">
              필요한 만큼만 구매하세요. 유효기간 내 자유롭게 사용 가능합니다.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PLAN_LIST.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>

          <section className="mt-24">
            <h2 className="text-center font-display text-3xl">자주 묻는 질문</h2>
            <div className="mx-auto mt-10 max-w-3xl space-y-4">
              {FAQ.map((f) => (
                <details
                  key={f.question}
                  className="group rounded-2xl border border-border bg-space-gray/60 p-5 transition open:bg-metal-gray"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base">
                    <span>{f.question}</span>
                    <span
                      aria-hidden
                      className="text-muted-foreground transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
    </main>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        'relative rounded-3xl border bg-space-gray/60 p-7 transition',
        plan.popular
          ? 'border-neon-blue/60 shadow-[0_0_32px_rgba(59,130,246,0.35)]'
          : 'border-border hover:border-border-strong',
      )}
    >
      {plan.popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan px-4 py-1 text-xs text-white">
          가장 인기있는
        </span>
      ) : null}

      <h3 className="font-display text-2xl">{plan.name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl">{wonFormatter.format(plan.priceKRW)}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.credits} 크레딧</p>

      <ul className="mt-6 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${plan.accent} text-white`}
            >
              <Check className="size-3" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <BuyButton plan={plan.id} popular={plan.popular} />
    </div>
  )
}
