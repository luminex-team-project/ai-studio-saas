'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepIndicator } from '../_components/step-indicator'
import { NewsAngleForm, DEFAULT_NEWS_ANGLE, type NewsAngle } from '../_components/news-angle-form'
import {
  PromptTemplatePicker,
  type PromptTemplateOption,
} from '../_components/prompt-template-picker'
import { createAiNewsJob } from '../_actions/create-workflow-job'

type Stage = 'angle' | 'category' | 'review'

export function AiNewsWizard({ templates }: { templates: PromptTemplateOption[] }) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('angle')
  const [angle, setAngle] = useState<NewsAngle>(DEFAULT_NEWS_ANGLE)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stages: Stage[] = ['angle', 'category', 'review']
  const currentIdx = stages.indexOf(stage)

  const steps = [
    { number: 1, label: '뉴스 입력',    active: stage === 'angle',    completed: currentIdx > 0 },
    { number: 2, label: '카테고리',    active: stage === 'category', completed: currentIdx > 1 },
    { number: 3, label: '검토',        active: stage === 'review',   completed: false },
  ]

  const angleValid =
    angle.headline.trim().length > 0 &&
    angle.source_url.trim().length > 0 &&
    angle.summary.trim().length > 0

  async function submit() {
    if (!templateId) return setError('카테고리를 선택해주세요')
    if (!angleValid) return setError('필수 항목을 모두 입력해주세요')
    setSubmitting(true)
    setError(null)
    try {
      const result = await createAiNewsJob({
        prompt_template_id: templateId,
        angle,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/generating?type=ai_news&job=${result.jobId}`)
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
        {stage === 'angle' ? (
          <Section title="뉴스 입력" subtitle="헤드라인, 소스 URL, 2~3줄 요약">
            <NewsAngleForm value={angle} onChange={setAngle} />
            <Footer
              right={
                <PrimaryButton disabled={!angleValid} onClick={() => setStage('category')}>
                  다음 <ArrowRight className="size-4" />
                </PrimaryButton>
              }
            />
          </Section>
        ) : null}

        {stage === 'category' ? (
          <Section title="뉴스 카테고리" subtitle="B-roll 유형 선택">
            <PromptTemplatePicker templates={templates} value={templateId} onChange={setTemplateId} />
            <Footer
              left={<SecondaryButton onClick={() => setStage('angle')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={<PrimaryButton disabled={!templateId} onClick={() => setStage('review')}>다음 <ArrowRight className="size-4" /></PrimaryButton>}
            />
          </Section>
        ) : null}

        {stage === 'review' ? (
          <Section title="검토 및 생성" subtitle="내용을 확인한 뒤 생성하세요">
            <div className="rounded-2xl border border-border bg-space-gray/50 p-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="헤드라인" value={angle.headline} />
                <Row label="카테고리" value={templates.find((t) => t.id === templateId)?.display_name ?? '—'} />
                <Row label="소스 URL" value={angle.source_url} />
                <Row label="핵심 수치" value={angle.key_numbers} />
                <Row label="한국 영향" value={angle.korea_impact} />
              </dl>
              <div className="mt-4 rounded-lg border border-border bg-deep-space p-3 text-xs text-muted-foreground">
                {angle.summary}
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <Footer
              left={<SecondaryButton onClick={() => setStage('category')}><ArrowLeft className="size-4" /> 이전</SecondaryButton>}
              right={
                <PrimaryButton disabled={submitting} onClick={submit}>
                  {submitting ? '생성 중...' : <><Sparkles className="size-4" /> AI 뉴스 영상 생성 (15 크레딧)</>}
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

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm transition',
        disabled
          ? 'cursor-not-allowed bg-space-gray/60 text-muted-foreground'
          : 'neon-glow bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:brightness-110',
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
