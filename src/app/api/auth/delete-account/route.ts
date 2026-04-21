import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Permanently deletes the caller's account.
//
// Order of operations matters:
//   1. Verify the caller is authenticated (cookie-based client).
//   2. Sign them out globally so no stale refresh tokens linger.
//   3. Best-effort cleanup of their Storage objects (not covered by FK cascades).
//   4. Call admin.auth.admin.deleteUser() — this cascades to:
//         profiles → video_jobs → transactions  (all have on-delete-cascade).
//
// POST-only so browsers won't fire it from a link prefetch.

const STORAGE_BUCKETS = ['sources', 'videos', 'thumbnails'] as const

export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Revoke every refresh token before nuking the user — defence in depth.
  await supabase.auth.signOut({ scope: 'global' })

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'admin_unavailable' },
      { status: 500 },
    )
  }

  // Best-effort: wipe Storage objects under the user's folder. We cap at 1000
  // files per bucket (Supabase list limit). A stray file leaking is
  // preferable to the request failing outright on transient errors.
  for (const bucket of STORAGE_BUCKETS) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 })
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`)
        await admin.storage.from(bucket).remove(paths)
      }
    } catch {
      // Swallow — proceed with account deletion regardless.
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
