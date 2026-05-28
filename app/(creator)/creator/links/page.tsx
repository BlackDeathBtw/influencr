import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LinksClient from './client'

export const metadata = { title: 'My Links — influencr' }

async function getProfileAndLinks(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('id, username')
    .eq('user_id', userId)
    .single()

  if (!profile) return { profile: null, links: [] }

  const { data: links } = await supabase
    .from('creator_links')
    .select('id, title, url, click_count, sort_order')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true })

  return { profile, links: links ?? [] }
}

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { profile, links } = await getProfileAndLinks(user.id)

  if (!profile) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">My Links</h1>
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            You need a creator profile before you can add links.
          </p>
          <Link
            href="/creator/media-kit"
            className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors"
          >
            Set up your media kit first
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Links</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add links to appear on your public profile
          </p>
        </div>
        {profile.username && (
          <Link
            href={`/c/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View public page
          </Link>
        )}
      </div>

      <LinksClient links={links} />
    </div>
  )
}
