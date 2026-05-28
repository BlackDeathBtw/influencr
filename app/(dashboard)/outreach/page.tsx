import { createClient } from '@/lib/supabase/server'
import OutreachClient from './client'

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: templates }, { data: influencers }, { data: logs }, { data: sequences }] = await Promise.all([
    supabase.from('outreach_templates').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('influencers').select('id, name, handle, niche, platform, contact_email').eq('user_id', user!.id).order('name'),
    supabase.from('outreach_logs').select('id, to_email, subject, status, sent_at, opened_at, clicked_at, influencer:influencers(name)').eq('user_id', user!.id).order('sent_at', { ascending: false }).limit(100),
    supabase.from('email_sequences').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
  ])

  return (
    <OutreachClient
      templates={templates ?? []}
      influencers={influencers ?? []}
      logs={(logs ?? []) as any}
      sequences={(sequences ?? []) as any}
    />
  )
}
