import { CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchPromptTemplates } from '@/lib/supabase/workflow-queries'

export const dynamic = 'force-dynamic'

const CONCEPT_NAMES: Record<number, string> = {
  1: '상업용 광고',
  2: '명장면 재연',
  3: '트렌드 복제',
  4: 'AI 뉴스',
}

export default async function TemplatesAdminPage() {
  const supabase = await createClient()
  const templates = await fetchPromptTemplates(supabase)
  const grouped = [1, 2, 3, 4].map((c) => ({
    concept_id: c,
    name: CONCEPT_NAMES[c],
    items: templates.filter((t) => t.concept_id === c),
  }))

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-3xl">프롬프트 템플릿</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          4가지 컨셉 × 카테고리 × 서브카테고리 구조. 위저드 각 단계에서 이 테이블을 읽어와 사용자에게 노출.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-space-gray/40 p-5 text-sm">
        <h3 className="font-medium">시드 출처</h3>
        <p className="mt-1 text-muted-foreground">
          <code className="rounded bg-deep-space px-1.5 py-0.5">
            supabase/migrations/20260423000200_four_workflows_seed.sql
          </code>{' '}
          기준. content-marketing/ 디렉토리의 prompts.json과 동기화되어 있으며, 운영 중 추가는 SQL 또는
          차기 CRUD UI로 관리.
        </p>
      </section>

      {grouped.map((g) => (
        <section key={g.concept_id}>
          <div className="mb-4 flex items-center gap-3">
            <span className="font-display text-lg text-neon-purple">#{g.concept_id.toString().padStart(2, '0')}</span>
            <h3 className="text-xl">{g.name}</h3>
            <span className="rounded-full border border-border bg-space-gray/60 px-2.5 py-0.5 text-xs text-muted-foreground">
              {g.items.length}개
            </span>
          </div>
          {g.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              등록된 템플릿이 없습니다. 시드 마이그레이션을 확인하세요.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-space-gray/80 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">카테고리</th>
                    <th className="px-4 py-3 text-left">길이</th>
                    <th className="px-4 py-3 text-left">추천 모델</th>
                    <th className="px-4 py-3 text-left">플랫폼</th>
                    <th className="px-4 py-3 text-left">상태</th>
                  </tr>
                </thead>
                <tbody className="bg-space-gray/30">
                  {g.items.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={
                        idx !== g.items.length - 1 ? 'border-b border-border/60' : ''
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="text-foreground">{t.display_name}</div>
                        {t.description ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {t.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.category ?? '—'} / {t.subcategory}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.duration_sec}s</td>
                      <td className="px-4 py-3">
                        {(t.recommended_model_slugs ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(t.recommended_model_slugs ?? []).map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-neon-purple/10 px-2 py-0.5 text-[11px] text-neon-purple"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(t.platform_target ?? []).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                            <CheckCircle2 className="size-3" /> 활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="size-3" /> 비활성
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
