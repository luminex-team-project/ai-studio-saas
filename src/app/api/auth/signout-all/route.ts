import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Revokes every refresh token issued to the current user across all devices.
// The cookie-bound session is also cleared locally as part of signOut().
//
// Uses POST so the endpoint isn't callable via prefetch / CSRF-style GET.
// The underlying call is idempotent; returning 200 on both "no session" and
// "session destroyed" keeps client code simple.

export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: true, signedOut: false })
  }

  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, signedOut: true })
}
