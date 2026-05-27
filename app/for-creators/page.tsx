import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, BarChart3, CreditCard, Check, ArrowRight, Store, PenLine } from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Creators — influencr',
  description:
    'Your media kit, invoices, and deals — all free. Create your free influencr profile and start landing brand deals.',
}

const features = [
  {
    icon: Store,
    title: 'Opportunities',
    description:
      'Browse brand deals, affiliate programs, and collabs posted directly by brands. Apply in seconds — no agency, no middleman.',
  },
  {
    icon: FileText,
    title: 'Media Kit',
    description:
      'Get a shareable /c/yourname page that brands can actually find. Show your stats, niches, and rates in one place.',
  },
  {
    icon: PenLine,
    title: 'E-sign + Invoicing',
    description:
      'Draw your real signature on brand contracts. Send professional invoices. Track what you\'re owed and when you get paid.',
  },
  {
    icon: BarChart3,
    title: 'Deal Tracker',
    description:
      'See every brand deal at a glance — what stage it\'s in, what you\'re owed, and what\'s been paid. No spreadsheet needed.',
  },
]

const freeItems = [
  'Opportunities marketplace — browse & apply',
  'Media kit page at /c/yourname',
  'Deal tracker kanban',
  'Invoice generator',
  'E-sign contracts with drawn signature',
  'Free forever — no credit card',
]

export default function ForCreatorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-foreground">
            influencr
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup?type=creator"
              className="bg-brand text-brand-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Join free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
          Find deals, sign contracts, get paid — all free.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
          Browse brand opportunities, showcase your media kit, send invoices, and e-sign contracts. Everything you need to run your creator business — at zero cost, forever.
        </p>
        <Link
          href="/signup?type=creator"
          className="mt-8 inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold text-base px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Create your free profile
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                <Icon size={20} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free forever checklist */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            Free forever
          </h2>
          <ul className="space-y-3">
            {freeItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center">
                  <Check size={12} className="text-brand" />
                </span>
                <span className="text-foreground text-sm">{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/signup?type=creator"
            className="mt-8 inline-flex items-center gap-2 bg-foreground/90 text-background font-semibold text-sm px-6 py-3 rounded-xl hover:bg-foreground transition-colors"
          >
            Get started — it&apos;s free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-display text-sm font-bold text-foreground">
            influencr
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
