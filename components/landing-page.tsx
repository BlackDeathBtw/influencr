'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { BlobBg } from '@/components/animated-bg'
import { VideoBg } from '@/components/video-bg'

const ease = [0.16, 1, 0.3, 1] as const

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }} className={className}>
      {children}
    </motion.div>
  )
}

function InView({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay, ease }} className={className}>
      {children}
    </motion.div>
  )
}

const FEATURES = [
  { n: '01', title: 'Influencer CRM & Pipeline', body: 'Every contact, handle, niche, and rate. Six-stage Kanban pipeline moves deals from prospect to paid — fully drag-and-drop.' },
  { n: '02', title: 'Campaign tracker', body: 'Deal status, deliverables, and fees per campaign. One view, no status-update emails.' },
  { n: '03', title: 'Content deadlines', body: 'Posts, reels, stories. Due dates, approvals, and revisions — all tracked.' },
  { n: '04', title: 'Payment log', body: 'Pending, paid, overdue. One click to mark a payment done and log the date.' },
  { n: '05', title: 'Contract generator + drawn e-sign', body: 'Generate contracts from templates. Creators draw their real signature in the browser. Full audit trail with name, email, and timestamp. No DocuSign.' },
  { n: '06', title: 'Creator discovery', body: 'Browse public creator profiles. Filter by niche, platform, follower count, and rate. Add to your CRM in one click.' },
  { n: '07', title: 'Outreach templates', body: 'Write once, send to many. Variable substitution for name and niche. Track open and reply rates.' },
  { n: '08', title: 'Opportunities marketplace', body: 'Post brand deals, affiliate programs, and collabs. Creators apply directly — no middleman, no agency fees.' },
]

const STACK = [
  { name: 'MightyScout', price: '$99' },
  { name: 'Grin', price: '$299+' },
  { name: 'Aspire', price: '$500+' },
  { name: 'DocuSign', price: '$45+' },
  { name: 'HoneyBook', price: '$39+' },
]

const BRAND_FEATURES = [
  'Influencer CRM + Kanban pipeline',
  'Campaign management',
  'Opportunities marketplace',
  'Contract generator + drawn e-sign',
  'Content deadline tracking',
  'Payment log + creator discovery',
]

const CREATOR_FEATURES = [
  'Public media kit at /c/yourname',
  'Browse brand deals & opportunities',
  'Deal tracker kanban',
  'Invoice generator',
  'E-sign contracts (drawn signature)',
  'Professional profile URL',
]

const HOW_IT_WORKS = [
  { n: '01', title: 'Build your creator roster', body: 'Upload a CSV or discover creators directly in the platform. Store handles, niches, follower counts, rates, and notes — all searchable.' },
  { n: '02', title: 'Run deals through the pipeline', body: 'Drag creators through six stages — Prospect → Outreach → Negotiating → Contracted → Delivered → Paid. Post opportunities to the marketplace and let creators apply.' },
  { n: '03', title: 'Contracts, e-sign, and payments', body: 'Generate a contract from a template, collect a drawn signature in-browser, and log the payment. No DocuSign, no HoneyBook, no separate tool.' },
]

const SPOTLIGHT_CREATORS = [
  { name: 'Alex Rivera', initials: 'AR', niches: ['Lifestyle', 'Travel'], platform: 'TikTok', followers: '210K', engagement: '6.2%', location: 'Los Angeles, CA', bio: 'Travel content and brand collabs. DMs open for inquiries.' },
  { name: 'Emma Chen', initials: 'EC', niches: ['Beauty', 'Wellness'], platform: 'Instagram', followers: '84K', engagement: '4.8%' },
  { name: 'Marcus Hill', initials: 'MH', niches: ['Tech', 'Gaming'], platform: 'YouTube', followers: '125K', engagement: '3.9%' },
]

const FAQS = [
  { q: 'How is influencr different from Grin or Aspire?', a: 'Grin and Aspire are built for enterprise teams with 50–200+ influencer relationships and dedicated platform specialists. influencr is built for growing brands — teams of 1 to 5 managing real programs without the $300–500/mo price tag. Same core workflows, honest scope, a fraction of the cost.' },
  { q: 'Can I bring my existing influencer list?', a: 'Yes. Upload a CSV with any columns you already use — handles, email, niche, rate, notes — and influencr maps them automatically. No data re-entry.' },
  { q: 'Does influencr integrate with Shopify, TikTok, or Instagram?', a: 'Not currently. influencr is a workflow and relationship tool — it manages your deals, documents, and deadlines. For platform-native analytics and affiliate tracking, tools like Modash or Triple Whale sit alongside it perfectly.' },
  { q: 'Is my data secure? Who can see my contracts?', a: "Campaign data, contracts, and payments are completely private to your account. Creator media kit profiles are public by design — that's their purpose. All data is encrypted at rest and in transit." },
  { q: 'What happens when the 14-day trial ends?', a: "You'll be asked to enter a card and pay $19/mo. No charges happen during the trial, no auto-billing, no surprise at day 15. You keep full access to everything you've built." },
  { q: 'Is it really free for creators forever?', a: "Yes. Creator profiles, deal tracker, invoice generator, and e-sign are free forever. No credit card, no time limit, no hidden tiers. We make money from brands — creators are always free." },
]

const PRICING_INCLUDES = [
  'Unlimited contacts & notes', 'Contract generator + drawn e-sign', '14-day free trial',
  'Unlimited campaigns', 'Kanban pipeline (6 stages)', 'Cancel anytime',
  'Opportunities marketplace', 'Payment log', 'Your data, always exportable',
]

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
      {FAQS.map(({ q, a }, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="flex items-center justify-between w-full px-6 py-5 text-left hover:bg-muted/40 transition-colors">
            <span className="font-semibold text-foreground pr-6 text-sm sm:text-base">{q}</span>
            <ChevronDown size={15} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-all duration-200 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const MOCK_INFLUENCERS = [
  { initials: 'AR', name: 'Alex Rivera', status: 'confirmed', fee: '$1,200' },
  { initials: 'EC', name: 'Emma Chen', status: 'negotiating', fee: '$850' },
  { initials: 'MH', name: 'Marcus Hill', status: 'outreach', fee: '—' },
  { initials: 'JS', name: 'Jordan Smith', status: 'confirmed', fee: '$2,100' },
]

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-500/20 text-emerald-400',
  negotiating: 'bg-amber-500/20 text-amber-400',
  outreach: 'bg-card/8 text-white/35',
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-brand-dark/96 backdrop-blur-md px-6 py-0 h-14 flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <span className="font-display font-extrabold text-lg tracking-tight text-white">influencr</span>
          <div className="flex items-center gap-1">
            <Link href="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors px-4 py-2">Sign in</Link>
            <Link href="/signup" className="text-sm bg-brand text-brand-foreground px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-brand-dark pt-32 pb-24 px-6 overflow-hidden">
        <VideoBg />
        <div className="absolute inset-0 bg-brand-dark/65" aria-hidden="true" />
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1fr_280px] gap-14 items-start">
          <div>
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-2 border border-white/12 rounded-full px-4 py-1.5 text-xs text-white/50 mb-8 font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                Creators get free tools forever
              </div>
            </FadeUp>
            <FadeUp delay={0.07}>
              <h1 className="font-display font-extrabold text-white leading-[1.02] tracking-tight" style={{ fontSize: 'clamp(2.75rem, 6vw, 4.5rem)' }}>
                The influencer<br />
                <span className="text-brand">operating system.</span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.17}>
              <p className="mt-6 text-white/50 max-w-lg leading-relaxed" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)' }}>
                CRM, campaigns, contracts, content approvals, and payments in one place. Built for teams replacing their spreadsheet + DocuSign setup. $19/mo.
              </p>
            </FadeUp>
            <FadeUp delay={0.25} className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup?type=brand" className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-7 py-3.5 rounded-lg text-base font-bold hover:brightness-110 transition-all">
                Start free trial <ArrowRight size={16} />
              </Link>
              <Link href="/signup?type=creator" className="inline-flex items-center gap-2 border border-white/18 text-white/65 px-7 py-3.5 rounded-lg text-base font-medium hover:border-white/35 hover:text-white transition-all">
                I&apos;m a creator
              </Link>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p className="mt-4 text-xs text-white/30 tracking-wide">No credit card required. 14-day free trial.</p>
            </FadeUp>
          </div>

          {/* What you're replacing */}
          <FadeUp delay={0.2}>
            <div className="bg-card/4 border border-white/10 rounded-2xl p-5 mt-1">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">What you&apos;re replacing</p>
              <div>
                {STACK.map(({ name, price }) => (
                  <div key={name} className="flex items-center justify-between py-2.5 border-b border-white/6 last:border-0">
                    <span className="text-sm text-white/30 line-through">{name}</span>
                    <span className="text-sm text-white/20 line-through">{price}/mo</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand/25">
                <span className="text-sm font-bold text-white">influencr</span>
                <span className="text-sm font-extrabold text-brand">$19/mo</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-y border-border bg-muted/40 px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {['14-day free trial', 'No credit card required', 'Cancel anytime', 'Your data, always exportable'].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check size={12} className="text-brand shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Two-sided value props */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <InView>
            <div className="grid lg:grid-cols-[3fr_2fr] gap-px bg-border rounded-2xl overflow-hidden">
              <div className="bg-card p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-brand mb-5">For brands · $19/mo</p>
                <h2 className="font-display text-3xl font-bold text-foreground mb-3">Run your entire influencer program</h2>
                <p className="text-muted-foreground mb-7 leading-relaxed text-sm">
                  Contacts, campaigns, contracts, content approvals, payments. Replace your stack in 10 minutes.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {BRAND_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check size={13} className="text-brand shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-5">
                  <Link href="/signup?type=brand" className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
                    Start free trial <ArrowRight size={14} />
                  </Link>
                  <Link href="/demo/brand" className="text-sm text-muted-foreground hover:text-foreground transition-colors">See demo →</Link>
                </div>
              </div>
              <div className="bg-muted/30 p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/30 mb-5">For creators · Free forever</p>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Your professional deal HQ</h2>
                <p className="text-muted-foreground mb-7 leading-relaxed text-sm">
                  Public media kit, deal tracker, invoice generator, e-sign contracts. Manage your brand deals like a business.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {CREATOR_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground/70">
                      <Check size={13} className="text-foreground/30 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-5">
                  <Link href="/signup?type=creator" className="inline-flex items-center gap-2 border border-border text-foreground/65 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-foreground/30 hover:text-foreground transition-all">
                    Create free profile <ArrowRight size={14} />
                  </Link>
                  <Link href="/demo/creator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">See example →</Link>
                </div>
              </div>
            </div>
          </InView>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <InView className="mb-14">
            <h2 className="font-display text-4xl font-bold text-foreground mb-2">Set up in 10 minutes.</h2>
            <p className="text-muted-foreground text-lg">Running your first campaign by end of day.</p>
          </InView>
          <div className="space-y-0">
            {HOW_IT_WORKS.map(({ n, title, body }, i) => (
              <InView key={n} delay={i * 0.08}>
                <div className="grid grid-cols-[3.5rem_1fr] lg:grid-cols-[3.5rem_14rem_1fr] gap-6 lg:gap-12 py-8 border-b border-border last:border-0 items-start">
                  <span className="font-mono text-2xl font-bold text-brand/35 pt-1">{n}</span>
                  <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* App UI preview */}
      <section className="py-20 px-6 bg-brand-dark overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <InView className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand/60 mb-3">What you&apos;ll see on day one</p>
            <h2 className="font-display text-4xl font-bold text-white">Your campaign, in one view.</h2>
          </InView>
          <InView>
            <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              {/* Browser bar */}
              <div className="bg-card/5 border-b border-white/8 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-card/12" />)}
                </div>
                <div className="bg-card/6 rounded-md px-4 py-1 text-xs text-white/25 mx-auto">
                  app.influencr.co/campaigns/summer-2025
                </div>
              </div>
              {/* App layout */}
              <div className="flex" style={{ minHeight: 260 }}>
                {/* Sidebar */}
                <div className="w-40 bg-card/3 border-r border-white/6 p-3 flex-col gap-1 hidden sm:flex shrink-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1 mb-1">influencr</div>
                  {['Dashboard', 'Campaigns', 'Influencers', 'Pipeline', 'Opportunities', 'Contracts'].map((item, i) => (
                    <div key={item} className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${i === 1 ? 'bg-brand/25 text-brand' : 'text-white/30'}`}>{item}</div>
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 p-5 sm:p-6 min-w-0">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-white font-semibold text-sm">Summer 2025 Campaign</h3>
                      <p className="text-white/30 text-xs mt-0.5">4 influencers · $8,200 budget · Active</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/18 text-emerald-400 px-2 py-1 rounded-full font-medium hidden sm:block">Active</span>
                  </div>
                  <div className="space-y-0">
                    {MOCK_INFLUENCERS.map(({ initials, name, status, fee }) => (
                      <div key={name} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-brand/25 flex items-center justify-center text-[10px] font-bold text-brand shrink-0">{initials}</div>
                        <span className="text-white/75 text-xs flex-1 min-w-0 truncate">{name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[status]}`}>{status}</span>
                        <span className="text-white/30 text-xs font-mono shrink-0 hidden sm:block">{fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </InView>
        </div>
      </section>

      {/* Features — spec table */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <InView className="mb-14">
            <h2 className="font-display text-4xl font-bold text-foreground mb-2">Eight tools. One subscription.</h2>
            <p className="text-muted-foreground text-lg">Zero bloat. No upsells. Everything included at $19/mo.</p>
          </InView>
          <div>
            {FEATURES.map(({ n, title, body }, i) => (
              <InView key={n} delay={i * 0.04}>
                <div className="grid grid-cols-[2.5rem_1fr] lg:grid-cols-[2.5rem_1fr_2fr] gap-4 lg:gap-8 py-6 border-b border-border last:border-0 items-baseline group">
                  <span className="font-mono text-xs text-brand/50 pt-0.5">{n}</span>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-brand transition-colors duration-150">{title}</h3>
                  <p className="text-sm text-muted-foreground col-start-2 lg:col-start-auto leading-relaxed">{body}</p>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* Creator spotlight — asymmetric */}
      <section className="py-20 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <InView className="mb-12">
            <h2 className="font-display text-4xl font-bold text-foreground mb-2">Creators build free media kits.</h2>
            <p className="text-muted-foreground text-lg">Brands on influencr find and contact them directly.</p>
          </InView>
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Featured creator */}
            <InView>
              <div className="bg-card border border-border rounded-2xl p-8 h-full">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand/15 flex items-center justify-center text-lg font-extrabold text-brand font-display shrink-0">
                      {SPOTLIGHT_CREATORS[0].initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{SPOTLIGHT_CREATORS[0].name}</p>
                      <p className="text-muted-foreground text-sm">{SPOTLIGHT_CREATORS[0].location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-xl font-display">{SPOTLIGHT_CREATORS[0].followers}</p>
                    <p className="text-xs text-muted-foreground">{SPOTLIGHT_CREATORS[0].platform}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{SPOTLIGHT_CREATORS[0].bio}</p>
                <div className="flex items-center justify-between pt-5 border-t border-border">
                  <div className="flex gap-2">
                    {SPOTLIGHT_CREATORS[0].niches.map((n) => (
                      <span key={n} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{n}</span>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand text-lg font-display">{SPOTLIGHT_CREATORS[0].engagement}</p>
                    <p className="text-xs text-muted-foreground">engagement</p>
                  </div>
                </div>
              </div>
            </InView>

            {/* Compact list + CTA */}
            <div className="flex flex-col gap-3">
              {SPOTLIGHT_CREATORS.slice(1).map((c, i) => (
                <InView key={c.name} delay={0.08 + i * 0.07}>
                  <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand/12 flex items-center justify-center text-sm font-bold text-brand shrink-0">{c.initials}</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.name}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          {c.niches.map((n) => <span key={n} className="text-xs text-muted-foreground">{n}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground text-sm">{c.followers}</p>
                      <p className="text-xs text-muted-foreground">{c.platform}</p>
                    </div>
                  </div>
                </InView>
              ))}
              <InView delay={0.22}>
                <Link href="/signup?type=creator" className="flex items-center justify-center gap-2 border border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-brand px-5 py-4 rounded-xl text-sm font-medium transition-all">
                  Are you a creator? Get your free profile <ArrowRight size={14} />
                </Link>
              </InView>
              <InView delay={0.28}>
                <Link href="/demo/creator" className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1 block">
                  See a full example →
                </Link>
              </InView>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <InView className="mb-12">
            <h2 className="font-display text-4xl font-bold text-foreground mb-2">Everything you&apos;re wondering.</h2>
            <p className="text-muted-foreground text-lg">Honest answers, no fluff.</p>
          </InView>
          <InView><FaqAccordion /></InView>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-24 px-6 bg-brand-dark overflow-hidden">
        <BlobBg />
        <div className="relative z-10 max-w-6xl mx-auto">
          <InView>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-14">
              <div className="flex-1">
                <h2 className="font-display font-extrabold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.08 }}>
                  One price.<br />Everything included.
                </h2>
                <p className="text-white/45 text-lg">No tiers. No seat fees. No gotchas.</p>
              </div>
              <div className="flex items-end gap-3 shrink-0">
                <span className="font-display text-[6.5rem] font-extrabold text-white leading-none tracking-tight">$19</span>
                <div className="pb-4">
                  <span className="text-white/45 text-xl">/mo</span>
                  <p className="text-sm text-white/25 mt-0.5">billed monthly</p>
                </div>
              </div>
              <Link href="/signup?type=brand" className="shrink-0 bg-brand text-brand-foreground px-8 py-4 rounded-xl text-base font-bold hover:brightness-110 transition-all">
                Start 14-day free trial
              </Link>
            </div>
            <div className="border-t border-white/8 pt-10">
              <div className="grid sm:grid-cols-3 gap-y-3 gap-x-10">
                {PRICING_INCLUDES.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check size={12} className="text-brand/60 shrink-0" />
                    <span className="text-sm text-white/40">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-xs text-white/18 text-center">
                Compare: MightyScout $99/mo · Grin $299+/mo · Aspire $500+/mo · DocuSign $45+/mo
              </p>
            </div>
          </InView>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-display font-extrabold text-foreground tracking-tight">influencr</span>
          <span className="text-sm text-muted-foreground order-last sm:order-none">
            © {new Date().getFullYear()} influencr. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            <Link href="/demo/brand" className="hover:text-foreground transition-colors">Brand demo</Link>
            <Link href="/demo/creator" className="hover:text-foreground transition-colors">Creator demo</Link>
            <Link href="/for-creators" className="hover:text-foreground transition-colors">For creators</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
