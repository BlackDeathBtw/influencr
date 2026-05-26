import { createClient } from '@/lib/supabase/server'
import { getInfluencers } from '@/lib/data'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { Influencer } from '@/types'
import CsvImport from '@/components/csv-import'

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  tiktok: 'bg-zinc-900 text-white',
  youtube: 'bg-red-100 text-red-700',
  twitter: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-blue-100 text-blue-800',
  other: 'bg-zinc-100 text-zinc-600',
}

const statusColors: Record<string, string> = {
  prospect: 'bg-zinc-100 text-zinc-600',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-zinc-100 text-zinc-400',
}

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let influencers = await getInfluencers(user!.id)
  if (status) influencers = influencers.filter((i: any) => i.status === status)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Influencers</h1>
          <p className="text-sm text-zinc-500 mt-1">{influencers.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImport />
          <Link
            href="/influencers/new"
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            <Plus size={15} /> Add influencer
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {(['', 'prospect', 'active', 'inactive'] as const).map((s) => (
          <Link
            key={s}
            href={s ? `/influencers?status=${s}` : '/influencers'}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              (status ?? '') === s
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {influencers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-400 text-sm mb-4">No influencers yet</p>
            <Link
              href="/influencers/new"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={15} /> Add your first influencer
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['Name', 'Platform', 'Niche', 'Followers', 'Contact', 'Outreach', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {influencers.map((inf: any) => (
                <tr key={inf.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-900">{inf.name}</p>
                      {inf.handle && <p className="text-xs text-zinc-400">@{inf.handle}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {inf.platform ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${platformColors[inf.platform] ?? platformColors.other}`}>
                        {inf.platform}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{inf.niche ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {inf.followers ? formatNumber(inf.followers) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{inf.contact_email ?? '—'}</td>
                  <td className="px-4 py-3">
                    {inf.outreach_status && inf.outreach_status !== 'not_contacted' ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inf.outreach_status === 'responded' ? 'bg-green-100 text-green-700' :
                        inf.outreach_status === 'reached_out' ? 'bg-blue-100 text-blue-700' :
                        inf.outreach_status === 'declined' ? 'bg-red-100 text-red-600' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>{inf.outreach_status.replace(/_/g, ' ')}</span>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inf.status]}`}>
                      {inf.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/influencers/${inf.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
