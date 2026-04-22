'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { StepIndicator } from '../_components/step-indicator'
import { PhotoDrop, type DroppedPhoto } from '../_components/photo-drop'
import { BriefForm, DEFAULT_BRIEF, type CommercialAdBrief } from '../_components/brief-form'
import { StoryboardEditor, DEFAULT_SHOTS, type StoryboardShot } from '../_components/storyboard-editor'
import {
  ProductModelPicker,
  type ProductModelOption,
} from '../_components/product-model-picker'
import {
  PromptTemplatePicker,
  type PromptTemplateOption,
} from '../_components/prompt-template-picker'
import { createCommercialAdJob } from '../_actions/create-workflow-job'

type Stage = 'brief' | 'template' | 'photos' | 'model' | 'storyboard' | 'review'

export function CommercialAdWizard({
  userId,
  models,
  templates,
}: {
  userId: string
  models: ProductModelOption[]
  templates: PromptTemplateOption[]
}) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('brief')
  const [brief, setBrief] = useState<CommercialAdBrief>(DEFAULT_BRIEF)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<DroppedPhoto[]>([])
  const [modelId, setModelId] = useState<string | null>(null)
  const [storyboard, setStoryboard] = useState<StoryboardShot[]>(DEFAULT_SHOTS)
  const [deliveryType, setDeliveryType] = useState<'self_post' | 'b2b_delivery'>('self_post')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (brief.category === 'cosmetic') return t.category === 'cosmetic'
      return t.category === 'health-supplement'
    })
  }, [templates, brief.category])

  const stages: Stage[] = ['brief', 'template', 'photos', 'model', 'storyboard', 'review']
  const currentIdx = stages.indexOf(stage)

  const steps = [
    { number: 1, label: '브리프',       active: stage === 'brief',       completed: currentIdx > 0 },
    { number: 2, label: '템플릿',       active: stage === 'template',    completed: currentIdx > 1 },
    { number: 3, label: '제품 사진',    active: stage === 'photos',      completed: currentIdx > 2 },
    { number: 4, label: '모델',         active: stage === 'model',       completed: currentIdx > 3 },
    { number: 5, label: '스토리보드',   active: stage === 'storyboard',  completed: currentIdx > 4 },
    { number: 6, label: '검토',         active: stage === 'review',      completed: false },
  ]

  const briefValid =
    brief.product_name.trim().length > 0 &&
    brief.usp.trim().length > 0 &&
    brief.benefit.trim().length > 0 &&
    brief.target.trim().length > 0

  async function submit() {
    if (!modelId) return setError('AI 모델을 선택해주세요')
    if (photos.length === 0) return setError('제품 사진을 1장 이상 첨부해주세요')
    if (!templateId) return setError('템플릿을 선택해주세요')
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const paths: string[] = []
      for (const p of photos) {
        const key = `${userId}/${crypto.randomUUID()}-${sanitize(p.file.name)}`
        const { error: upErr } = await supabase.storage
          .from('sources')
          .upload(key, p.file, { contentType: p.file.type, upsert: false })
        if (upErr) throw new Error(`업로드 실패: ${upErr.message}`)
        paths.push(key)
      }
      const result = await createCommercialAdJob({
        product_model_id: modelId,
        prompt_template_id: templateId,
        source_image_paths: paths,
        brief,
        storyboard,
        delivery_type: deliveryType,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=commercial_ad&job=${result.jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <StepIndicator steps={steps} />

      <div className="mt-14">
        {stage === 'brief' ? (
          <Section title="제품 브리프" subtitle="광고 기획에 필요한 기본 정보">
            <BriefForm value={brief} onChange={setBrief} />
            <Footer
              right={
                <PrimaryButton disabled={!briefValid} onClick={() => setStage('template')}>
                  다음 <ArrowRight className="size-4" />
                </PrimaryButton>
              }
            />
          </Section>
        ) : null}

        {stage === 'template' ? (
          <Section title="템플릿 선택" subtitle="제품 카테고리에 맞는 광고 유형을 고르세요">
            <PromptTemplatePicker
              templates={filteredTemplates}
              value={templateId}
              onChange={(id) => {
                setTemplateId(id)
                const t = filteredTemplates.find((x) => x.id === id)
                if (t && models.length > 0) {
                  const rec = t.recommended_model_slugs[0]
                  const match = models.find((m) => m.slug === rec)
                  if (match) setModelId(match.id)
                }
              }}
              emptyLabel={`등록된 ${brief.category === 'cosmetic' ? '화장품' : '건강식품'} 템플릿이 없습니다.`}
            />
            <Footer
              left={<SecondaryButton onClick={() => setStage('brief')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={!templateId} onClick={() => setStage('photos')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'photos' ? (
          <Section title="제품 사진 업로드" subtitle="정면 · 측면 · 사용 중 3각도 권장 (최대 3장)">
            <PhotoDrop value={photos} onChange={setPhotos} multiple max={3} />
            <Footer
              left={<SecondaryButton onClick={() => setStage('template')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={photos.length === 0} onClick={() => setStage('model')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'model' ? (
          <Section title="AI 모델 선택" subtitle="고정 페르소나 중 제품 톤에 맞는 모델을 고르세요">
            <ProductModelPicker models={models} value={modelId} onChange={setModelId} />
            <Footer
              left={<SecondaryButton onClick={() => setStage('photos')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={!modelId} onClick={() => setStage('storyboard')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'storyboard' ? (
          <Section title="스토리보드 설계" subtitle="Hook → Problem → Use → CTA 각 샷에 프롬프트를 적어주세요">
            <StoryboardEditor value={storyboard} onChange={setStoryboard} />
            <Footer
              left={<SecondaryButton onClick={() => setStage('model')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton onClick={() => setStage('review')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'review' ? (
          <Section title="검토 및 생성" subtitle="모든 내용을 확인한 뒤 생성하세요">
            <ReviewCard brief={brief} models={models} modelId={modelId} templates={filteredTemplates} templateId={templateId} shotsCount={storyboard.length} photoCount={photos.length} />
            <div className="mt-6 rounded-2xl border border-border bg-space-gray/40 p-5">
              <h4 className="text-sm">납품 방식</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  { v: 'self_post',    label: '직접 게시', hint: 'SNS에 바로 업로드' },
                  { v: 'b2b_delivery', label: 'B2B 납품',  hint: 'Google Drive + 수정 2회' },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setDeliveryType(o.v as 'self_post' | 'b2b_delivery')}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-left text-sm transition',
                      deliveryType === o.v
                        ? 'border-neon-purple bg-neon-purple/15 text-neon-purple'
                        : 'border-border bg-space-gray/60 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <div className="font-medium text-foreground">{o.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{o.hint}</div>
                  </button>
                ))}
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <Footer
              left={<SecondaryButton onClick={() => setStage('storyboard')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={
                <PrimaryButton disabled={submitting} onClick={submit}>
                  {submitting ? '생성 중...' : <><Sparkles className="size-4" /> 광고 영상 생성 (25 크레딧)</>}
                </PrimaryButton>
              }
            />
          </Section>
        ) : null}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-center">
        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  )
}

function ReviewCard({
  brief,
  models,
  modelId,
  templates,
  templateId,
  shotsCount,
  photoCount,
}: {
  brief: CommercialAdBrief
  models: ProductModelOption[]
  modelId: string | null
  templates: PromptTemplateOption[]
  templateId: string | null
  shotsCount: number
  photoCount: number
}) {
  const model = models.find((m) => m.id === modelId)
  const template = templates.find((t) => t.id === templateId)
  return (
    <div className="rounded-2xl border border-border bg-space-gray/50 p-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="제품명" value={brief.product_name} />
        <Row label="카테고리" value={brief.category === 'cosmetic' ? '화장품' : '건강식품'} />
        <Row label="USP" value={brief.usp} />
        <Row label="타깃" value={brief.target} />
        <Row label="톤" value={brief.tone} />
        <Row label="길이" value={`${brief.duration_sec}초`} />
        <Row label="템플릿" value={template?.display_name ?? '—'} />
        <Row label="AI 모델" value={model ? `${model.display_name} (${model.age_label})` : '—'} />
        <Row label="제품 사진" value={`${photoCount}장`} />
        <Row label="스토리보드" value={`${shotsCount}샷`} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || '—'}</dd>
    </div>
  )
}

function Footer({ left, right }: { left?: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div>{left ?? null}</div>
      <div>{right}</div>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm transition',
        disabled
          ? 'cursor-not-allowed bg-space-gray/60 text-muted-foreground'
          : 'neon-glow bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:brightness-110',
      )}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong bg-space-gray/60 px-5 text-sm text-foreground hover:bg-metal-gray"
    >
      {children}
    </button>
  )
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}
