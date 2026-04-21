// Tiny exponential-backoff retry. Mirrors p-retry's contract but without
// pulling a dep. Only retries on `shouldRetry(err)` returning true.

export type RetryOptions = {
  attempts: number
  /** Base delay in ms; each retry multiplies by `factor`. */
  baseDelayMs: number
  factor: number
  /** Hard cap on any single sleep. */
  maxDelayMs: number
  shouldRetry: (err: unknown) => boolean
  onRetry?: (err: unknown, attempt: number) => void
}

const DEFAULT_OPTS: RetryOptions = {
  attempts: 5,
  baseDelayMs: 500,
  factor: 2,
  maxDelayMs: 15_000,
  shouldRetry: () => true,
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const o: RetryOptions = { ...DEFAULT_OPTS, ...opts }
  let lastErr: unknown
  for (let attempt = 1; attempt <= o.attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt === o.attempts || !o.shouldRetry(err)) break
      o.onRetry?.(err, attempt)
      const delay = Math.min(o.maxDelayMs, o.baseDelayMs * o.factor ** (attempt - 1))
      // Add mild jitter so parallel retries don't thundering-herd the API.
      const jittered = delay * (0.75 + Math.random() * 0.5)
      await new Promise((r) => setTimeout(r, jittered))
    }
  }
  throw lastErr
}

/** Classifier for "retryable" network errors: 429, 5xx, fetch-level failures. */
export function isRetryableHttpError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  // Heuristic — adapters throw messages containing the status code.
  if (/\b(429|500|502|503|504|522|524)\b/.test(msg)) return true
  if (/(econnreset|etimedout|fetch failed|network|socket hang up)/.test(msg)) return true
  return false
}
