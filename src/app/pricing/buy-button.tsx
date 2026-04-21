'use client'

import { useState } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

type TossPaymentsInstance = Awaited<ReturnType<typeof loadTossPayments>>
import { Sparkles } from 'lucide-react'
import { publicEnv } from '@/lib/env'
import { cn } from '@/lib/utils'
import { prepareTossPayment } from './_actions/prepare-toss'
import type { PlanId } from '@/lib/payments/plans'

type Props = {
  plan: PlanId
  popular: boolean
}

let tossPromise: Promise<TossPaymentsInstance> | null = null
function getToss() {
  if (!tossPromise) {
    const env = publicEnv()
    const clientKey = env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) {
      throw new Error(
        'NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았어요. .env.local을 확인해주세요.',
      )
    }
    tossPromise = loadTossPayments(clientKey)
  }
  return tossPromise
}

export function BuyButton({ plan, popular }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setPending(true)
    setError(null)
    try {
      const prep = await prepareTossPayment({ plan })
      if (!prep.ok) {
        if (prep.error === 'unauthorized') {
          window.location.href = `/auth?next=/pricing`
          return
        }
        throw new Error(prep.error)
      }

      const toss = await getToss()
      const payment = toss.payment({ customerKey: prep.customerKey })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: prep.amount },
        orderId: prep.orderId,
        orderName: prep.orderName,
        customerEmail: prep.customerEmail ?? undefined,
        customerName: prep.customerName ?? undefined,
        successUrl: prep.successUrl,
        failUrl: prep.failUrl,
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      })
      // Toss redirects the browser on success/fail. If requestPayment resolves
      // without navigation the user typically closed the modal.
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
          'mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
          popular
            ? 'bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]'
            : 'border border-border-strong bg-space-gray/80 text-foreground hover:bg-metal-gray',
        )}
      >
        <Sparkles className="size-4" />
        {pending ? '결제창 준비 중...' : '구매하기'}
      </button>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </>
  )
}
