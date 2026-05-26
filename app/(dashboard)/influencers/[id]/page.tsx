import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InfluencerForm from '@/components/influencer-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EditInfluencerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: influencer } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!influencer) notFound()

  return (
    <div className="p-8">
      <Link href="/influencers" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
        <ChevronLeft size={14} /> Back to influencers
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{influencer.name}</h1>
      <InfluencerForm influencer={influencer} />
    </div>
  )
}
