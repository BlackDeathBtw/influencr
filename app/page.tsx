import Link from 'next/link'
import { Users, BarChart3, Calendar, CreditCard, Check, ArrowRight, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight">influencr</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-zinc-50">
        <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-1.5 text-sm text-zinc-600 mb-8">
          <Zap size={14} className="text-amber-500" />
          Influencer CRM at $19/mo — not $99
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 max-w-3xl leading-tight">
          Manage influencers without the enterprise price tag
        </h1>
        <p className="mt-6 text-xl text-zinc-500 max-w-2xl">
          Track contacts, campaigns, content deadlines, and payments in one place.
          Everything MightyScout and Grin charge $99–$500/mo for — at $19/mo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-700 transition-colors"
          >
            Start 14-day free trial <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 px-8 py-3.5 rounded-lg text-base font-medium hover:bg-zinc-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-400">No credit card required. Cancel anytime.</p>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center text-zinc-900 mb-4">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="text-center text-zinc-500 mb-14 max-w-xl mx-auto">
          Built for DTC brands and agencies managing 10–100 influencers. No bloat, no upsells.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: 'Influencer contacts',
              desc: 'Store profiles, handles, niches, follower counts, and contact details. Never lose a contact in a spreadsheet again.',
            },
            {
              icon: BarChart3,
              title: 'Campaign tracker',
              desc: 'Create campaigns, add influencers, track deals and fees. See exactly who is confirmed, negotiating, or declined.',
            },
            {
              icon: Calendar,
              title: 'Content deadlines',
              desc: 'Track every deliverable — posts, stories, reels, videos. Set due dates and watch them move from briefed to posted.',
            },
            {
              icon: CreditCard,
              title: 'Payment log',
              desc: 'Log influencer fees, due dates, and mark payments as paid. See pending vs overdue at a glance.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-zinc-200 bg-white">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-zinc-700" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">Simple pricing</h2>
          <p className="text-zinc-500 mb-10">One plan. Everything included. No gotchas.</p>
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-6xl font-bold text-zinc-900">$19</span>
              <span className="text-zinc-500 mb-3">/mo</span>
            </div>
            <p className="text-zinc-500 text-sm mb-8">Everything included. Billed monthly.</p>
            <ul className="text-left space-y-3 mb-8">
              {[
                'Unlimited influencer contacts',
                'Unlimited campaigns',
                'Content deadline tracking',
                'Payment log',
                'CSV export',
                '14-day free trial',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-700">
                  <Check size={16} className="text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full bg-zinc-900 text-white text-center py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
            >
              Start 14-day free trial
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-400">
            Compare: MightyScout $99/mo · Grin $299+/mo · Aspire $500+/mo
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 px-6 text-center text-sm text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-zinc-700">influencr</span>
          <span>© {new Date().getFullYear()} influencr. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-zinc-600">Login</Link>
            <Link href="/signup" className="hover:text-zinc-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
