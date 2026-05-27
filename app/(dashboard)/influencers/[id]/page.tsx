import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InfluencerForm from '@/components/influencer-form'
import InfluencerExtras from '@/components/influencer-extras'
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://influencr-five.vercel.app'

  return (
    <div className="p-8">
      <Link href="/influencers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft size={14} /> Back to influencers
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">{influencer.name}</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InfluencerForm influencer={influencer} />
        </div>
        <div className="space-y-4">
          <InfluencerExtras
            influencer={influencer}
            portalUrl={`${appUrl}/portal/${influencer.portal_token}`}
          />
        </div>
      </div>
    </div>
  )
}
