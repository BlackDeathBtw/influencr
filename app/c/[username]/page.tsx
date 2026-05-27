import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { formatNumber } from '@/lib/utils'

interface Props {
  params: Promise<{ username: string }>
}

function makeAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getProfile(username: string) {
  const admin = makeAdmin()
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profile) return null

  const { data: stats } = await admin
    .from('creator_platform_stats')
    .select('*')
    .eq('profile_id', profile.id)

  return { profile, stats: stats ?? [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const result = await getProfile(username)

  return {
    title: `@${username} — influencr`,
    description: result?.profile.bio ?? `Check out ${username}'s creator profile on influencr.`,
  }
}

export default async function CreatorPublicPage({ params }: Props) {
  const { username } = await params
  const result = await getProfile(username)

  if (!result) notFound()

  const { profile, stats } = result

  const displayName = profile.display_name ?? `@${profile.username}`

  let rateLabel: string | null = null
  if (profile.rate_min != null && profile.rate_max != null) {
    rateLabel = `$${profile.rate_min.toLocaleString()}–$${profile.rate_max.toLocaleString()}/post`
  } else if (profile.rate_min != null) {
    rateLabel = `From $${profile.rate_min.toLocaleString()}/post`
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-foreground">{displayName}</h1>

          {profile.username !== displayName.replace('@', '') && (
            <p className="text-muted-foreground text-sm mt-1">@{profile.username}</p>
          )}

          {profile.location && (
            <p className="text-muted-foreground text-sm mt-1">{profile.location}</p>
          )}

          {profile.bio && (
            <p className="text-foreground mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {profile.niches && profile.niches.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {profile.niches.map((niche: string) => (
                <span
                  key={niche}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-brand text-brand-foreground"
                >
                  {niche}
                </span>
              ))}
            </div>
          )}

          {rateLabel && (
            <p className="mt-5 text-sm font-semibold text-foreground">{rateLabel}</p>
          )}
        </div>

        {/* Platform stats */}
        {stats.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Platforms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map((stat: {
                id: string
                platform: string
                handle: string | null
                followers: number | null
                engagement_rate: number | null
              }) => (
                <div
                  key={stat.id}
                  className="bg-muted rounded-xl p-4 space-y-1"
                >
                  <p className="text-xs font-medium text-muted-foreground capitalize">{stat.platform}</p>
                  {stat.handle && (
                    <p className="text-sm font-semibold text-foreground">@{stat.handle.replace(/^@/, '')}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {stat.followers != null && (
                      <span className="text-sm font-bold text-foreground">
                        {formatNumber(stat.followers)}{' '}
                        <span className="text-xs font-normal text-muted-foreground">followers</span>
                      </span>
                    )}
                    {stat.engagement_rate != null && (
                      <span className="text-sm font-bold text-foreground">
                        {Number(stat.engagement_rate).toFixed(1)}%{' '}
                        <span className="text-xs font-normal text-muted-foreground">engagement</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Powered by{' '}
          <a href="/" className="text-foreground hover:underline font-medium">
            influencr
          </a>
        </p>
      </div>
    </main>
  )
}
