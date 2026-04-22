import Image from 'next/image'
import { CheckCircle2, XCircle, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchProductModels } from '@/lib/supabase/workflow-queries'

export const dynamic = 'force-dynamic'

export default async function ProductModelsAdminPage() {
  const supabase = await createClient()
  const models = await fetchProductModels(supabase)

  const publicUrl = (path: string | null) => {
    if (!path) return null
    const { data: pub } = supabase.storage.from('templates').getPublicUrl(path)
    return pub.publicUrl ?? null
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-3xl">제품 광고 AI 모델</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Concept 1 상업 광고 전용 고정 페르소나 3명. 9장 reference 이미지 +
          Seedance Identity Lock ID + ElevenLabs Voice ID 등록이 모두 완료되면 실제 생성이 시작됩니다.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-space-gray/40 p-5 text-sm">
        <h3 className="font-medium">이미지 업로드 경로</h3>
        <p className="mt-1 text-muted-foreground">
          <code className="rounded bg-deep-space px-1.5 py-0.5">templates</code> 퍼블릭 버킷의{' '}
          <code className="rounded bg-deep-space px-1.5 py-0.5">product-models/&lt;slug&gt;/&#123;front,three_quarter,side&#125;.jpg</code> 경로에
          업로드해주세요. Supabase Dashboard → Storage에서 바로 업로드하거나 CLI 사용.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {models.map((m) => {
          const frontUrl = publicUrl(m.reference_front_path)
          const tqUrl = publicUrl(m.reference_three_quarter_path)
          const sideUrl = publicUrl(m.reference_side_path)
          const allImages = frontUrl && tqUrl && sideUrl
          const hasIds = m.seedance_identity_lock_id && m.elevenlabs_voice_id
          const ready = allImages && hasIds
          return (
            <article
              key={m.id}
              className="rounded-2xl border border-border bg-space-gray/40 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg">{m.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.slug} · {m.age_label} · {m.persona}
                  </div>
                </div>
                <span
                  className={
                    ready
                      ? 'inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300'
                      : 'inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300'
                  }
                >
                  {ready ? (
                    <>
                      <CheckCircle2 className="size-3" /> Ready
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3" /> Setup 필요
                    </>
                  )}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <RefImage url={frontUrl} label="정면" path={m.reference_front_path} />
                <RefImage url={tqUrl} label="45도" path={m.reference_three_quarter_path} />
                <RefImage url={sideUrl} label="측면" path={m.reference_side_path} />
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <Field label="Seedance Lock ID" value={m.seedance_identity_lock_id} />
                <Field label="Voice ID" value={m.elevenlabs_voice_id} />
                <Field label="MJ --cref URL" value={m.midjourney_cref_url} />
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="text-[11px] text-muted-foreground">Best for:</div>
                <ul className="mt-1 space-y-0.5">
                  {(m.best_for ?? []).slice(0, 3).map((b) => (
                    <li key={b} className="text-xs text-foreground/80">
                      · {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-space-gray/30 p-5 text-sm">
        <h3 className="font-medium">ID를 어디서 채우나요?</h3>
        <p className="mt-2 text-muted-foreground">
          현재 MVP는 어드민 UI에서 직접 편집하는 기능이 없습니다. 마이그레이션 SQL 또는
          Supabase SQL Editor에서 직접 update:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-deep-space p-3 text-xs text-foreground/80">{`update public.product_models
set seedance_identity_lock_id = '<YOUR_SEEDANCE_ID>',
    elevenlabs_voice_id = '<YOUR_VOICE_ID>',
    midjourney_cref_url = '<DISCORD_URL>'
where slug = 'yuna';`}</pre>
      </section>
    </div>
  )
}

function RefImage({
  url,
  label,
  path,
}: {
  url: string | null
  label: string
  path: string | null
}) {
  return (
    <div className="space-y-1">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-deep-space">
        {url ? (
          <Image src={url} alt={label} fill sizes="100px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            미업로드
          </div>
        )}
      </div>
      <div className="text-center text-[11px] text-muted-foreground">
        {label}
        {path ? (
          <div className="mt-0.5 truncate text-[9px] text-muted-foreground/60" title={path}>
            {path}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  const filled = Boolean(value)
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-deep-space px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`truncate font-mono text-[11px] ${filled ? 'text-foreground' : 'text-muted-foreground/60'}`}>
          {value ?? '— 미설정'}
        </div>
      </div>
      {filled ? <Copy className="size-3 shrink-0 text-muted-foreground" /> : null}
    </div>
  )
}
