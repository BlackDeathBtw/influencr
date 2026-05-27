import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Campaign } from '@/types'

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">{campaigns?.length ?? 0} campaigns</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} /> New campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm mb-4">No campaigns yet</p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={15} /> Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c: Campaign) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                <span>
                  {c.start_date ? new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  {' → '}
                  {c.end_date ? new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'ongoing'}
                </span>
                {c.budget && (
                  <span className="font-medium text-foreground/80">
                    {formatCurrency(c.budget, c.currency)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
