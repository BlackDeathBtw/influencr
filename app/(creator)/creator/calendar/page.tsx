import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Eye, Users } from 'lucide-react'

interface PipelineDeal {
  id: string
  brand_name: string
  amount_estimate: number | null
  notes: string | null
  stage: string
  due_date: string | null
  deliverable_type: string | null
  actual_views: number | null
  actual_reach: number | null
  collab_notes: string | null
  created_at: string
  updated_at: string
}

function fmtDollars(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtDueDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtNumber(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('en-US')
}

const STAGE_STYLES: Record<string, string> = {
  prospecting: 'bg-muted text-muted-foreground',
  pitched: 'bg-blue-500/15 text-blue-400',
  negotiating: 'bg-amber-500/15 text-amber-400',
  active: 'bg-brand/15 text-brand',
  completed: 'bg-green-500/15 text-green-400',
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_STYLES[stage] ?? 'bg-muted text-muted-foreground'}`}>
      {stage}
    </span>
  )
}

function DeliverableCard({ deal, today }: { deal: PipelineDeal; today: string }) {
  const isOverdue = deal.due_date! < today && deal.stage !== 'completed'
  return (
    <div className={`bg-card border rounded-xl p-4 ${isOverdue ? 'border-red-500/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{deal.brand_name}</p>
          <p className="text-xs text-muted-foreground">{deal.deliverable_type || 'Deliverable'}</p>
        </div>
        <StageBadge stage={deal.stage} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs font-medium flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
          <CalendarDays size={12} />
          {fmtDueDate(deal.due_date!)}
          {isOverdue && <span className="text-red-400 font-semibold">· Overdue</span>}
        </span>
        {deal.amount_estimate != null && (
          <span className="text-xs font-semibold text-foreground">{fmtDollars(deal.amount_estimate)}</span>
        )}
      </div>
    </div>
  )
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('creator_pipeline')
    .select('*')
    .eq('creator_id', user!.id)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })

  const { data: completedDeals } = await supabase
    .from('creator_pipeline')
    .select('*')
    .eq('creator_id', user!.id)
    .eq('stage', 'completed')
    .order('updated_at', { ascending: false })

  const allDeals = (deals ?? []) as PipelineDeal[]
  const completed = (completedDeals ?? []) as PipelineDeal[]

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const thisMonthKey = monthKey(today)
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthKey = monthKey(nextMonthDate.toISOString())

  const upcoming = allDeals.filter(d => d.due_date! >= today || (d.due_date! < today && d.stage !== 'completed'))
  const overdue = allDeals.filter(d => d.due_date! < today && d.stage !== 'completed')

  const thisMonthDeals = allDeals.filter(d => monthKey(d.due_date!) === thisMonthKey)
  const nextMonthDeals = allDeals.filter(d => monthKey(d.due_date!) === nextMonthKey)

  // Other future months beyond next month
  const otherMonths = new Map<string, PipelineDeal[]>()
  for (const deal of allDeals) {
    const mk = monthKey(deal.due_date!)
    if (mk !== thisMonthKey && mk !== nextMonthKey && mk > nextMonthKey) {
      if (!otherMonths.has(mk)) otherMonths.set(mk, [])
      otherMonths.get(mk)!.push(deal)
    }
  }
  const sortedOtherKeys = [...otherMonths.keys()].sort()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Content Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Upcoming deliverables from your pipeline</p>
      </div>

      {allDeals.length === 0 && overdue.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <CalendarDays size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No deliverable dates set</p>
          <p className="text-sm text-muted-foreground">Add due dates to your pipeline deals to see them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-red-400">Overdue</h2>
                <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">{overdue.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {overdue.map(deal => (
                  <DeliverableCard key={deal.id} deal={deal} today={today} />
                ))}
              </div>
            </section>
          )}

          {thisMonthDeals.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-3">{monthLabel(thisMonthKey)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {thisMonthDeals.map(deal => (
                  <DeliverableCard key={deal.id} deal={deal} today={today} />
                ))}
              </div>
            </section>
          )}

          {nextMonthDeals.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-3">{monthLabel(nextMonthKey)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nextMonthDeals.map(deal => (
                  <DeliverableCard key={deal.id} deal={deal} today={today} />
                ))}
              </div>
            </section>
          )}

          {sortedOtherKeys.map(mk => (
            <section key={mk}>
              <h2 className="font-semibold text-foreground mb-3">{monthLabel(mk)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherMonths.get(mk)!.map(deal => (
                  <DeliverableCard key={deal.id} deal={deal} today={today} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Post-collab results */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Post-collab results</h2>
        <p className="text-sm text-muted-foreground mb-5">Performance data from completed deals</p>

        {completed.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No completed deals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map(deal => {
              const hasResults = deal.actual_views != null || deal.actual_reach != null || deal.collab_notes
              return (
                <div key={deal.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{deal.brand_name}</p>
                      <p className="text-xs text-muted-foreground">{deal.deliverable_type || 'Deliverable'}</p>
                    </div>
                    <StageBadge stage={deal.stage} />
                  </div>

                  {hasResults ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5">
                          <Eye size={13} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Views</span>
                          <span className="text-xs font-semibold text-foreground ml-1">{fmtNumber(deal.actual_views)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Reach</span>
                          <span className="text-xs font-semibold text-foreground ml-1">{fmtNumber(deal.actual_reach)}</span>
                        </div>
                        {deal.amount_estimate != null && (
                          <div>
                            <span className="text-xs text-muted-foreground">Deal value</span>
                            <span className="text-xs font-semibold text-foreground ml-1">{fmtDollars(deal.amount_estimate)}</span>
                          </div>
                        )}
                      </div>
                      {deal.collab_notes && (
                        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-2">{deal.collab_notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No results recorded yet</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
