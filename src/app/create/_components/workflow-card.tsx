import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkflowCardProps = {
  href: string
  conceptNumber: 1 | 2 | 3 | 4
  title: string
  subtitle: string
  description: string
  icon: LucideIcon
  accent: 'purple' | 'blue' | 'cyan' | 'pink'
  badges?: string[]
  creditRange: string
}

const ACCENT_STYLES: Record<
  WorkflowCardProps['accent'],
  { ring: string; glow: string; badge: string; icon: string }
> = {
  purple: {
    ring: 'group-hover:border-neon-purple/60',
    glow: 'group-hover:shadow-[0_0_32px_rgba(139,92,246,0.25)]',
    badge: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
    icon: 'from-neon-purple to-neon-blue',
  },
  blue: {
    ring: 'group-hover:border-neon-blue/60',
    glow: 'group-hover:shadow-[0_0_32px_rgba(59,130,246,0.25)]',
    badge: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
    icon: 'from-neon-blue to-neon-cyan',
  },
  cyan: {
    ring: 'group-hover:border-neon-cyan/60',
    glow: 'group-hover:shadow-[0_0_32px_rgba(6,182,212,0.25)]',
    badge: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
    icon: 'from-neon-cyan to-neon-blue',
  },
  pink: {
    ring: 'group-hover:border-neon-pink/60',
    glow: 'group-hover:shadow-[0_0_32px_rgba(236,72,153,0.25)]',
    badge: 'bg-neon-pink/15 text-neon-pink border-neon-pink/30',
    icon: 'from-neon-pink to-neon-purple',
  },
}

export function WorkflowCard({
  href,
  conceptNumber,
  title,
  subtitle,
  description,
  icon: Icon,
  accent,
  badges,
  creditRange,
}: WorkflowCardProps) {
  const a = ACCENT_STYLES[accent]
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-space-gray/60 p-6 transition',
        a.ring,
        a.glow,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
            a.icon,
          )}
        >
          <Icon className="size-6" />
        </span>
        <span className="text-xs text-muted-foreground">#{conceptNumber.toString().padStart(2, '0')}</span>
      </div>

      <h3 className="mt-5 text-2xl leading-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-3 text-sm text-muted-foreground/80">{description}</p>

      {badges && badges.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px]',
                a.badge,
              )}
            >
              {b}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">{creditRange}</span>
        <span className="inline-flex items-center gap-1 text-sm text-foreground/80 transition group-hover:gap-2 group-hover:text-foreground">
          시작하기 <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  )
}
