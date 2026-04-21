import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = {
  number: number
  label: string
  active: boolean
  completed: boolean
}

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <ol className="mx-auto flex w-full max-w-2xl items-center justify-between">
      {steps.map((step, i) => (
        <li key={step.number} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-2">
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-full border text-sm transition',
                step.active &&
                  'border-neon-purple bg-neon-purple text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]',
                step.completed &&
                  'border-neon-purple/50 bg-neon-purple/20 text-neon-purple',
                !step.active && !step.completed && 'border-border bg-space-gray/60 text-muted-foreground',
              )}
            >
              {step.completed ? <Check className="size-4" /> : step.number}
            </span>
            <span
              className={cn(
                'text-xs',
                step.active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <div
              className={cn(
                'mx-3 h-px flex-1 transition',
                step.completed ? 'bg-neon-purple/50' : 'bg-border',
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}
