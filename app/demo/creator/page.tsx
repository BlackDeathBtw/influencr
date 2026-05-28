'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Store, PenLine, Settings,
  ArrowRight, Plus, Check, Clock, ExternalLink,
  LinkIcon, Download, DollarSign, Percent, Users,
  Star, MapPin, Receipt, BarChart3, User,
} from 'lucide-react'

/* ─── data ─────────────────────────────────────────────────────────────────── */

const CREATOR = {
  name: 'Alex Rivera',
  username: 'alexrivera',
  email: 'alex@alexrivera.com',
  bio: 'Lifestyle and travel creator based in New York. 5 years creating content, 30+ brand collaborations. I believe in authentic storytelling — every post reflects something I actually use and love.',
  niches: ['Lifestyle', 'Travel', 'Fitness', 'Food & Drink'],
  rate: '$800 – $2,500',
  location: 'New York, NY',
  platforms: [
    { name: 'Instagram', handle: '@alexrivera', followers: '84.2K', engagement: '4.8%' },
    { name: 'TikTok', handle: '@alexrivera', followers: '210K', engagement: '6.2%' },
    { name: 'YouTube', handle: 'Alex Rivera', followers: '12.4K', engagement: '3.1%' },
  ],
  brands: ['Airbnb', 'Nike Running', 'HelloFresh', 'Ritual Vitamins', 'Headspace', 'Away Luggage'],
}

const STATS = [
  { label: 'Total earned', value: '$7,450', sub: 'all time', icon: DollarSign },
  { label: 'Pending payout', value: '$3,250', sub: '3 invoices', icon: Clock },
  { label: 'Active contracts', value: 2, sub: 'in progress', icon: PenLine },
  { label: 'Open opportunities', value: 12, sub: 'new this week', icon: Store },
]

type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid'

const INVOICES: { brand: string; description: string; amount: number; status: InvoiceStatus; date: string }[] = [
  { brand: 'Nike Running',    description: 'Summer Collection — 2 Posts + Story Set', amount: 2500, status: 'sent',   date: 'Jun 14' },
  { brand: 'Headspace',       description: 'Wellness Series — 3 TikToks',             amount: 950,  status: 'viewed', date: 'Jun 10' },
  { brand: 'HelloFresh',      description: 'Spring Campaign — 1 Reel + Story Set',    amount: 1200, status: 'paid',   date: 'Jun 5' },
  { brand: 'Away Luggage',    description: 'Travel Campaign — 1 YouTube Video',       amount: 1800, status: 'paid',   date: 'May 20' },
  { brand: 'Ritual Vitamins', description: 'Health Campaign — TikTok Series',         amount: 800,  status: 'draft',  date: '—' },
  { brand: 'Airbnb',          description: 'Summer Travel — Instagram Carousel',      amount: 1500, status: 'sent',   date: 'Jun 16' },
]

const CONTRACTS: { brand: string; campaign: string; status: 'signed' | 'sent' | 'draft'; date: string }[] = [
  { brand: 'Nike Running',    campaign: 'Summer Collection', status: 'signed', date: 'Jun 8' },
  { brand: 'HelloFresh',      campaign: 'Spring Campaign',   status: 'signed', date: 'May 28' },
  { brand: 'Headspace',       campaign: 'Wellness Series',   status: 'sent',   date: 'Jun 12' },
  { brand: 'Ritual Vitamins', campaign: 'Health Campaign',   status: 'draft',  date: '—' },
]

/* ─── style maps ─────────────────────────────────────────────────────────────── */

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; color: string }> = {
  draft:  { label: 'Draft',   color: 'bg-muted text-muted-foreground' },
  sent:   { label: 'Sent',    color: 'bg-sky-500/15 text-sky-400' },
  viewed: { label: 'Viewed',  color: 'bg-amber-500/15 text-amber-400' },
  paid:   { label: 'Paid',    color: 'bg-green-500/15 text-green-400' },
}

const CONTRACT_STATUS: Record<string, string> = {
  signed: 'bg-green-500/15 text-green-400',
  sent:   'bg-sky-500/15 text-sky-400',
  draft:  'bg-muted text-muted-foreground',
}

const LISTING_TYPE_COLORS: Record<string, string> = {
  brand_deal: 'bg-blue-100 text-blue-700',
  affiliate:  'bg-green-100 text-green-700',
  collab:     'bg-purple-100 text-purple-700',
}
const LISTING_TYPE_LABELS: Record<string, string> = {
  brand_deal: 'Brand Deal',
  affiliate:  'Affiliate',
  collab:     'Collab',
}

/* ─── views ──────────────────────────────────────────────────────────────────── */

function DashboardView() {
  const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = INVOICES.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + i.amount, 0)
  const recent = INVOICES.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your creator overview</p>
      </div>
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
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent invoices</h2>
            <span className="text-xs text-muted-foreground">{INVOICES.length} total</span>
          </div>
          <div className="divide-y divide-border">
            {recent.map((inv, i) => {
              const meta = INVOICE_STATUS[inv.status]
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center shrink-0 text-sm font-bold text-brand">{inv.brand[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.brand}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.description}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                  <div className="shrink-0 text-sm font-semibold text-foreground">${inv.amount.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center"><Check size={14} className="text-green-400" /></div>
              <p className="text-sm text-muted-foreground">Total earned</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock size={14} className="text-amber-400" /></div>
              <p className="text-sm text-muted-foreground">Awaiting payment</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1">Your media kit link</p>
            <p className="text-xs text-muted-foreground mb-3">Share this with brands</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <span className="text-xs text-muted-foreground font-mono flex-1 truncate">influencr.app/c/alexrivera</span>
              <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-default"><LinkIcon size={12} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoicesView() {
  const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = INVOICES.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Send invoices to brands and track payments</p>
        </div>
        <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New invoice</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center"><Check size={14} className="text-green-400" /></div><p className="text-sm text-muted-foreground">Total earned</p></div>
          <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock size={14} className="text-amber-400" /></div><p className="text-sm text-muted-foreground">Awaiting payment</p></div>
          <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>{['Brand', 'Description', 'Amount', 'Status', 'Date', ''].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {INVOICES.map((inv, i) => {
              const meta = INVOICE_STATUS[inv.status]
              return (
                <tr key={i} className="hover:bg-muted/30 cursor-default">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{inv.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{inv.description}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><ExternalLink size={13} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MediaKitView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Kit</h1>
          <p className="text-sm text-muted-foreground mt-1">Your public profile brands will see</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono">
            influencr.app/c/alexrivera
            <button className="text-muted-foreground hover:text-foreground transition-colors cursor-default"><LinkIcon size={11} /></button>
          </div>
          <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default">Edit profile</button>
        </div>
      </div>

      {/* Profile preview card */}
      <div className="bg-card border border-border rounded-xl p-8 mb-5">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-brand/20 flex items-center justify-center shrink-0 text-2xl font-bold text-brand">
            {CREATOR.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-foreground">{CREATOR.name}</h2>
              <span className="text-muted-foreground font-mono text-sm">/{CREATOR.username}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3"><MapPin size={13} />{CREATOR.location}</div>
            <div className="flex flex-wrap gap-2">
              {CREATOR.niches.map((n) => (
                <span key={n} className="text-xs font-medium bg-muted text-foreground/70 px-3 py-1 rounded-full border border-border">{n}</span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground mb-1">Starting rate</p>
            <p className="text-xl font-bold text-foreground">{CREATOR.rate}</p>
            <p className="text-xs text-muted-foreground">per post</p>
          </div>
        </div>

        <p className="text-foreground/70 leading-relaxed text-sm mb-8 max-w-2xl">{CREATOR.bio}</p>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">Platforms</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {CREATOR.platforms.map((p) => (
              <div key={p.name} className="bg-muted/50 border border-border rounded-xl p-4">
                <p className="text-sm font-semibold text-foreground mb-0.5">{p.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{p.handle}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-lg font-bold text-foreground">{p.followers}</p><p className="text-xs text-muted-foreground">followers</p></div>
                  <div><p className="text-lg font-bold text-brand">{p.engagement}</p><p className="text-xs text-muted-foreground">engagement</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Past collaborations</h3>
          <div className="flex flex-wrap gap-3">
            {CREATOR.brands.map((b) => (
              <div key={b} className="bg-muted border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground/70">{b}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type LiveDeal = {
  id: string
  brand_name: string
  title: string
  type: string
  commission_rate: number | null
  budget_min: number | null
  budget_max: number | null
  min_followers: number | null
  niches: string[]
  apply_url: string
  is_featured: boolean
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  if (min != null) return `From $${min.toLocaleString()}`
  return `Up to $${max!.toLocaleString()}`
}

function OpportunitiesView() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deals, setDeals] = useState<LiveDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brand-deals?limit=30')
      .then(r => r.json())
      .then(j => setDeals(j.deals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const TYPE_TABS = [
    { id: 'all', label: 'All' },
    { id: 'brand_deal', label: 'Brand Deals' },
    { id: 'affiliate', label: 'Affiliate' },
    { id: 'collab', label: 'Collabs' },
  ]
  const filtered = typeFilter === 'all' ? deals : deals.filter(l => l.type === typeFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">Real brand deals, affiliate programs, and collabs to apply for</p>
        </div>
      </div>
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-5">
        {TYPE_TABS.map(t => (
          <button key={t.id} onClick={() => setTypeFilter(t.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
        ))}
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm">No opportunities match this filter</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const budget = formatBudget(l.budget_min, l.budget_max)
            return (
              <div key={l.id} className={`bg-card border rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow ${l.is_featured ? 'border-brand/40' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LISTING_TYPE_COLORS[l.type] ?? 'bg-muted text-muted-foreground'}`}>{LISTING_TYPE_LABELS[l.type] ?? l.type}</span>
                    {l.is_featured && <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Star size={9} />Featured</span>}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{l.brand_name}</p>
                </div>
                <p className="font-semibold text-foreground text-sm leading-snug">{l.title}</p>
                <div className="flex flex-wrap gap-3">
                  {budget && <span className="flex items-center gap-1 text-xs text-muted-foreground"><DollarSign size={11} />{budget}</span>}
                  {l.commission_rate != null && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Percent size={11} />{l.commission_rate}% commission</span>}
                  {l.min_followers != null && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users size={11} />{l.min_followers >= 1000 ? `${(l.min_followers / 1000).toFixed(0)}K` : l.min_followers}+ followers</span>}
                </div>
                {l.niches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {l.niches.map(n => <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{n}</span>)}
                  </div>
                )}
                <div className="pt-1 border-t border-border">
                  <a href={l.apply_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-brand transition-colors py-1">
                    Apply →
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ContractsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">{CONTRACTS.length} contracts</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>{['Brand', 'Campaign', 'Status', 'Date', ''].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CONTRACTS.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30 cursor-default">
                <td className="px-4 py-3 font-medium text-foreground">{c.brand}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.campaign}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${CONTRACT_STATUS[c.status]}`}>{c.status}</span>
                    {c.status === 'signed' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PenLine size={10} />Signed by you
                      </span>
                    )}
                    {c.status === 'sent' && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <PenLine size={10} />Awaiting your signature
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {c.status === 'sent' && (
                      <button title="Sign contract" className="flex items-center gap-1 bg-brand/15 text-brand hover:bg-brand/25 px-2 py-1 rounded text-xs font-medium transition-colors cursor-default"><PenLine size={11} /> Sign</button>
                    )}
                    <button title="Download PDF" className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Download size={13} /></button>
                    <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><ExternalLink size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-foreground">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p></div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            {[{ label: 'Display name', value: 'Alex Rivera' }, { label: 'Email', value: 'alex@alexrivera.com' }, { label: 'Username', value: 'alexrivera' }].map(({ label, value }) => (
              <div key={label}>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                <input readOnly value={value} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground cursor-default" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Creator plan</p>
              <p className="text-sm text-muted-foreground">Free forever · media kit, invoices, and contracts</p>
            </div>
            <span className="text-xs bg-brand/15 text-brand font-semibold px-3 py-1 rounded-full">Free</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Public profile</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Profile visible to brands</p>
              <p className="text-xs text-muted-foreground mt-0.5">influencr.app/c/alexrivera</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-muted-foreground">Public</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── tab config ─────────────────────────────────────────────────────────────── */

type Tab = 'dashboard' | 'invoices' | 'media-kit' | 'opportunities' | 'contracts' | 'settings'

const MAIN_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'invoices',      label: 'Invoices',      icon: Receipt },
  { id: 'media-kit',     label: 'Media Kit',     icon: User },
  { id: 'contracts',     label: 'Contracts',     icon: PenLine },
]

const GROWTH_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'opportunities', label: 'Opportunities', icon: Store },
]

/* ─── shell ──────────────────────────────────────────────────────────────────── */

export default function CreatorDemo() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col h-full">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-foreground">influencr</span>
          <span className="text-xs bg-brand/15 text-brand font-semibold px-2 py-0.5 rounded-full">Creator</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {MAIN_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === id ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Discover</p>
          </div>
          {GROWTH_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === id ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-border pt-4">
          <button
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
              tab === 'settings' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Settings size={15} />Settings
          </button>
          <p className="px-3 pt-2 text-xs text-muted-foreground/50 truncate">{CREATOR.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6 bg-brand/10 border border-brand/20 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">Creator demo</span> — click any sidebar item to explore. All data is fake.
            </p>
            <Link href="/signup?type=creator" className="shrink-0 flex items-center gap-1.5 bg-brand text-brand-foreground px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
              Get started free <ArrowRight size={13} />
            </Link>
          </div>

          {tab === 'dashboard'     && <DashboardView />}
          {tab === 'invoices'      && <InvoicesView />}
          {tab === 'media-kit'     && <MediaKitView />}
          {tab === 'opportunities' && <OpportunitiesView />}
          {tab === 'contracts'     && <ContractsView />}
          {tab === 'settings'      && <SettingsView />}
        </div>
      </main>
    </div>
  )
}
