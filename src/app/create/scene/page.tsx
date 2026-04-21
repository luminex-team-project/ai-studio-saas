import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SceneWizard } from './wizard'

export const dynamic = 'force-dynamic'

export default async function SceneCreatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/create/scene')

  return <SceneWizard />
}
