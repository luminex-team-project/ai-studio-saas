import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Processor } from './processor'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ type?: string; job?: string }>
}

export default async function GeneratingPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/generating')

  const { job: jobId } = await searchParams
  if (!jobId) notFound()

  const { data: job } = await supabase
    .from('video_jobs')
    .select('id, status, progress, credits_cost, user_id')
    .eq('id', jobId)
    .maybeSingle()

  if (!job) notFound()
  if (job.user_id !== user.id) notFound()
  if (job.status === 'completed') redirect(`/result/${job.id}`)

  return (
    <Processor
      jobId={job.id}
      initialStatus={job.status}
      initialProgress={job.progress}
      credits={job.credits_cost}
    />
  )
}
