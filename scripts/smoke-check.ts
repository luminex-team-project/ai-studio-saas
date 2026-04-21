#!/usr/bin/env node
// Quick preflight: verify Redis, Supabase admin, and each provider's keys.
// Does NOT call any paid API — only lists what we have configured.

import { createClient } from '@supabase/supabase-js'
import IORedis from 'ioredis'
import type { Database } from '../src/lib/supabase/types'

async function main() {
  console.log('=== smoke check ===')

  // Redis
  const rawRedisUrl = process.env.REDIS_URL
  if (!rawRedisUrl) {
    console.log('❌ REDIS_URL missing')
  } else {
    // Auto-upgrade to TLS for upstash.io (same logic as queue/redis.ts).
    const redisUrl = (() => {
      try {
        const u = new URL(rawRedisUrl)
        if (u.protocol === 'redis:' && u.hostname.endsWith('upstash.io')) u.protocol = 'rediss:'
        return u.toString()
      } catch {
        return rawRedisUrl
      }
    })()
    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    try {
      await redis.connect()
      const pong = await redis.ping()
      console.log(`✅ redis: ${pong}`)
      await redis.quit()
    } catch (e) {
      console.log('❌ redis connect failed:', e instanceof Error ? e.message : e)
    }
  }

  // Supabase admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.log('❌ Supabase URL or service role key missing')
  } else {
    const admin = createClient<Database>(url, key)
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, credits')
      .eq('email', 'acepark14@gmail.com')
      .maybeSingle()
    if (error) {
      console.log('❌ supabase query:', error.message)
    } else if (!data) {
      console.log('⚠  no profile for acepark14@gmail.com yet — sign in once first')
    } else {
      console.log(`✅ supabase: user=${data.id} credits=${data.credits}`)
    }

    // Also list mask pack images
    if (data) {
      const prefix = `${data.id}/bench`
      const { data: files } = await admin.storage.from('sources').list(prefix, { limit: 10 })
      const masks = (files ?? []).filter((f) => /mask_\d+\.(jpe?g|png)$/i.test(f.name))
      if (masks.length > 0) {
        console.log(`✅ mask images: ${masks.length} at sources/${prefix}/`)
      } else {
        console.log(`⚠  no mask_N.jpg at sources/${prefix}/ — scenario #1 will be skipped`)
      }
    }
  }

  // Providers
  console.log(
    `${process.env.KLING_API_KEY && process.env.KLING_API_SECRET ? '✅' : '❌'} Kling keys`,
  )
  console.log(`${process.env.RUNWAY_API_KEY ? '✅' : '❌'} Runway key`)
  console.log(`${process.env.LUMA_API_KEY ? '✅' : '❌'} Luma key`)
  const cloudOk =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  console.log(`${cloudOk ? '✅' : '⚠ '} Cloudinary (optional — fallback to raw passthrough)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
