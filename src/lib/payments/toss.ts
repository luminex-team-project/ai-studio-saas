import 'server-only'

// Server-side Toss Payments helpers. All calls authenticate with the server
// secret key (Basic Auth: base64(secret + ':')).

type ConfirmResponse = {
  paymentKey: string
  orderId: string
  totalAmount: number
  status: string
  method?: string
  approvedAt?: string
}

const TOSS_BASE = 'https://api.tosspayments.com/v1'

function authHeader(): string {
  const secret = process.env.TOSS_SECRET_KEY
  if (!secret) {
    throw new Error(
      'TOSS_SECRET_KEY가 설정되지 않았어요. .env.local에 TOSS_SECRET_KEY=test_sk_... 를 추가해주세요.',
    )
  }
  const encoded = Buffer.from(`${secret}:`, 'utf8').toString('base64')
  return `Basic ${encoded}`
}

export async function confirmTossPayment(input: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<
  | { ok: true; data: ConfirmResponse }
  | { ok: false; status: number; error: string; code?: string }
> {
  const res = await fetch(`${TOSS_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body?.message ?? `toss_confirm_${res.status}`,
      code: body?.code,
    }
  }
  return { ok: true, data: body as ConfirmResponse }
}
