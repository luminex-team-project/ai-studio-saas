import Link from 'next/link'
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  fetchProductModels,
  fetchPromptTemplates,
} from '@/lib/supabase/workflow-queries'

export const dynamic = 'force-dynamic'

export default async function AdminIndexPage() {
  const supabase = await createClient()
  const [models, templates, jobsRes] = await Promise.all([
    fetchProductModels(supabase),
    fetchPromptTemplates(supabase),
    supabase
      .from('video_jobs')
      .select('id, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const jobs = jobsRes.data ?? []

  const modelsReady = models.filter(
    (m) => m.seedance_identity_lock_id && m.elevenlabs_voice_id,
  ).length

  const conceptCounts = [1, 2, 3, 4].map(
    (c) => templates.filter((t) => t.concept_id === c && t.is_active).length,
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl">세팅 체크리스트</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          MVP를 실제 운영하기 전 완료해야 할 수동 작업 상태.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="AI 모델 (Concept 1)"
          value={`${modelsReady} / ${models.length}`}
          hint="Seedance Lock ID + 보이스 ID 등록 완료"
          status={modelsReady === models.length && models.length > 0 ? 'ok' : 'todo'}
          href="/admin/product-models"
        />
        <StatCard
          title="프롬프트 템플릿"
          value={`${templates.filter((t) => t.is_active).length}개 활성`}
          hint={`Concept별: ${conceptCounts.map((c, i) => `#${i + 1}=${c}`).join(' · ')}`}
          status={templates.length > 0 ? 'ok' : 'todo'}
          href="/admin/templates"
        />
        <StatCard
          title="최근 영상 작업"
          value={`${jobs.length}건`}
          hint={jobs.length > 0 ? `최근: ${jobs[0].status}` : '아직 작업 없음'}
          status="info"
          href="/my-videos"
        />
      </section>

      <section className="rounded-2xl border border-border bg-space-gray/40 p-6">
        <h3 className="text-lg">다음 액션</h3>
        <ol className="mt-4 space-y-3 text-sm">
          <ActionStep
            done={models.some((m) => m.is_active)}
            title="product_models 시드 확인"
            desc="마이그레이션 적용 시 자동 시드됨. 관리자 페이지에서 3명 확인."
          />
          <ActionStep
            done={modelsReady === models.length && models.length > 0}
            title="Seedance Identity Lock 등록 + voice_id 세팅"
            desc="각 모델당 reference 3장 업로드 → Seedance 대시보드 등록 → ID 받아오기."
          />
          <ActionStep
            done={templates.length > 0}
            title="prompt_templates 시드 확인"
            desc="4 컨셉 × 19개 기본 템플릿 시드됨. 운영하면서 관리자에서 추가/비활성화."
          />
          <ActionStep
            done={false}
            title="외부 API 키 세팅 (선택)"
            desc="SEEDANCE_API_KEY, HEYGEN_API_KEY, GOOGLE_VEO_PROJECT, HEDRA_API_KEY — 비면 Kling/Luma로 폴백."
          />
        </ol>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Admin 역할은 `profiles.role = 'admin'`으로 설정.{' '}
        Supabase SQL editor에서 <code className="rounded bg-space-gray px-1">update profiles set role = &apos;admin&apos; where id = &apos;&lt;your_user_id&gt;&apos;;</code>
      </p>
    </div>
  )
}

function StatCard({
  title,
  value,
  hint,
  status,
  href,
}: {
  title: string
  value: string
  hint: string
  status: 'ok' | 'todo' | 'info'
  href: string
}) {
  const statusColor = status === 'ok' ? 'text-emerald-300' : status === 'todo' ? 'text-amber-300' : 'text-muted-foreground'
  const Icon = status === 'ok' ? CheckCircle2 : status === 'todo' ? AlertTriangle : ArrowRight
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-space-gray/40 p-5 transition hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <Icon className={`size-4 ${statusColor}`} />
      </div>
      <div className="mt-3 text-2xl text-foreground">{value}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </Link>
  )
}

function ActionStep({ done, title, desc }: { done: boolean; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
        }`}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
      </span>
      <div>
        <div className="text-foreground">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  )
}
