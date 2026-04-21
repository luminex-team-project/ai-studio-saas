import 'server-only'

import IORedis, { type Redis, type RedisOptions } from 'ioredis'
import { requireRedisUrl } from '@/lib/env'

// Shared Redis connection factory. BullMQ requires `maxRetriesPerRequest: null`
// for blocking commands used by workers. Upstash requires TLS — we auto-upgrade
// `redis://...upstash.io` to `rediss://` since some dashboards still paste the
// non-TLS scheme.

let connection: Redis | null = null

export function normalizeRedisUrl(raw: string): string {
  try {
    const u = new URL(raw)
    if (u.protocol === 'redis:' && u.hostname.endsWith('upstash.io')) {
      u.protocol = 'rediss:'
    }
    return u.toString()
  } catch {
    return raw
  }
}

export function getRedisConnection(): Redis {
  if (connection) return connection
  const url = normalizeRedisUrl(requireRedisUrl())
  const opts: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  }
  connection = new IORedis(url, opts)
  return connection
}
