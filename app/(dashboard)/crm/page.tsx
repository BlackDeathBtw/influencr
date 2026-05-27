import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import CrmKanban from './client'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: influencers } = await supabase
    .from('influencers')
    .select('id, name, handle, platform, niche, followers, engagement_rate, contact_email, contact_name, crm_stage, tags, status, outreach_status')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {influencers?.length ?? 0} creators
          </p>
        </div>
        <Link
          href="/influencers/new"
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} /> Add creator
        </Link>
      </div>
      <CrmKanban influencers={influencers ?? []} />
    </div>
  )
}
