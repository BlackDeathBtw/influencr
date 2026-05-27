'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, BarChart3, CreditCard, LayoutDashboard,
  Settings, Search, Mail, FileText, ArrowRight,
  Calendar, Check, Clock, Plus,
  Send, Copy, Pencil, Trash2, ExternalLink,
  ShieldCheck, MapPin, Kanban, PenLine, Link as LinkIcon, Download,
  Store, DollarSign, Percent, Star,
} from 'lucide-react'

/* ─── data ─────────────────────────────────────────────────────────────────── */

const STATS = [
  { label: 'Influencers', value: 24, sub: '18 active', icon: Users },
  { label: 'Campaigns', value: 3, sub: '2 active', icon: BarChart3 },
  { label: 'Upcoming content', value: 7, sub: 'to be posted', icon: Calendar },
  { label: 'Pending payments', value: '$6,800', sub: '5 invoices', icon: CreditCard },
]

type DealStatus = 'negotiating' | 'confirmed' | 'content_due' | 'posted' | 'paid'

const DEALS: { name: string; handle: string; niche: string; followers: string; campaign: string; fee: number; status: DealStatus }[] = [
  { name: 'Emma Chen',  handle: '@emmachen',  niche: 'Beauty',    followers: '84K',  campaign: 'Summer Glow',   fee: 1200, status: 'posted' },
  { name: 'Jake Torres', handle: '@jakefit',  niche: 'Fitness',   followers: '210K', campaign: 'Summer Glow',   fee: 2500, status: 'content_due' },
  { name: 'Sofia Kim',  handle: '@sofiakim',  niche: 'Lifestyle', followers: '56K',  campaign: 'Back to School', fee: 900, status: 'confirmed' },
  { name: 'Marcus Hill', handle: '@marcushill', niche: 'Tech',    followers: '125K', campaign: 'Back to School', fee: 1800, status: 'negotiating' },
  { name: 'Lily Park',  handle: '@lilypark',  niche: 'Food',      followers: '34K',  campaign: 'Holiday Launch', fee: 600, status: 'paid' },
  { name: 'Ryan Cole',  handle: '@ryancole',  niche: 'Travel',    followers: '91K',  campaign: 'Holiday Launch', fee: 1500, status: 'confirmed' },
]

const CONTENT = [
  { creator: 'Jake Torres', type: 'Reel',  due: 'Tomorrow',  campaign: 'Summer Glow',    status: 'pending' },
  { creator: 'Sofia Kim',   type: 'Story', due: 'In 2 days', campaign: 'Back to School', status: 'in_review' },
  { creator: 'Ryan Cole',   type: 'Post',  due: 'In 4 days', campaign: 'Holiday Launch', status: 'pending' },
  { creator: 'Emma Chen',   type: 'Video', due: 'In 5 days', campaign: 'Summer Glow',    status: 'approved' },
]

const INFLUENCERS = [
  { name: 'Emma Chen',   handle: '@emmachen',   platform: 'Instagram', niche: 'Beauty',    followers: '84K',  eng: '4.8%', status: 'active',   cred: 'credible' },
  { name: 'Jake Torres', handle: '@jakefit',    platform: 'TikTok',    niche: 'Fitness',   followers: '210K', eng: '6.2%', status: 'active',   cred: 'credible' },
  { name: 'Sofia Kim',   handle: '@sofiakim',   platform: 'Instagram', niche: 'Lifestyle', followers: '56K',  eng: '3.9%', status: 'active',   cred: 'check' },
  { name: 'Marcus Hill', handle: '@marcushill', platform: 'YouTube',   niche: 'Tech',      followers: '125K', eng: '3.1%', status: 'prospect', cred: 'credible' },
  { name: 'Lily Park',   handle: '@lilypark',   platform: 'TikTok',    niche: 'Food',      followers: '34K',  eng: '7.2%', status: 'active',   cred: 'credible' },
  { name: 'Ryan Cole',   handle: '@ryancole',   platform: 'Instagram', niche: 'Travel',    followers: '91K',  eng: '2.1%', status: 'active',   cred: 'low' },
  { name: 'Aria Nguyen', handle: '@ariangy',    platform: 'TikTok',    niche: 'Fashion',   followers: '178K', eng: '5.5%', status: 'prospect', cred: 'credible' },
]

const CAMPAIGNS = [
  { name: 'Summer Glow',   status: 'active', budget: 8000,  spend: 5200, influencers: 3, endDate: 'Jul 31' },
  { name: 'Back to School', status: 'active', budget: 5000, spend: 2700, influencers: 2, endDate: 'Aug 20' },
  { name: 'Holiday Launch', status: 'draft',  budget: 12000, spend: 0,   influencers: 4, endDate: 'Dec 1' },
]

const PAYMENTS = [
  { name: 'Emma Chen',   campaign: 'Summer Glow',    amount: 1200, status: 'paid',    date: 'Jun 12' },
  { name: 'Jake Torres', campaign: 'Summer Glow',    amount: 2500, status: 'pending', date: '—' },
  { name: 'Sofia Kim',   campaign: 'Back to School', amount: 900,  status: 'pending', date: '—' },
  { name: 'Lily Park',   campaign: 'Holiday Launch', amount: 600,  status: 'paid',    date: 'Jun 5' },
  { name: 'Ryan Cole',   campaign: 'Holiday Launch', amount: 1500, status: 'pending', date: '—' },
  { name: 'Marcus Hill', campaign: 'Back to School', amount: 1800, status: 'pending', date: '—' },
]

const DISCOVER_CREATORS = [
  { name: 'Alex Rivera',  handle: '@alexrivera',  platform: 'TikTok',    niche: 'Lifestyle', followers: '210K', eng: '6.2%', location: 'New York',      rate: '$800–2,500' },
  { name: 'Emma Chen',    handle: '@emmachen',    platform: 'Instagram', niche: 'Beauty',    followers: '84K',  eng: '4.8%', location: 'Los Angeles',   rate: '$400–1,200' },
  { name: 'Marcus Hill',  handle: '@marcushill',  platform: 'YouTube',   niche: 'Tech',      followers: '125K', eng: '3.9%', location: 'San Francisco', rate: '$600–2,000' },
  { name: 'Zoe Williams', handle: '@zoewills',    platform: 'Instagram', niche: 'Wellness',  followers: '67K',  eng: '5.1%', location: 'Austin',        rate: '$300–900' },
  { name: 'Kai Nakamura', handle: '@kainakamura', platform: 'TikTok',    niche: 'Gaming',    followers: '340K', eng: '4.3%', location: 'Seattle',       rate: '$1,000–3,500' },
  { name: 'Priya Sharma', handle: '@priyasharma', platform: 'Instagram', niche: 'Food',      followers: '48K',  eng: '6.8%', location: 'Chicago',       rate: '$200–700' },
]

const OUTREACH_TEMPLATES = [
  {
    name: 'Cold DM — lifestyle brands',
    platform: 'instagram',
    subject: 'Collab opportunity with [Brand]',
    body: 'Hi {{name}},\n\nI came across your content and think you\'d be a great fit for our upcoming campaign.\n\nWe\'re looking for creators in the {{niche}} space who can authentically showcase our product...\n\nBest,\nThe Team',
  },
  {
    name: 'YouTube partnership outreach',
    platform: 'youtube',
    subject: 'Sponsorship opportunity — {{name}}',
    body: 'Hi {{name}},\n\nLove your channel. We\'d love to discuss a sponsored integration for your next video...',
  },
  {
    name: 'Follow-up after no reply',
    platform: 'any',
    subject: 'Following up: collab with [Brand]',
    body: 'Hi {{name}},\n\nJust wanted to follow up on my previous message about a potential collab...',
  },
]

const CONTRACTS = [
  { influencer: 'Emma Chen',   campaign: 'Summer Glow',    status: 'signed',  date: 'Jun 1' },
  { influencer: 'Jake Torres', campaign: 'Summer Glow',    status: 'sent',    date: 'Jun 10' },
  { influencer: 'Sofia Kim',   campaign: 'Back to School', status: 'draft',   date: '—' },
  { influencer: 'Ryan Cole',   campaign: 'Holiday Launch', status: 'signed',  date: 'Jun 3' },
]

type CrmStage = 'prospect' | 'outreach' | 'negotiating' | 'contracted' | 'delivered' | 'paid'

const PIPELINE_STAGES: { id: CrmStage; label: string; color: string }[] = [
  { id: 'prospect',    label: 'Prospect',    color: 'bg-muted text-muted-foreground' },
  { id: 'outreach',    label: 'Outreach',    color: 'bg-sky-500/15 text-sky-600' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-amber-500/15 text-amber-600' },
  { id: 'contracted',  label: 'Contracted',  color: 'bg-violet-500/15 text-violet-600' },
  { id: 'delivered',   label: 'Delivered',   color: 'bg-blue-500/15 text-blue-600' },
  { id: 'paid',        label: 'Paid',        color: 'bg-green-500/15 text-green-600' },
]

const PIPELINE_CREATORS: { name: string; handle: string; platform: string; followers: string; eng: string; stage: CrmStage }[] = [
  { name: 'Emma Chen',    handle: '@emmachen',    platform: 'Instagram', followers: '84K',  eng: '4.8%', stage: 'contracted' },
  { name: 'Jake Torres',  handle: '@jakefit',     platform: 'TikTok',    followers: '210K', eng: '6.2%', stage: 'delivered' },
  { name: 'Sofia Kim',    handle: '@sofiakim',    platform: 'Instagram', followers: '56K',  eng: '3.9%', stage: 'negotiating' },
  { name: 'Marcus Hill',  handle: '@marcushill',  platform: 'YouTube',   followers: '125K', eng: '3.1%', stage: 'outreach' },
  { name: 'Lily Park',    handle: '@lilypark',    platform: 'TikTok',    followers: '34K',  eng: '7.2%', stage: 'paid' },
  { name: 'Ryan Cole',    handle: '@ryancole',    platform: 'Instagram', followers: '91K',  eng: '2.1%', stage: 'outreach' },
  { name: 'Aria Nguyen',  handle: '@ariangy',     platform: 'TikTok',    followers: '178K', eng: '5.5%', stage: 'prospect' },
  { name: 'Zoe Williams', handle: '@zoewills',    platform: 'Instagram', followers: '67K',  eng: '5.1%', stage: 'prospect' },
]

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

/* ─── style maps ─────────────────────────────────────────────────────────────── */

const DEAL_STATUS: Record<DealStatus, { label: string; color: string }> = {
  negotiating:  { label: 'Negotiating',  color: 'bg-amber-500/15 text-amber-400' },
  confirmed:    { label: 'Confirmed',    color: 'bg-sky-500/15 text-sky-400' },
  content_due:  { label: 'Content due',  color: 'bg-orange-500/15 text-orange-400' },
  posted:       { label: 'Posted',       color: 'bg-green-500/15 text-green-400' },
  paid:         { label: 'Paid',         color: 'bg-muted text-muted-foreground' },
}

const CONTENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In review', color: 'bg-amber-500/15 text-amber-400' },
  approved:  { label: 'Approved',  color: 'bg-green-500/15 text-green-400' },
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-500/15 text-pink-400',
  TikTok:    'bg-foreground/10 text-foreground/80',
  YouTube:   'bg-red-500/15 text-red-400',
}

const CRED_META: Record<string, { label: string; color: string }> = {
  credible: { label: 'Credible',    color: 'text-green-400' },
  check:    { label: 'Check',       color: 'text-amber-400' },
  low:      { label: 'Low signal',  color: 'text-red-400' },
}

const CONTRACT_STATUS: Record<string, string> = {
  signed: 'bg-green-500/15 text-green-400',
  sent:   'bg-sky-500/15 text-sky-400',
  draft:  'bg-muted text-muted-foreground',
}

/* ─── views ──────────────────────────────────────────────────────────────────── */

function DashboardView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your influencer relationships</p>
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
            <h2 className="font-semibold text-foreground">Active deals</h2>
            <span className="text-xs text-muted-foreground">3 campaigns</span>
          </div>
          <div className="divide-y divide-border">
            {DEALS.map((deal) => {
              const meta = DEAL_STATUS[deal.status]
              return (
                <div key={deal.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center shrink-0 text-sm font-bold text-brand">{deal.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                    <p className="text-xs text-muted-foreground">{deal.handle} · {deal.followers} · {deal.niche}</p>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground hidden sm:block">{deal.campaign}</div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                  <div className="shrink-0 text-sm font-semibold text-foreground">${deal.fee.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Content due soon</h2>
            <Calendar size={15} className="text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {CONTENT.map((c) => (
              <div key={c.creator + c.type} className="px-5 py-4 hover:bg-muted/40 transition-colors cursor-default">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.creator}</p>
                    <p className="text-xs text-muted-foreground">{c.type} · {c.campaign}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONTENT_STATUS[c.status].color}`}>{CONTENT_STATUS[c.status].label}</span>
                    <span className={`text-xs font-medium ${c.due === 'Tomorrow' ? 'text-orange-400' : 'text-muted-foreground'}`}>{c.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfluencersView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Influencers</h1>
          <p className="text-sm text-muted-foreground mt-1">{INFLUENCERS.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium cursor-default">Import CSV</button>
          <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> Add influencer</button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              {['Name', 'Platform', 'Niche', 'Followers', 'Credibility', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {INFLUENCERS.map((inf) => {
              const cred = CRED_META[inf.cred]
              return (
                <tr key={inf.name} className="hover:bg-muted/30 cursor-default">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-xs font-bold text-brand shrink-0">{inf.name[0]}</div>
                      <div>
                        <p className="font-medium text-foreground">{inf.name}</p>
                        <p className="text-xs text-muted-foreground/70">{inf.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[inf.platform] ?? 'bg-muted text-muted-foreground'}`}>{inf.platform}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inf.niche}</td>
                  <td className="px-4 py-3 text-foreground/80">{inf.followers} <span className="text-muted-foreground/60 text-xs ml-0.5">{inf.eng}</span></td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${cred.color}`}>
                      {inf.cred === 'credible' && <ShieldCheck size={11} />}
                      {cred.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inf.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{inf.status}</span>
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

function CampaignsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">{CAMPAIGNS.length} campaigns</p>
        </div>
        <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New campaign</button>
      </div>
      <div className="space-y-4">
        {CAMPAIGNS.map((c) => {
          const pct = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
          return (
            <div key={c.name} className="bg-card border border-border rounded-xl p-6 hover:border-border/80 cursor-default">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{c.influencers} influencers · ends {c.endDate}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-6 mb-3">
                <div><p className="text-xs text-muted-foreground">Spend</p><p className="font-semibold text-foreground">${c.spend.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-semibold text-foreground">${c.budget.toLocaleString()}</p></div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{pct}% used</p>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaymentsView() {
  const totalPaid = PAYMENTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Payments</h1><p className="text-sm text-muted-foreground mt-1">{PAYMENTS.length} records</p></div>
        <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> Log payment</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center"><Check size={14} className="text-green-400" /></div><p className="text-sm text-muted-foreground">Total paid</p></div>
          <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock size={14} className="text-amber-400" /></div><p className="text-sm text-muted-foreground">Pending</p></div>
          <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>{['Creator', 'Campaign', 'Amount', 'Status', 'Paid date'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PAYMENTS.map((p, i) => (
              <tr key={i} className="hover:bg-muted/30 cursor-default">
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.campaign}</td>
                <td className="px-4 py-3 font-semibold text-foreground">${p.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DiscoverView() {
  const [filter, setFilter] = useState('all')
  const platforms = ['all', 'Instagram', 'TikTok', 'YouTube']
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Discover creators</h1><p className="text-sm text-muted-foreground mt-1">Browse public creator profiles</p></div>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input readOnly placeholder="Search by niche, handle, location…" className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground cursor-default" />
        </div>
        <div className="flex gap-1">
          {platforms.map(p => (
            <button key={p} onClick={() => setFilter(p)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === p ? 'bg-foreground/90 text-background' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}>
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISCOVER_CREATORS.filter(c => filter === 'all' || c.platform === filter).map((c) => (
          <div key={c.name} className="bg-card border border-border rounded-xl p-5 hover:border-brand/30 transition-colors cursor-default">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-sm font-bold text-brand shrink-0">{c.name[0]}</div>
              <div>
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.handle}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70"><MapPin size={10} />{c.location}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[c.platform] ?? 'bg-muted text-muted-foreground'}`}>{c.platform}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{c.niche}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div><p className="text-sm font-bold text-foreground">{c.followers}</p><p className="text-xs text-muted-foreground">followers</p></div>
              <div><p className="text-sm font-bold text-brand">{c.eng}</p><p className="text-xs text-muted-foreground">engagement</p></div>
              <div><p className="text-xs font-semibold text-foreground">{c.rate}</p><p className="text-xs text-muted-foreground">per post</p></div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-default">
              <Plus size={12} /> Add to campaign
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutreachView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outreach templates</h1>
          <p className="text-sm text-muted-foreground mt-1">{OUTREACH_TEMPLATES.length} templates · Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{name}}'}</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{niche}}'}</code> as variables</p>
        </div>
        <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New template</button>
      </div>
      <div className="space-y-3">
        {OUTREACH_TEMPLATES.map((t) => (
          <div key={t.name} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t.platform}</span>
                    <span className="text-xs text-muted-foreground/70">Subject: {t.subject}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 bg-muted text-muted-foreground hover:text-foreground px-2 py-1 rounded text-xs font-medium transition-colors cursor-default"><Send size={11} /> Send</button>
                  <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Copy size={13} /></button>
                  <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Pencil size={13} /></button>
                  <button className="p-1.5 text-muted-foreground/70 hover:text-red-400 transition-colors cursor-default"><Trash2 size={13} /></button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-3 leading-relaxed">{t.body}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PipelineView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag creators through your deal stages</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {PIPELINE_STAGES.map((stage) => {
            const creators = PIPELINE_CREATORS.filter(c => c.stage === stage.id)
            return (
              <div key={stage.id} className="min-w-[200px] w-[200px] flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stage.color}`}>{stage.label}</span>
                  <span className="text-xs text-muted-foreground font-medium">{creators.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {creators.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-xl h-[80px] flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/40">Drop here</span>
                    </div>
                  ) : (
                    creators.map((c) => (
                      <div key={c.handle} className="bg-card border border-border rounded-xl p-3 cursor-default hover:border-brand/30 transition-colors">
                        <p className="text-sm font-semibold text-foreground leading-tight">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.handle}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[c.platform] ?? 'bg-muted text-muted-foreground'}`}>{c.platform}</span>
                          <span className="text-xs text-muted-foreground">{c.followers}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-5 bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
        Drag and drop creators between stages in the real app
      </div>
    </div>
  )
}

function ContractsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Contracts</h1><p className="text-sm text-muted-foreground mt-1">{CONTRACTS.length} contracts</p></div>
        <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New contract</button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>{['Influencer', 'Campaign', 'Status', 'Date', ''].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CONTRACTS.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30 cursor-default">
                <td className="px-4 py-3 font-medium text-foreground">{c.influencer}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.campaign}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${CONTRACT_STATUS[c.status]}`}>{c.status}</span>
                    {c.status === 'signed' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PenLine size={10} />Signed by {c.influencer}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {(c.status === 'sent' || c.status === 'draft') && (
                      <button title="Copy sign link" className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><LinkIcon size={13} /></button>
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

type LiveDeal = {
  id: string
  brand_name: string
  logo_url: string | null
  title: string
  type: string
  commission_rate: number | null
  budget_min: number | null
  budget_max: number | null
  min_followers: number | null
  niches: string[]
  platforms: string[]
  apply_url: string
  is_featured: boolean
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  if (min != null) return `From $${min.toLocaleString()}`
  return `Up to $${max!.toLocaleString()}`
}

function MarketplaceView() {
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
          <h1 className="text-2xl font-bold text-foreground">Brand Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">Real brand deals, affiliate programs, and collabs your creators can apply for</p>
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
                  {l.min_followers != null && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users size={11} />{l.min_followers >= 1000 ? `${(l.min_followers/1000).toFixed(0)}K` : l.min_followers}+ followers</span>}
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

function SettingsView() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-foreground">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p></div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            {[{ label: 'Name', value: 'Demo Brand' }, { label: 'Email', value: 'brand@demo.com' }, { label: 'Company', value: 'Demo Co.' }].map(({ label, value }) => (
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
              <p className="font-medium text-foreground">Brand plan</p>
              <p className="text-sm text-muted-foreground">$19/mo · unlimited campaigns and contacts</p>
            </div>
            <span className="text-xs bg-brand/15 text-brand font-semibold px-3 py-1 rounded-full">Active</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Email sending</h2>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-sm text-foreground">Connected · sends from <code className="text-xs bg-muted px-1 rounded">hello@yourbrand.com</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── tab config ─────────────────────────────────────────────────────────────── */

type Tab = 'dashboard' | 'influencers' | 'campaigns' | 'payments' | 'pipeline' | 'marketplace' | 'discover' | 'outreach' | 'contracts' | 'settings'

const MAIN_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'influencers', label: 'Influencers', icon: Users },
  { id: 'campaigns',   label: 'Campaigns',   icon: BarChart3 },
  { id: 'payments',    label: 'Payments',    icon: CreditCard },
]

const GROWTH_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'pipeline',    label: 'Pipeline',     icon: Kanban },
  { id: 'marketplace', label: 'Opportunities', icon: Store },
  { id: 'discover',    label: 'Discover',     icon: Search },
  { id: 'outreach',    label: 'Outreach',     icon: Mail },
  { id: 'contracts',   label: 'Contracts',    icon: FileText },
]

/* ─── shell ──────────────────────────────────────────────────────────────────── */

export default function BrandDemo() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col h-full">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-foreground">influencr</span>
          <span className="text-xs bg-brand/15 text-brand font-semibold px-2 py-0.5 rounded-full">Demo</span>
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
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Growth</p>
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
          <p className="px-3 pt-2 text-xs text-muted-foreground/50 truncate">brand@demo.com</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6 bg-brand/10 border border-brand/20 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">Brand demo</span> — click any sidebar item to explore. All data is fake.
            </p>
            <Link href="/signup?type=brand" className="shrink-0 flex items-center gap-1.5 bg-brand text-brand-foreground px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
              Start free trial <ArrowRight size={13} />
            </Link>
          </div>

          {tab === 'dashboard'   && <DashboardView />}
          {tab === 'influencers' && <InfluencersView />}
          {tab === 'campaigns'   && <CampaignsView />}
          {tab === 'payments'    && <PaymentsView />}
          {tab === 'pipeline'    && <PipelineView />}
          {tab === 'marketplace' && <MarketplaceView />}
          {tab === 'discover'    && <DiscoverView />}
          {tab === 'outreach'    && <OutreachView />}
          {tab === 'contracts'   && <ContractsView />}
          {tab === 'settings'    && <SettingsView />}
        </div>
      </main>
    </div>
  )
}
