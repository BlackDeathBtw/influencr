'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { BlobBg } from '@/components/animated-bg'
import { VideoBg } from '@/components/video-bg'

const ease = [0.16, 1, 0.3, 1] as const

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function InView({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const FEATURES = [
  { n: '01', title: 'Influencer CRM', body: 'Every contact, handle, niche, and rate. No more lost spreadsheets.' },
  { n: '02', title: 'Campaign tracker', body: 'Deal status, deliverables, fees. One view per campaign.' },
  { n: '03', title: 'Content deadlines', body: 'Posts, reels, stories. Due dates, approvals, and revisions tracked.' },
  { n: '04', title: 'Payment log', body: 'Pending, paid, overdue. One click to mark a payment done.' },
  { n: '05', title: 'Contract generator', body: 'Generate and send contracts. Creators e-sign without DocuSign.' },
  { n: '06', title: 'Creator discovery', body: 'Browse creator profiles. Filter by niche, platform, follower count.' },
]

const STACK = [
  { name: 'MightyScout', price: '$99' },
  { name: 'Grin', price: '$299+' },
  { name: 'Aspire', price: '$500+' },
  { name: 'DocuSign', price: '$45+' },
  { name: 'HoneyBook', price: '$39+' },
]

const BRAND_FEATURES = [
  'Influencer CRM and contacts',
  'Campaign management',
  'Contract generator + e-sign',
  'Content deadline tracking',
  'Payment log',
  'Creator discovery and outreach',
]

const CREATOR_FEATURES = [
  'Public profile and media kit page',
  'Deal tracker (kanban)',
  'Invoice generator',
  'E-sign contracts from brands',
  'Professional /c/username URL',
]

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Import your influencers',
    body: 'Upload a CSV of existing contacts or add them one by one. Store handles, niches, follower counts, rates, and notes — all searchable.',
  },
  {
    n: '02',
    title: 'Launch a campaign',
    body: 'Create a campaign, assign influencers, and track every deal from negotiation through posting. One view. No status-update emails.',
  },
  {
    n: '03',
    title: 'Contracts and payments',
    body: 'Generate a contract from a template, collect the e-signature, and log the payment. Done in minutes. No DocuSign account needed.',
  },
]

const SPOTLIGHT_CREATORS = [
  {
    name: 'Alex Rivera',
    initials: 'AR',
    niches: ['Lifestyle', 'Travel'],
    platform: 'TikTok',
    followers: '210K',
    engagement: '6.2%',
  },
  {
    name: 'Emma Chen',
    initials: 'EC',
    niches: ['Beauty', 'Wellness'],
    platform: 'Instagram',
    followers: '84K',
    engagement: '4.8%',
  },
  {
    name: 'Marcus Hill',
    initials: 'MH',
    niches: ['Tech', 'Gaming'],
    platform: 'YouTube',
    followers: '125K',
    engagement: '3.9%',
  },
]

const FAQS = [
  {
    q: 'How is influencr different from Grin or Aspire?',
    a: 'Grin and Aspire are built for enterprise teams with 50–200+ influencer relationships and dedicated platform specialists. influencr is built for growing brands — teams of 1 to 5 managing real programs without the $300–500/mo price tag. Same core workflows, honest scope, a fraction of the cost.',
  },
  {
    q: 'Can I bring my existing influencer list?',
    a: 'Yes. Upload a CSV with any columns you already use — handles, email, niche, rate, notes — and influencr maps them automatically. No data re-entry.',
  },
  {
    q: 'Does influencr integrate with Shopify, TikTok, or Instagram?',
    a: 'Not currently. influencr is a workflow and relationship tool — it manages your deals, documents, and deadlines. For platform-native analytics and affiliate tracking, tools like Modash or Triple Whale sit alongside it perfectly.',
  },
  {
    q: 'Is my data secure? Who can see my contracts?',
    a: 'Campaign data, contracts, and payments are completely private to your account. Creator media kit profiles are public by design — that\'s their purpose. All data is encrypted at rest and in transit.',
  },
  {
    q: 'What happens when the 14-day trial ends?',
    a: "You'll be asked to enter a card and pay $19/mo. No charges happen during the trial, no auto-billing, no surprise at day 15. You keep full access to everything you've built.",
  },
  {
    q: 'Is it really free for creators forever?',
    a: "Yes. Creator profiles, deal tracker, invoice generator, and e-sign are free forever. No credit card, no time limit, no hidden tiers. We make money from brands — creators are always free.",
  },
]

const PRICING_INCLUDES = [
  ['Unlimited contacts & notes', 'Contract generator + e-sign', '14-day free trial'],
  ['Unlimited campaigns', 'Content deadline tracking', 'Cancel anytime'],
  ['Creator discovery', 'Payment log', 'Your data, always exportable'],
]

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
      {FAQS.map(({ q, a }, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center justify-between w-full px-6 py-5 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="font-medium text-foreground pr-4">{q}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className={`grid transition-all duration-200 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-brand-dark/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-display font-bold text-xl tracking-tight text-white">influencr</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-brand text-brand-foreground px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-brand-dark pt-36 pb-28 px-6 overflow-hidden">
        <VideoBg />
        <div className="absolute inset-0 bg-brand-dark/60" aria-hidden="true" />
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-16 items-start">
          <div>
            <FadeUp delay={0}>
              <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-sm text-white/60 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                Creators get free tools forever
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.04] tracking-tight">
                The influencer<br />
                <span className="text-brand">operating system.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.18}>
              <p className="mt-6 text-lg text-white/55 max-w-xl leading-relaxed">
                CRM, campaigns, contracts, content approvals, and payments — all in one place. Built for teams replacing their spreadsheet + DocuSign setup. $19/mo.
              </p>
            </FadeUp>

            <FadeUp delay={0.27} className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                href="/signup?type=brand"
                className="flex items-center justify-center gap-2 bg-brand text-brand-foreground px-7 py-3.5 rounded-lg text-base font-bold hover:brightness-110 transition-all"
              >
                Start free trial <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup?type=creator"
                className="flex items-center justify-center gap-2 border border-white/20 text-white/75 px-7 py-3.5 rounded-lg text-base font-medium hover:border-white/40 hover:text-white transition-all"
              >
                I&apos;m a creator
              </Link>
            </FadeUp>

            <FadeUp delay={0.33}>
              <p className="mt-4 text-sm text-white/35">No credit card required. 14-day free trial.</p>
            </FadeUp>
          </div>

          {/* Competitor stack card */}
          <FadeUp delay={0.22}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-2">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
                What you&apos;re replacing
              </p>
              <div className="space-y-0">
                {STACK.map(({ name, price }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2.5 border-b border-white/8 last:border-0"
                  >
                    <span className="text-sm text-white/35 line-through">{name}</span>
                    <span className="text-sm text-white/25 line-through">{price}/mo</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand/30">
                <span className="text-sm font-bold text-white">influencr</span>
                <span className="text-sm font-extrabold text-brand">$19/mo</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-y border-border bg-muted/50 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {[
            '14-day free trial',
            'No credit card required',
            'Cancel anytime',
            'Your data, always exportable',
          ].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check size={13} className="text-brand shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Two-sided value props */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <InView>
            <div className="grid lg:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
              <div className="bg-card p-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-5">
                  For brands · $19/mo
                </p>
                <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                  Run your entire influencer program
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Contacts, campaigns, contracts, content approvals, payments. Replace your stack in 10 minutes.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {BRAND_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check size={14} className="text-brand shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-4">
                  <Link
                    href="/signup?type=brand"
                    className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                  >
                    Start free trial <ArrowRight size={14} />
                  </Link>
                  <Link href="/demo/brand" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    See demo →
                  </Link>
                </div>
              </div>

              <div className="bg-card p-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/35 mb-5">
                  For creators · Free forever
                </p>
                <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                  Your professional deal HQ
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Public media kit, deal tracker, invoice generator, e-sign contracts. Manage deals like a business.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {CREATOR_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                      <Check size={14} className="text-foreground/35 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-4">
                  <Link
                    href="/signup?type=creator"
                    className="inline-flex items-center gap-2 border border-border text-foreground/65 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-foreground/35 hover:text-foreground transition-all"
                  >
                    Create free profile <ArrowRight size={14} />
                  </Link>
                  <Link href="/demo/creator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    See example →
                  </Link>
                </div>
              </div>
            </div>
          </InView>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <InView>
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">Set up in 10 minutes.</h2>
            <p className="text-muted-foreground text-lg mb-16">Running your first campaign by end of day.</p>
          </InView>
          <div className="grid lg:grid-cols-3 gap-0 lg:divide-x divide-border">
            {HOW_IT_WORKS.map(({ n, title, body }, i) => (
              <InView key={n} delay={i * 0.08} className="px-0 lg:px-10 first:pl-0 last:pr-0 pb-10 lg:pb-0 border-b lg:border-b-0 border-border last:border-0">
                <span className="font-mono text-3xl font-bold text-brand/40 mb-5 block">{n}</span>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <InView>
            <h2 className="font-display text-4xl font-bold text-foreground mb-16 max-w-xl">
              Six tools. One subscription. Zero bloat.
            </h2>
          </InView>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {FEATURES.map(({ n, title, body }, i) => (
              <InView key={n} delay={i * 0.05}>
                <span className="font-mono text-xs text-brand/60 mb-3 block">{n}</span>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* Creator spotlight */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <InView className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold text-foreground mb-2">Creators build free media kits.</h2>
              <p className="text-muted-foreground text-lg">Brands on influencr find and contact them directly.</p>
            </div>
            <Link
              href="/demo/creator"
              className="shrink-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See a full example →
            </Link>
          </InView>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {SPOTLIGHT_CREATORS.map((c, i) => (
              <InView key={c.name} delay={i * 0.07}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-brand/40 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-sm font-bold text-brand font-display shrink-0">
                      {c.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {c.niches.map((n) => (
                          <span key={n} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{c.platform}</p>
                      <p className="font-bold text-foreground font-display">{c.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Engagement</p>
                      <p className="font-bold text-brand font-display">{c.engagement}</p>
                    </div>
                  </div>
                </div>
              </InView>
            ))}
          </div>
          <InView className="text-center">
            <Link
              href="/signup?type=creator"
              className="inline-flex items-center gap-2 border border-border text-foreground/65 px-6 py-3 rounded-lg text-sm font-medium hover:border-foreground/35 hover:text-foreground transition-all"
            >
              Are you a creator? Get your free profile <ArrowRight size={14} />
            </Link>
          </InView>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <InView className="mb-12">
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">Everything you&apos;re wondering.</h2>
            <p className="text-muted-foreground text-lg">Honest answers, no fluff.</p>
          </InView>
          <InView>
            <FaqAccordion />
          </InView>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-24 px-6 bg-brand-dark overflow-hidden">
        <BlobBg />
        <div className="relative z-10 max-w-6xl mx-auto">
          <InView>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
              <div>
                <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-white mb-3">
                  One price. Everything included.
                </h2>
                <p className="text-white/50 text-lg">No tiers. No seat fees. No gotchas.</p>
              </div>

              <div className="flex items-end gap-3 shrink-0">
                <span className="font-display text-8xl font-extrabold text-white leading-none">$19</span>
                <div className="pb-2">
                  <span className="text-white/50 text-lg">/mo</span>
                  <p className="text-sm text-white/35 mt-0.5">billed monthly</p>
                </div>
              </div>

              <Link
                href="/signup?type=brand"
                className="shrink-0 bg-brand text-brand-foreground px-8 py-4 rounded-lg text-base font-bold hover:brightness-110 transition-all"
              >
                Start 14-day free trial
              </Link>
            </div>

            {/* What's included grid */}
            <div className="mt-12 pt-12 border-t border-white/10">
              <div className="grid sm:grid-cols-3 gap-y-3 gap-x-8">
                {PRICING_INCLUDES.flat().map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check size={13} className="text-brand/70 shrink-0" />
                    <span className="text-sm text-white/45">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 text-sm text-white/20 text-center">
              Compare: MightyScout $99/mo · Grin $299+/mo · Aspire $500+/mo · DocuSign $45+/mo
            </div>
          </InView>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-foreground">influencr</span>
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} influencr. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
