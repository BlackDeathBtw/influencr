import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getContractsWithMilestones } from '@/lib/contracts-data'
import { Plus, Pencil, Send, CheckCircle2, Download, Link as LinkIcon } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-amber-500/15 text-amber-400',
  signed: 'bg-green-500/15 text-green-400',
  declined: 'bg-red-500/15 text-red-400',
}

const PAYMENT_MODEL_STYLES: Record<string, string> = {
  flat: 'bg-muted text-muted-foreground',
  milestone: 'bg-brand/15 text-brand',
  hybrid: 'bg-blue-500/15 text-blue-400',
}

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const contracts = await getContractsWithMilestones(user!.id)

  const totalBase = contracts.reduce((s, c) => s + (c.base_fee ?? 0), 0)
  const totalBonusEarnable = contracts.reduce(
    (s, c) => s + c.milestones.reduce((ms, m) => ms + m.bonus_amount, 0),
    0
  )
  const totalBonusAchieved = contracts.reduce(
    (s, c) =>
      s + c.milestones.filter(m => m.status === 'achieved').reduce((ms, m) => ms + m.bonus_amount, 0),
    0
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} /> New contract
        </Link>
      </div>

      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Base Value</p>
            <p className="text-xl font-bold text-foreground">{fmt(totalBase)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Milestone Bonuses Earnable</p>
            <p className="text-xl font-bold text-foreground">{fmt(totalBonusEarnable)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Bonuses Achieved</p>
            <p className="text-xl font-bold text-green-400">{fmt(totalBonusAchieved)}</p>
          </div>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm mb-4">No contracts yet</p>
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={15} /> Create first contract
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => {
            const milestoneBonuses = c.milestones.reduce((s, m) => s + m.bonus_amount, 0)
            const achievedBonuses = c.milestones
              .filter(m => m.status === 'achieved')
              .reduce((s, m) => s + m.bonus_amount, 0)

            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{c.title}</span>
                      {c.influencer && (
                        <span className="text-xs text-muted-foreground/70">{c.influencer.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_MODEL_STYLES[c.payment_model]}`}>
                        {c.payment_model === 'flat' ? 'Flat fee' : c.payment_model === 'milestone' ? 'Milestone' : 'Hybrid'}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/contracts/${c.id}`}
                      className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70 flex-wrap">
                  {c.base_fee > 0 && (
                    <span>Base: <span className="text-foreground font-medium">{fmt(c.base_fee, c.currency)}</span></span>
                  )}
                  {milestoneBonuses > 0 && (
                    <span>
                      Milestones: <span className="text-foreground font-medium">{fmt(achievedBonuses, c.currency)}</span>
                      <span className="text-muted-foreground/50"> / {fmt(milestoneBonuses, c.currency)}</span>
                    </span>
                  )}
                </div>

                {c.milestones.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {c.milestones.map(m => {
                      const pct = Math.min(100, Math.round(((m.achieved_value ?? 0) / m.target_value) * 100))
                      return (
                        <div key={m.id}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-muted-foreground/70">{m.title}</span>
                            <span className="text-xs text-muted-foreground/60">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${m.status === 'achieved' ? 'bg-green-500' : m.status === 'failed' ? 'bg-red-500' : 'bg-foreground/40'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
