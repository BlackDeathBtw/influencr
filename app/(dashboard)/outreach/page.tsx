import { createClient } from '@/lib/supabase/server'
import OutreachClient from './client'

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: templates }, { data: influencers }] = await Promise.all([
    supabase.from('outreach_templates').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('influencers').select('id, name, handle, niche, platform, contact_email').eq('user_id', user!.id).order('name'),
  ])

  return <OutreachClient templates={templates ?? []} influencers={influencers ?? []} />
}
