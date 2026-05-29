import { createClient } from '@/lib/supabase/server'
import { getCampaignAnalytics } from '@/lib/analytics-data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AnalyticsEditor from '@/components/analytics-editor'

export default async function CampaignAnalyticsEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const analytics = await getCampaignAnalytics(user.id, id)
  if (!analytics) notFound()

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <Link
          href={`/campaigns/${id}/analytics`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to analytics
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-1">Update creator metrics</h1>
        <p className="text-sm text-muted-foreground">{analytics.name}</p>
      </div>

      <AnalyticsEditor campaignId={id} creators={analytics.creators} />
    </div>
  )
}
