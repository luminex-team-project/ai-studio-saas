import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/env'
import type { Database } from './types'

// Service-role client. Bypasses RLS — never import this from a client component
// or surface its results back without filtering.
export function createAdminClient() {
  const env = serverEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey.length === 0) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local — ' +
        'get the value from Supabase dashboard → Project Settings → API → service_role (secret).',
    )
  }
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
