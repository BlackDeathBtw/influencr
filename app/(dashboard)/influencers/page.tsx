import { createClient } from '@/lib/supabase/server'
import { getInfluencers } from '@/lib/data'
import Link from 'next/link'
import { Plus, ShieldCheck } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { Influencer } from '@/types'
import CsvImport from '@/components/csv-import'
import { getCredibility } from '@/lib/credibility'

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/15 text-pink-400',
  tiktok: 'bg-foreground/10 text-foreground/80',
  youtube: 'bg-red-500/15 text-red-400',
  twitter: 'bg-sky-500/15 text-sky-400',
  linkedin: 'bg-blue-500/15 text-blue-400',
  other: 'bg-muted text-muted-foreground',
}

const statusColors: Record<string, string> = {
  prospect: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/15 text-green-400',
  inactive: 'bg-muted text-muted-foreground/60',
}

const outreachColors: Record<string, string> = {
  responded: 'bg-green-500/15 text-green-400',
  reached_out: 'bg-sky-500/15 text-sky-400',
  declined: 'bg-red-500/15 text-red-400',
}

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tag?: string }>
}) {
  const { status, tag } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let influencers = await getInfluencers(user!.id)
  if (status) influencers = influencers.filter((i: any) => i.status === status)
  if (tag) influencers = influencers.filter((i: any) => Array.isArray(i.tags) && i.tags.includes(tag))

  // Collect all unique tags across all contacts
  const allInfluencers = await getInfluencers(user!.id)
  const allTags = Array.from(new Set(allInfluencers.flatMap((i: any) => i.tags ?? []))).sort() as string[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{influencers.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImport />
          <Link
            href="/influencers/new"
            className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
          >
            <Plus size={15} /> Add influencer
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(['', 'prospect', 'active', 'inactive'] as const).map((s) => (
          <Link
            key={s}
            href={s ? `/influencers?status=${s}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}` : `/influencers${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (status ?? '') === s
                ? 'bg-foreground/90 text-background'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Link
            href={status ? `/influencers?status=${status}` : '/influencers'}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!tag ? 'bg-brand/20 text-brand' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            All tags
          </Link>
          {allTags.map(t => (
            <Link
              key={t}
              href={`/influencers?${status ? `status=${status}&` : ''}tag=${encodeURIComponent(t)}`}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${tag === t ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {influencers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground/70 text-sm mb-4">No influencers yet</p>
            <Link href="/influencers/new" className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={15} /> Add your first influencer
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Name', 'Platform', 'Niche', 'Followers', 'Credibility', 'Segments', 'Contact', 'Outreach', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {influencers.map((inf: any) => {
                const cred = getCredibility(inf.followers, inf.engagement_rate)
                return (
                  <tr key={inf.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{inf.name}</p>
                      {inf.handle && <p className="text-xs text-muted-foreground/70">@{inf.handle}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {inf.platform ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${platformColors[inf.platform] ?? platformColors.other}`}>
                          {inf.platform}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inf.niche ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground/80">
                      {inf.followers ? formatNumber(inf.followers) : '—'}
                      {inf.engagement_rate && (
                        <span className="text-xs text-muted-foreground/60 ml-1">{inf.engagement_rate}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium flex items-center gap-1 ${cred.color}`} title={cred.level === 'unknown' ? 'Add followers and engagement rate to get a credibility score' : `Score based on engagement rate vs expected for ${(inf.followers ?? 0).toLocaleString()} followers`}>
                        {cred.level === 'credible' && <ShieldCheck size={12} />}
                        {cred.label}
                        {cred.score != null && <span className="text-muted-foreground/40 font-normal">{cred.score}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(inf.tags ?? []).length > 0
                          ? inf.tags.map((t: string) => (
                              <Link key={t} href={`/influencers?tag=${encodeURIComponent(t)}`} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors">{t}</Link>
                            ))
                          : <span className="text-muted-foreground/50 text-xs">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inf.contact_email ?? '—'}</td>
                    <td className="px-4 py-3">
                      {inf.outreach_status && inf.outreach_status !== 'not_contacted' ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${outreachColors[inf.outreach_status] ?? 'bg-muted text-muted-foreground'}`}>
                          {inf.outreach_status.replace(/_/g, ' ')}
                        </span>
                      ) : <span className="text-muted-foreground/50 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inf.status]}`}>
                        {inf.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/influencers/${inf.id}`} className="text-xs text-muted-foreground hover:text-foreground font-medium">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
