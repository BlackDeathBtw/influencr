'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { BlobBg } from '@/components/animated-bg'

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
        <BlobBg />
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
                CRM, campaigns, contracts, content approvals, and payments in one place.
                Everything the $99–$500/mo tools do, at $19/mo.
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
                <Link
                  href="/signup?type=brand"
                  className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-5 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                >
                  Start free trial <ArrowRight size={14} />
                </Link>
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
                <Link
                  href="/signup?type=creator"
                  className="inline-flex items-center gap-2 border border-border text-foreground/65 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-foreground/35 hover:text-foreground transition-all"
                >
                  Create free profile <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </InView>
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

            <div className="mt-12 pt-12 border-t border-white/10 text-sm text-white/30 text-center">
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
