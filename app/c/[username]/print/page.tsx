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

async function getPrintData(username: string) {
  const admin = makeAdmin()

  const { data: profile } = await admin
    .from('creator_profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profile) return null

  const [{ data: stats }, { data: links }] = await Promise.all([
    admin.from('creator_platform_stats').select('*').eq('profile_id', profile.id),
    admin
      .from('creator_links')
      .select('id, title, url')
      .eq('profile_id', profile.id)
      .order('sort_order', { ascending: true }),
  ])

  return { profile, stats: stats ?? [], links: links ?? [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username} — Media Kit` }
}

export default async function PrintPage({ params }: Props) {
  const { username } = await params
  const result = await getPrintData(username)

  if (!result) notFound()

  const { profile, stats, links } = result

  const displayName = profile.display_name ?? `@${profile.username}`
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let rateLabel: string | null = null
  if (profile.rate_min != null && profile.rate_max != null) {
    rateLabel = `$${profile.rate_min.toLocaleString()}–$${profile.rate_max.toLocaleString()} per post`
  } else if (profile.rate_min != null) {
    rateLabel = `From $${profile.rate_min.toLocaleString()} per post`
  }

  return (
    <>
      {/* Inline styles override dark theme for this standalone print page */}
      <style>{`
        body { background: #ffffff !important; color: #111111 !important; }
        .mk-page * { box-sizing: border-box; }
        .mk-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          max-width: 760px;
          margin: 0 auto;
          padding: 48px 40px;
          background: #ffffff;
          color: #111111;
          font-size: 14px;
          line-height: 1.5;
          min-height: 100vh;
        }
        .mk-h1 { font-size: 26px; font-weight: 700; margin: 0 0 4px; color: #111; }
        .mk-h2 {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #777; margin: 0 0 14px;
        }
        .mk-meta { font-size: 13px; color: #555; margin: 0 0 3px; }
        .mk-rate { font-size: 13px; color: #111; font-weight: 600; margin: 6px 0 0; }
        .mk-bio { font-size: 14px; color: #333; margin: 20px 0 0; line-height: 1.65; white-space: pre-wrap; }
        .mk-niches { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 0; }
        .mk-niche {
          background: #f2f2f2; border-radius: 20px;
          padding: 3px 10px; font-size: 12px; color: #444;
        }
        .mk-section { margin-top: 36px; border-top: 1px solid #e5e5e5; padding-top: 24px; }
        .mk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .mk-card { border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; }
        .mk-platform-name {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; color: #888;
        }
        .mk-platform-handle { font-size: 14px; font-weight: 600; margin: 4px 0; color: #111; }
        .mk-stats { display: flex; gap: 20px; margin-top: 10px; }
        .mk-stat-val { font-size: 18px; font-weight: 700; color: #111; }
        .mk-stat-lbl { font-size: 11px; color: #999; }
        .mk-collab { font-size: 13px; color: #333; margin: 0; }
        .mk-collab-empty { font-size: 13px; color: #aaa; font-style: italic; margin: 0; }
        .mk-links { list-style: none; margin: 0; padding: 0; }
        .mk-link {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid #f0f0f0; gap: 12px;
        }
        .mk-link:last-child { border-bottom: none; }
        .mk-link-title { font-size: 13px; font-weight: 500; color: #111; }
        .mk-link-url { font-size: 12px; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
        .mk-footer {
          margin-top: 48px; border-top: 1px solid #e5e5e5; padding-top: 16px;
          display: flex; justify-content: space-between; font-size: 11px; color: #aaa;
        }
        @media print {
          @page { margin: 16mm 14mm; size: A4; }
          body { font-size: 12px !important; background: #fff !important; }
          .mk-page { padding: 0; max-width: 100%; }
          .mk-h1 { font-size: 22px; }
          .mk-section { page-break-inside: avoid; }
          .mk-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="mk-page">
        {/* Header */}
        <h1 className="mk-h1">{displayName}</h1>
        {profile.username && (
          <p className="mk-meta">@{profile.username}</p>
        )}
        {profile.location && (
          <p className="mk-meta">{profile.location}</p>
        )}
        {rateLabel && (
          <p className="mk-rate">{rateLabel}</p>
        )}

        {profile.niches && profile.niches.length > 0 && (
          <div className="mk-niches">
            {profile.niches.map((niche: string) => (
              <span key={niche} className="mk-niche">{niche}</span>
            ))}
          </div>
        )}

        {profile.bio && (
          <p className="mk-bio">{profile.bio}</p>
        )}

        {/* Platform Stats */}
        {stats.length > 0 && (
          <div className="mk-section">
            <h2 className="mk-h2">Platform Stats</h2>
            <div className="mk-grid">
              {stats.map((stat: {
                id: string
                platform: string
                handle: string | null
                followers: number | null
                engagement_rate: number | null
              }) => (
                <div key={stat.id} className="mk-card">
                  <p className="mk-platform-name">{stat.platform}</p>
                  {stat.handle && (
                    <p className="mk-platform-handle">@{stat.handle.replace(/^@/, '')}</p>
                  )}
                  <div className="mk-stats">
                    {stat.followers != null && (
                      <div>
                        <div className="mk-stat-val">{formatNumber(stat.followers)}</div>
                        <div className="mk-stat-lbl">followers</div>
                      </div>
                    )}
                    {stat.engagement_rate != null && (
                      <div>
                        <div className="mk-stat-val">{Number(stat.engagement_rate).toFixed(1)}%</div>
                        <div className="mk-stat-lbl">engagement</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Collaborations */}
        <div className="mk-section">
          <h2 className="mk-h2">Past Collaborations</h2>
          {profile.brands && Array.isArray(profile.brands) && profile.brands.length > 0 ? (
            <p className="mk-collab">{(profile.brands as string[]).join(', ')}</p>
          ) : (
            <p className="mk-collab-empty">Available upon request</p>
          )}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="mk-section">
            <h2 className="mk-h2">Links</h2>
            <ul className="mk-links">
              {links.map((link: { id: string; title: string; url: string }) => (
                <li key={link.id} className="mk-link">
                  <span className="mk-link-title">{link.title}</span>
                  <span className="mk-link-url">{link.url.replace(/^https?:\/\//, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mk-footer">
          <span>influencr.app/c/{profile.username}</span>
          <span>{today}</span>
        </div>
      </div>
    </>
  )
}
