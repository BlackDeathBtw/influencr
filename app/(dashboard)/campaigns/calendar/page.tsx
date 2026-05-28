import { createClient } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'
import CalendarClient from './client'

export default async function CampaignCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaigns }, { data: content }] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, name, start_date, end_date, status')
      .eq('user_id', user!.id)
      .or('start_date.not.is.null,end_date.not.is.null'),
    supabase
      .from('content')
      .select('id, due_date, type, status, campaign_id, campaign:campaigns(name), influencer:influencers(name)')
      .eq('user_id', user!.id)
      .not('due_date', 'is', null),
  ])

  const campaignEvents = (campaigns ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
  }))

  const contentEvents = (content ?? []).map((c: any) => ({
    id: c.id,
    due_date: c.due_date,
    type: c.type,
    status: c.status,
    campaign_name: c.campaign?.name ?? null,
    influencer_name: c.influencer?.name ?? null,
  }))

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays size={20} className="text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {campaignEvents.length} campaign{campaignEvents.length !== 1 ? 's' : ''} &middot; {contentEvents.length} content deadline{contentEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <CalendarClient campaigns={campaignEvents} content={contentEvents} />
      </div>
    </div>
  )
}
