// Credit plans — shared between /pricing UI and payment server actions.
//
// Prices in Korean Won (KRW, no decimals). `validityDays` sets the
// `transactions.expires_at` stamp on successful purchase.

export type PlanId = 'starter' | 'pro' | 'business'

export type Plan = {
  id: PlanId
  name: string
  credits: number
  priceKRW: number
  validityDays: number
  popular: boolean
  accent: string
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: '스타터',
    credits: 100,
    priceKRW: 9900,
    validityDays: 30,
    popular: false,
    accent: 'from-neon-purple to-neon-blue',
    features: [
      '셀피 영상 10개 생성',
      '제품 영상 4개 생성',
      '기본 템플릿 사용',
      '720p 다운로드',
      '30일 유효',
    ],
  },
  pro: {
    id: 'pro',
    name: '프로',
    credits: 300,
    priceKRW: 24900,
    validityDays: 60,
    popular: true,
    accent: 'from-neon-blue to-neon-cyan',
    features: [
      '셀피 영상 30개 생성',
      '제품 영상 12개 생성',
      '프리미엄 템플릿 사용',
      '1080p 다운로드',
      '워터마크 제거',
      '60일 유효',
    ],
  },
  business: {
    id: 'business',
    name: '비즈니스',
    credits: 1000,
    priceKRW: 79000,
    validityDays: 90,
    popular: false,
    accent: 'from-neon-cyan to-neon-pink',
    features: [
      '셀피 영상 100개 생성',
      '제품 영상 40개 생성',
      '모든 템플릿 무제한',
      '4K 다운로드',
      '워터마크 제거',
      '우선 지원',
      '90일 유효',
    ],
  },
}

export const PLAN_LIST: Plan[] = [PLANS.starter, PLANS.pro, PLANS.business]

export function planExpiresAt(plan: Plan, base: Date = new Date()): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + plan.validityDays)
  return d
}
