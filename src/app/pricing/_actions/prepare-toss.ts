'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PLANS, planExpiresAt, type PlanId } from '@/lib/payments/plans'

const Input = z.object({
  plan: z.enum(['starter', 'pro', 'business'] as const),
})

export type PrepareTossResult =
  | {
      ok: true
      orderId: string
      orderName: string
      amount: number
      customerKey: string
      customerEmail: string | null
      customerName: string | null
      successUrl: string
      failUrl: string
    }
  | { ok: false; error: string }

export async function prepareTossPayment(input: {
  plan: PlanId
}): Promise<PrepareTossResult> {
  const parsed = Input.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_plan' }
  const plan = PLANS[parsed.data.plan]

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const expiresAt = planExpiresAt(plan).toISOString()

  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      kind: 'purchase',
      status: 'pending',
      credits_delta: plan.credits,
      amount_krw: plan.priceKRW,
      provider: 'toss',
      plan: plan.id,
      expires_at: expiresAt,
      note: `${plan.name} 크레딧 구매`,
    })
    .select('id')
    .single()

  if (error || !tx) {
    return { ok: false, error: error?.message ?? 'failed_to_create_transaction' }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return {
    ok: true,
    orderId: tx.id,
    orderName: `${plan.name} · ${plan.credits} 크레딧`,
    amount: plan.priceKRW,
    customerKey: user.id,
    customerEmail: user.email ?? null,
    customerName:
      (user.user_metadata?.name as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      null,
    successUrl: `${origin}/payments/toss/success`,
    failUrl: `${origin}/payments/toss/fail`,
  }
}
