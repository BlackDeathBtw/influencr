'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, BarChart3, CreditCard, LayoutDashboard,
  Settings, Mail, FileText, ArrowRight,
  Calendar, Check, Clock, Plus,
  Send, Copy, Pencil, Trash2, ExternalLink,
  ShieldCheck, Kanban, PenLine, Link as LinkIcon, Download,
  Store, DollarSign, Percent, Star,
} from 'lucide-react'
import {
  DndContext, DragOverlay,
  PointerSensor, MouseSensor, TouchSensor,
  useSensor, useSensors,
  useDroppable, useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'

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
  { name: 'Emma Chen',   handle: '@emmachen',   platform: 'Instagram', niche: 'Beauty',    followers: '84K',  eng: '4.8%', status: 'active',   cred: 'credible', tags: ['beauty-tier-1', 'holiday-roster'], contact_email: 'emma@emmachen.co' },
  { name: 'Jake Torres', handle: '@jakefit',    platform: 'TikTok',    niche: 'Fitness',   followers: '210K', eng: '6.2%', status: 'active',   cred: 'credible', tags: ['fitness-tier-1'],                  contact_email: 'jake@jakefit.com' },
  { name: 'Sofia Kim',   handle: '@sofiakim',   platform: 'Instagram', niche: 'Lifestyle', followers: '56K',  eng: '3.9%', status: 'active',   cred: 'check',    tags: ['lifestyle'],                       contact_email: 'sofia@sofiakim.com' },
  { name: 'Marcus Hill', handle: '@marcushill', platform: 'YouTube',   niche: 'Tech',      followers: '125K', eng: '3.1%', status: 'prospect', cred: 'credible', tags: ['tech', 'gaming'],                  contact_email: 'marcus@marcushill.tv' },
  { name: 'Lily Park',   handle: '@lilypark',   platform: 'TikTok',    niche: 'Food',      followers: '34K',  eng: '7.2%', status: 'active',   cred: 'credible', tags: [],                                  contact_email: 'lily@lilypark.co' },
  { name: 'Ryan Cole',   handle: '@ryancole',   platform: 'Instagram', niche: 'Travel',    followers: '91K',  eng: '2.1%', status: 'active',   cred: 'low',      tags: ['travel'],                          contact_email: 'ryan@ryancole.com' },
  { name: 'Aria Nguyen', handle: '@ariangy',    platform: 'TikTok',    niche: 'Fashion',   followers: '178K', eng: '5.5%', status: 'prospect', cred: 'credible', tags: ['fashion', 'beauty-tier-2'],        contact_email: 'aria@ariangy.com' },
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

const SEQUENCES = [
  { id: 'seq1', name: 'Cold outreach — lifestyle',
    steps: [
      { delay_days: 0, subject: 'Collab opportunity with [Brand]' },
      { delay_days: 3, subject: 'Following up — collab with [Brand]' },
      { delay_days: 7, subject: 'Last message — [Brand] collab' },
    ],
    enrollments: [{ name: 'Emma Chen', step: 1, status: 'active' }, { name: 'Jake Torres', step: 3, status: 'completed' }],
  },
  { id: 'seq2', name: 'Re-engagement — past collabs',
    steps: [{ delay_days: 0, subject: "We'd love to work with you again" }, { delay_days: 5, subject: 'Quick follow-up' }],
    enrollments: [],
  },
]
const CAMPAIGN_RESULTS = [
  { campaign: 'Summer Glow',    influencer: 'Emma Chen',   views: 42800,  reach: 31200,  clicks: 1840, conversions: 94 },
  { campaign: 'Summer Glow',    influencer: 'Jake Torres', views: 187000, reach: 142000, clicks: 6200, conversions: 310 },
  { campaign: 'Back to School', influencer: 'Sofia Kim',   views: 28400,  reach: 21100,  clicks: 890,  conversions: 42 },
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
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const allTags = [...new Set(INFLUENCERS.flatMap(i => i.tags))]
  const filtered = tagFilter ? INFLUENCERS.filter(i => i.tags.includes(tagFilter)) : INFLUENCERS

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium cursor-default">Import CSV</button>
          <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> Add influencer</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground font-medium">Tag:</span>
        {[null, ...allTags].map(tag => (
          <button key={tag ?? '_all'} onClick={() => setTagFilter(tag)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-default ${tagFilter === tag ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{tag ?? 'All'}</button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border"><tr>{['Name', 'Platform', 'Niche', 'Followers', 'Tags', 'Credibility', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map((inf) => {
              const cred = CRED_META[inf.cred]
              return (
                <tr key={inf.name} className="hover:bg-muted/30 cursor-default">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-xs font-bold text-brand shrink-0">{inf.name[0]}</div>
                      <div><p className="font-medium text-foreground">{inf.name}</p><p className="text-xs text-muted-foreground/70">{inf.handle}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[inf.platform] ?? 'bg-muted text-muted-foreground'}`}>{inf.platform}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{inf.niche}</td>
                  <td className="px-4 py-3 text-foreground/80">{inf.followers} <span className="text-muted-foreground/60 text-xs ml-0.5">{inf.eng}</span></td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{inf.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand">{t}</span>)}</div></td>
                  <td className="px-4 py-3"><span className={`flex items-center gap-1 text-xs font-medium ${cred.color}`}>{inf.cred === 'credible' && <ShieldCheck size={11} />}{cred.label}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inf.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>{inf.status}</span></td>
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
      <div className="space-y-4 mb-8">
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Post-campaign results</h2>
          <button className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> Log results</button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr>{['Campaign', 'Influencer', 'Views', 'Reach', 'Clicks', 'Conversions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {CAMPAIGN_RESULTS.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30 cursor-default">
                  <td className="px-4 py-3 text-foreground font-medium">{r.campaign}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.influencer}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.reach.toLocaleString()}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-brand">{r.conversions}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        {[{ label: 'Total paid', val: totalPaid, icon: Check, cls: 'bg-green-500/10', icls: 'text-green-400' }, { label: 'Pending', val: totalPending, icon: Clock, cls: 'bg-amber-500/10', icls: 'text-amber-400' }].map(({ label, val, icon: Icon, cls, icls }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2"><div className={`w-8 h-8 ${cls} rounded-lg flex items-center justify-center`}><Icon size={14} className={icls} /></div><p className="text-sm text-muted-foreground">{label}</p></div>
            <p className="text-2xl font-bold text-foreground">${val.toLocaleString()}</p>
          </div>
        ))}
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

const SENT_MOCK = [
  { to: 'Emma Chen',   subject: 'Collab opportunity with [Brand]',     sentAt: 'Jun 10, 9:41am', status: 'opened' },
  { to: 'Jake Torres', subject: 'Collab opportunity with [Brand]',     sentAt: 'Jun 10, 9:41am', status: 'clicked' },
  { to: 'Sofia Kim',   subject: 'Sponsorship opportunity — Sofia Kim', sentAt: 'Jun 8, 2:15pm',  status: 'sent' },
  { to: 'Marcus Hill', subject: 'Following up: collab with [Brand]',   sentAt: 'Jun 7, 11:00am', status: 'bounced' },
]
const SENT_STATUS_COLOR: Record<string, string> = {
  opened: 'bg-sky-500/15 text-sky-400', clicked: 'bg-green-500/15 text-green-400',
  sent: 'bg-muted text-muted-foreground', bounced: 'bg-red-500/15 text-red-400',
}

function OutreachView() {
  type OutreachTab = 'templates' | 'sequences' | 'sent'
  const [subTab, setSubTab] = useState<OutreachTab>('templates')
  const [bulkOpen, setBulkOpen] = useState<string | null>(null)
  const [checkedContacts, setCheckedContacts] = useState<Set<string>>(new Set())
  const [expandedSeq, setExpandedSeq] = useState<string | null>(null)
  const OTABS: { id: OutreachTab; label: string }[] = [{ id: 'templates', label: 'Templates' }, { id: 'sequences', label: 'Sequences' }, { id: 'sent', label: 'Sent' }]
  function toggleContact(name: string) {
    setCheckedContacts(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-1">Templates, sequences, and sent history</p>
        </div>
        {subTab === 'templates' && (
          <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New template</button>
        )}
        {subTab === 'sequences' && (
          <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Plus size={14} /> New sequence</button>
        )}
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-5">
        {OTABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-default ${subTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
        ))}
      </div>

      {subTab === 'templates' && (
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
                    <button
                      onClick={() => { setBulkOpen(bulkOpen === t.name ? null : t.name); setCheckedContacts(new Set()) }}
                      className="flex items-center gap-1 bg-brand/10 text-brand hover:bg-brand/20 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-default"
                    ><Send size={11} /> Bulk send</button>
                    <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Copy size={13} /></button>
                    <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Pencil size={13} /></button>
                    <button className="p-1.5 text-muted-foreground/70 hover:text-red-400 transition-colors cursor-default"><Trash2 size={13} /></button>
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-3 leading-relaxed">{t.body}</pre>
              </div>
              {bulkOpen === t.name && (
                <div className="border-t border-border bg-muted/30 px-5 py-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Select recipients</p>
                  <div className="space-y-2 mb-4">
                    {INFLUENCERS.map(inf => (
                      <label key={inf.name} className="flex items-center gap-3 cursor-default">
                        <input type="checkbox" checked={checkedContacts.has(inf.name)} onChange={() => toggleContact(inf.name)} className="cursor-default accent-brand" />
                        <span className="text-sm text-foreground">{inf.name}</span>
                        <span className="text-xs text-muted-foreground">{inf.contact_email}</span>
                      </label>
                    ))}
                  </div>
                  <button className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium cursor-default"><Send size={13} /> Send to {checkedContacts.size} contact{checkedContacts.size !== 1 ? 's' : ''}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'sequences' && (
        <div className="space-y-3">
          {SEQUENCES.map((seq) => (
            <div key={seq.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-default hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedSeq(expandedSeq === seq.id ? null : seq.id)}
              >
                <div>
                  <h3 className="font-semibold text-foreground">{seq.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{seq.steps.length} steps · {seq.enrollments.length} enrolled</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${seq.enrollments.length > 0 ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    {seq.enrollments.length > 0 ? `${seq.enrollments.length} active` : 'No enrollments'}
                  </span>
                  <span className="text-muted-foreground text-xs">{expandedSeq === seq.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedSeq === seq.id && (
                <div className="border-t border-border px-5 py-4 bg-muted/20 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Steps</p>
                    <div className="space-y-1.5">
                      {seq.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="text-foreground font-medium">{step.subject}</span>
                          <span className="text-muted-foreground">{step.delay_days === 0 ? 'Day 0' : `+${step.delay_days}d`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {seq.enrollments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Enrollments</p>
                      <div className="space-y-1.5">
                        {seq.enrollments.map((en, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm text-foreground">{en.name}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${en.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-sky-500/15 text-sky-400'}`}>Step {en.step} · {en.status}</span>
                            <button className="ml-auto text-xs text-muted-foreground hover:text-foreground cursor-default border border-border rounded px-2 py-0.5 transition-colors">Send step {en.step}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'sent' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr>{['To', 'Subject', 'Sent', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {SENT_MOCK.map((m, i) => (
                <tr key={i} className="hover:bg-muted/30 cursor-default">
                  <td className="px-4 py-3 font-medium text-foreground">{m.to}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.sentAt}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SENT_STATUS_COLOR[m.status]}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type PipelineCreator = typeof PIPELINE_CREATORS[0] & { id: string }

function PipelineCard({ creator, isDragging }: { creator: PipelineCreator; isDragging?: boolean }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-3 hover:border-brand/30 transition-colors select-none ${isDragging ? 'opacity-30' : ''}`}>
      <p className="text-sm font-semibold text-foreground leading-tight">{creator.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{creator.handle}</p>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[creator.platform] ?? 'bg-muted text-muted-foreground'}`}>{creator.platform}</span>
        <span className="text-xs text-muted-foreground">{creator.followers}</span>
      </div>
    </div>
  )
}

function DraggableCard({ creator }: { creator: PipelineCreator }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: creator.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <PipelineCard creator={creator} isDragging={isDragging} />
    </div>
  )
}

function DroppableColumn({ stage, children }: { stage: typeof PIPELINE_STAGES[0]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-xl p-1 transition-colors ${isOver ? 'bg-brand/5 ring-1 ring-brand/20' : ''}`}>
      {children}
    </div>
  )
}

function PipelineView() {
  const [creators, setCreators] = useState<PipelineCreator[]>(() =>
    PIPELINE_CREATORS.map((c, i) => ({ ...c, id: String(i) }))
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const activeCreator = activeId ? creators.find(c => c.id === activeId) ?? null : null

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over) {
      setCreators(prev => prev.map(c =>
        c.id === String(active.id) ? { ...c, stage: over.id as CrmStage } : c
      ))
    }
    setActiveId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag creators through your deal stages</p>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={e => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {PIPELINE_STAGES.map((stage) => {
              const stageCreators = creators.filter(c => c.stage === stage.id)
              return (
                <div key={stage.id} className="min-w-[200px] w-[200px] flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stage.color}`}>{stage.label}</span>
                    <span className="text-xs text-muted-foreground font-medium">{stageCreators.length}</span>
                  </div>
                  <DroppableColumn stage={stage}>
                    {stageCreators.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-xl h-[80px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/40">Drop here</span>
                      </div>
                    ) : (
                      stageCreators.map((c) => (
                        <DraggableCard key={c.id} creator={c} />
                      ))
                    )}
                  </DroppableColumn>
                </div>
              )
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeCreator && (
            <div className="rotate-2 shadow-xl opacity-95">
              <PipelineCard creator={activeCreator} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
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
          <thead className="border-b border-border"><tr>{['Influencer', 'Campaign', 'Status', 'Date', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {CONTRACTS.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30 cursor-default">
                <td className="px-4 py-3 font-medium text-foreground">{c.influencer}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.campaign}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${CONTRACT_STATUS[c.status]}`}>{c.status}</span>
                    {c.status === 'signed' && <span className="flex items-center gap-1 text-xs text-muted-foreground"><PenLine size={10} />Signed by {c.influencer}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-1 justify-end">
                  {(c.status === 'sent' || c.status === 'draft') && <button title="Copy sign link" className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><LinkIcon size={13} /></button>}
                  <button title="Download PDF" className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><Download size={13} /></button>
                  <button className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-default"><ExternalLink size={13} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type LiveDeal = { id: string; brand_name: string; logo_url: string | null; title: string; type: string; commission_rate: number | null; budget_min: number | null; budget_max: number | null; min_followers: number | null; niches: string[]; platforms: string[]; apply_url: string; is_featured: boolean }

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

  useEffect(() => { fetch('/api/brand-deals?limit=30').then(r => r.json()).then(j => setDeals(j.deals ?? [])).catch(() => {}).finally(() => setLoading(false)) }, [])

  const TYPE_TABS = [{ id: 'all', label: 'All' }, { id: 'brand_deal', label: 'Brand Deals' }, { id: 'affiliate', label: 'Affiliate' }, { id: 'collab', label: 'Collabs' }]
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
                  <a href={l.apply_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-brand transition-colors py-1">Apply →</a>
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

type Tab = 'dashboard' | 'influencers' | 'campaigns' | 'payments' | 'pipeline' | 'marketplace' | 'outreach' | 'contracts' | 'settings'

const MAIN_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'influencers', label: 'Contacts', icon: Users },
  { id: 'campaigns',   label: 'Campaigns',   icon: BarChart3 },
  { id: 'payments',    label: 'Payments',    icon: CreditCard },
]

const GROWTH_NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'pipeline',    label: 'Pipeline',     icon: Kanban },
  { id: 'marketplace', label: 'Opportunities', icon: Store },
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
          {tab === 'outreach'    && <OutreachView />}
          {tab === 'contracts'   && <ContractsView />}
          {tab === 'settings'    && <SettingsView />}
        </div>
      </main>
    </div>
  )
}
