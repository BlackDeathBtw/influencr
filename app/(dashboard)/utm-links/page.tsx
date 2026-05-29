import { createClient } from '@/lib/supabase/server'
import { getUTMLinks } from '@/lib/utm-data'
import UTMLinksClient from './client'

export default async function UTMLinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [links, influencersRes, campaignsRes] = await Promise.all([
    getUTMLinks(user!.id),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).order('name'),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id).order('name'),
  ])

  return (
    <UTMLinksClient
      links={links}
      influencers={influencersRes.data ?? []}
      campaigns={campaignsRes.data ?? []}
    />
  )
}
