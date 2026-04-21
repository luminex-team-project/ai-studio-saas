// Minimal structured logger with bindings. Matches a subset of the pino API
// so we can swap in pino later without touching call sites. The campaign
// pipeline runs under `tsx` (not Next.js server runtime), so we just write to
// stdout as single-line JSON. Pretty mode kicks in under TTYs.

type Bindings = Record<string, unknown>
type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const ACTIVE: Level = (process.env.LOG_LEVEL as Level) ?? 'info'
const PRETTY = process.stdout.isTTY && process.env.LOG_PRETTY !== '0'

function fmt(level: Level, bindings: Bindings, msg: string, extra?: Bindings) {
  const payload = { level, time: new Date().toISOString(), ...bindings, ...(extra ?? {}), msg }
  if (!PRETTY) return JSON.stringify(payload)
  const levelTag =
    level === 'error' ? '\x1b[31mERROR\x1b[0m'
      : level === 'warn' ? '\x1b[33mWARN\x1b[0m '
      : level === 'debug' ? '\x1b[90mDEBUG\x1b[0m'
      : '\x1b[36mINFO\x1b[0m '
  const ctx = Object.entries({ ...bindings, ...(extra ?? {}) })
    .filter(([k]) => k !== 'msg')
    .map(([k, v]) => `\x1b[90m${k}\x1b[0m=${v}`)
    .join(' ')
  return `${levelTag} ${msg}${ctx ? '  ' + ctx : ''}`
}

function emit(level: Level, bindings: Bindings, msg: string, extra?: Bindings) {
  if (LEVEL_RANK[level] < LEVEL_RANK[ACTIVE]) return
  const line = fmt(level, bindings, msg, extra)
  if (level === 'error') console.error(line)
  else console.log(line)
}

export interface Logger {
  debug: (msg: string, extra?: Bindings) => void
  info: (msg: string, extra?: Bindings) => void
  warn: (msg: string, extra?: Bindings) => void
  error: (msg: string, extra?: Bindings) => void
  child: (extra: Bindings) => Logger
}

export function createLogger(bindings: Bindings = {}): Logger {
  return {
    debug: (msg, extra) => emit('debug', bindings, msg, extra),
    info: (msg, extra) => emit('info', bindings, msg, extra),
    warn: (msg, extra) => emit('warn', bindings, msg, extra),
    error: (msg, extra) => emit('error', bindings, msg, extra),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  }
}

export const logger: Logger = createLogger({ app: 'campaign' })
