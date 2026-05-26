import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Users, BarChart3, CreditCard, LayoutDashboard,
  Settings, Search, Mail, FileText, ArrowRight,
  Calendar, Check, Clock, AlertCircle, XCircle,
} from 'lucide-react'

const STATS = [
  { label: 'Influencers', value: 24, sub: '18 active', icon: Users, href: '#' },
  { label: 'Campaigns', value: 3, sub: '2 active', icon: BarChart3, href: '#' },
  { label: 'Upcoming content', value: 7, sub: 'to be posted', icon: Calendar, href: '#' },
  { label: 'Pending payments', value: '$6,800', sub: '5 invoices', icon: CreditCard, href: '#' },
]

type Status = 'negotiating' | 'confirmed' | 'content_due' | 'posted' | 'paid'

const DEALS: { name: string; handle: string; niche: string; followers: string; campaign: string; fee: number; status: Status }[] = [
  { name: 'Emma Chen', handle: '@emmachen', niche: 'Beauty', followers: '84K', campaign: 'Summer Glow', fee: 1200, status: 'posted' },
  { name: 'Jake Torres', handle: '@jakefit', niche: 'Fitness', followers: '210K', campaign: 'Summer Glow', fee: 2500, status: 'content_due' },
  { name: 'Sofia Kim', handle: '@sofiakim', niche: 'Lifestyle', followers: '56K', campaign: 'Back to School', fee: 900, status: 'confirmed' },
  { name: 'Marcus Hill', handle: '@marcushill', niche: 'Tech', followers: '125K', campaign: 'Back to School', fee: 1800, status: 'negotiating' },
  { name: 'Lily Park', handle: '@lilypark', niche: 'Food', followers: '34K', campaign: 'Holiday Launch', fee: 600, status: 'paid' },
  { name: 'Ryan Cole', handle: '@ryancole', niche: 'Travel', followers: '91K', campaign: 'Holiday Launch', fee: 1500, status: 'confirmed' },
]

const CONTENT = [
  { creator: 'Jake Torres', type: 'Reel', due: 'Tomorrow', campaign: 'Summer Glow' },
  { creator: 'Sofia Kim', type: 'Story', due: 'In 2 days', campaign: 'Back to School' },
  { creator: 'Ryan Cole', type: 'Post', due: 'In 4 days', campaign: 'Holiday Launch' },
  { creator: 'Emma Chen', type: 'Video', due: 'In 5 days', campaign: 'Summer Glow' },
]

const STATUS_META: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  negotiating: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-100 text-blue-800',   icon: Check },
  content_due: { label: 'Content due', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  posted:      { label: 'Posted',      color: 'bg-green-100 text-green-800',  icon: Check },
  paid:        { label: 'Paid',        color: 'bg-gray-100 text-gray-600',    icon: Check },
}

const NAV = [
  { href: '#', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '#', label: 'Influencers', icon: Users, active: false },
  { href: '#', label: 'Campaigns', icon: BarChart3, active: false },
  { href: '#', label: 'Payments', icon: CreditCard, active: false },
]

const GROWTH_NAV = [
  { href: '#', label: 'Discover', icon: Search },
  { href: '#', label: 'Outreach', icon: Mail },
  { href: '#', label: 'Contracts', icon: FileText },
]

export const metadata: Metadata = {
  title: 'Brand Dashboard Demo — See influencr in Action',
  description:
    'Explore a live demo of the influencr brand dashboard. See how to manage influencer campaigns, track deals, monitor content deadlines, and log payments — all in one place.',
  openGraph: {
    title: 'Brand Dashboard Demo — influencr',
    description:
      'See the influencr brand dashboard with real campaign data, deal pipeline, and content deadline tracking. Start a free 14-day trial.',
  },
}

export default function BrandDemo() {
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col h-full">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-tight text-foreground">influencr</span>
          <span className="text-xs bg-brand/15 text-brand font-semibold px-2 py-0.5 rounded-full">Demo</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, active }) => (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon size={15} />
              {label}
            </a>
          ))}
          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Growth</p>
          </div>
          {GROWTH_NAV.map(({ href, label, icon: Icon }) => (
            <a key={label} href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              <Icon size={15} />
              {label}
            </a>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-border pt-4 space-y-0.5">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Settings size={15} />
            Settings
          </a>
          <p className="px-3 pt-2 text-xs text-muted-foreground/50 truncate">brand@demo.com</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Demo banner */}
          <div className="mb-6 bg-brand/10 border border-brand/20 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">Brand demo</span> — this is what your dashboard looks like. All data is fake.
            </p>
            <Link
              href="/signup?type=brand"
              className="shrink-0 flex items-center gap-1.5 bg-brand text-brand-foreground px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
            >
              Start free trial <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of your influencer relationships</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 hover:border-brand/40 transition-colors group cursor-default">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                    <Icon size={15} className="text-muted-foreground group-hover:text-brand transition-colors" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Deals table */}
            <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Active deals</h2>
                <span className="text-xs text-muted-foreground">3 campaigns</span>
              </div>
              <div className="divide-y divide-border">
                {DEALS.map((deal) => {
                  const meta = STATUS_META[deal.status]
                  return (
                    <div key={deal.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center shrink-0 text-sm font-bold text-brand">
                        {deal.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">{deal.handle} · {deal.followers} · {deal.niche}</p>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground hidden sm:block">{deal.campaign}</div>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <div className="shrink-0 text-sm font-semibold text-foreground">${deal.fee.toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Content deadlines */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Content due soon</h2>
                <Calendar size={15} className="text-muted-foreground" />
              </div>
              <div className="divide-y divide-border">
                {CONTENT.map((c) => (
                  <div key={c.creator + c.type} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.creator}</p>
                        <p className="text-xs text-muted-foreground">{c.type} · {c.campaign}</p>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${c.due === 'Tomorrow' ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        {c.due}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
