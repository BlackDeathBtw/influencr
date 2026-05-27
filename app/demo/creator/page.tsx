import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText, PenLine, BarChart3, Store, DollarSign, Percent, Users } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Creator Profile Demo — Free Media Kit by influencr',
  description:
    'See an example influencer media kit built with influencr. Creators get a free public profile at /c/username with stats, brand testimonials, platform data, and a professional deal HQ.',
  openGraph: {
    title: 'Creator Media Kit Demo — influencr',
    description:
      'Free media kit and profile page for content creators. Showcase your stats, past brand collaborations, and testimonials. Get your own /c/username link free.',
  },
}

const CREATOR = {
  name: 'Alex Rivera',
  username: 'alexrivera',
  bio: 'Lifestyle and travel creator based in New York. 5 years creating content, 30+ brand collaborations. I believe in authentic storytelling — every post reflects something I actually use and love.',
  niches: ['Lifestyle', 'Travel', 'Fitness', 'Food & Drink'],
  rate: '$800 – $2,500',
  location: 'New York, NY',
  platforms: [
    { name: 'Instagram', handle: '@alexrivera', followers: '84.2K', engagement: '4.8%' },
    { name: 'TikTok', handle: '@alexrivera', followers: '210K', engagement: '6.2%' },
    { name: 'YouTube', handle: 'Alex Rivera', followers: '12.4K', engagement: '3.1%' },
  ],
  brands: ['Airbnb', 'Nike Running', 'HelloFresh', 'Ritual Vitamins', 'Headspace', 'Away Luggage', 'Oura Ring', 'AG1'],
  testimonials: [
    {
      brand: 'HelloFresh',
      quote: "Alex's content drove a 34% higher CTR than our average influencer posts. Her audience genuinely engages.",
      person: 'Jamie L., Partnerships Manager',
    },
    {
      brand: 'Headspace',
      quote: "Seamless to work with. Delivered ahead of deadline, nailed the brief on first draft. Will work with again.",
      person: 'Priya S., Brand Partnerships',
    },
  ],
}

function IgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function TikTokIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.82 1.56V6.8a4.85 4.85 0 01-1.05-.11z"/>
    </svg>
  )
}

function YtIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.2.7 11.5v2.1c0 2.3.3 4.5.3 4.5s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 22.3 12 22.3 12 22.3s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.5v-2.1C23.3 9.2 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
    </svg>
  )
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram: IgIcon,
  TikTok: TikTokIcon,
  YouTube: YtIcon,
}

const TYPE_COLORS_DEMO: Record<string, string> = {
  brand_deal: 'bg-blue-100 text-blue-700',
  affiliate: 'bg-green-100 text-green-700',
  collab: 'bg-purple-100 text-purple-700',
}
const TYPE_LABELS_DEMO: Record<string, string> = {
  brand_deal: 'Brand Deal',
  affiliate: 'Affiliate',
  collab: 'Collab',
}

async function DemoOpportunities() {
  let deals: Array<{
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
    apply_url: string
    is_featured: boolean
  }> = []

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data } = await supabase
      .from('brand_deals')
      .select('id,brand_name,logo_url,title,type,commission_rate,budget_min,budget_max,min_followers,niches,apply_url,is_featured')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('scraped_at', { ascending: false })
      .limit(3)
    deals = data ?? []
  } catch {
    // fall back to empty — page still renders
  }

  if (deals.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Browse opportunities</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Real brand deals and affiliate programs — apply directly, no agency needed
      </p>
      <div className="space-y-3">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className={`bg-card border rounded-xl p-5 flex items-start gap-4 ${
              deal.is_featured ? 'border-brand/30' : 'border-border'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    TYPE_COLORS_DEMO[deal.type] ?? 'bg-muted text-muted-foreground'
                  }`}
                >
                  {TYPE_LABELS_DEMO[deal.type] ?? deal.type}
                </span>
                {deal.is_featured && (
                  <span className="text-xs text-amber-600 font-medium">★ Featured</span>
                )}
                <span className="text-xs text-muted-foreground">{deal.brand_name}</span>
              </div>
              <p className="font-semibold text-foreground text-sm">{deal.title}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {deal.commission_rate != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent size={11} />
                    {deal.commission_rate}% commission
                  </span>
                )}
                {deal.budget_min != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign size={11} />${deal.budget_min.toLocaleString()}
                    {deal.budget_max ? `–$${deal.budget_max.toLocaleString()}` : '+'}
                  </span>
                )}
                {deal.min_followers != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={11} />
                    {deal.min_followers >= 1000
                      ? `${(deal.min_followers / 1000).toFixed(0)}K`
                      : deal.min_followers}
                    + followers
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {deal.niches.map((n) => (
                  <span
                    key={n}
                    className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={deal.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium bg-foreground/90 text-background px-3 py-1.5 rounded-lg hover:bg-foreground transition-colors"
            >
              Apply →
            </a>
          </div>
        ))}
      </div>
      <Link
        href="/signup?type=creator"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        See all opportunities <ArrowRight size={13} />
      </Link>
    </section>
  )
}

export default function CreatorDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg tracking-tight text-foreground">
            influencr
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-foreground/8 text-muted-foreground font-medium px-2.5 py-1 rounded-full border border-border">
              Creator profile demo
            </span>
            <Link
              href="/signup?type=creator"
              className="text-sm bg-foreground text-background px-4 py-1.5 rounded-lg font-semibold hover:bg-foreground/90 transition-colors"
            >
              Create yours free
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Demo banner */}
        <div className="mb-10 bg-foreground/5 border border-border rounded-xl px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            This is a <strong className="text-foreground">demo creator profile</strong>. Real creators get their own URL like{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">influencr.app/c/username</code>
          </p>
          <Link
            href="/signup?type=creator"
            className="shrink-0 flex items-center gap-1.5 bg-foreground text-background px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors"
          >
            Get yours <ArrowRight size={13} />
          </Link>
        </div>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-8 mb-12">
          <div className="w-24 h-24 rounded-2xl bg-brand/20 flex items-center justify-center shrink-0 text-3xl font-bold text-brand font-display">
            {CREATOR.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground">{CREATOR.name}</h1>
              <span className="text-muted-foreground font-mono text-sm">/{CREATOR.username}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-1">{CREATOR.location}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {CREATOR.niches.map((n) => (
                <span key={n} className="text-xs font-medium bg-muted text-foreground/70 px-3 py-1 rounded-full border border-border">
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground mb-1">Starting rate</p>
            <p className="font-display text-2xl font-bold text-foreground">{CREATOR.rate}</p>
            <p className="text-xs text-muted-foreground">per post</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-12">
          <p className="text-foreground/80 leading-relaxed max-w-2xl">{CREATOR.bio}</p>
        </div>

        {/* Platforms */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Platforms</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {CREATOR.platforms.map((p) => {
              const Icon = PLATFORM_ICONS[p.name] ?? IgIcon
              return (
                <div key={p.name} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-foreground/8 rounded-lg flex items-center justify-center">
                      <Icon size={17} className="text-foreground/70" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.handle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xl font-bold font-display text-foreground">{p.followers}</p>
                      <p className="text-xs text-muted-foreground">followers</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold font-display text-brand">{p.engagement}</p>
                      <p className="text-xs text-muted-foreground">avg engagement</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Past brands */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Past collaborations</h2>
          <div className="flex flex-wrap gap-3">
            {CREATOR.brands.map((b) => (
              <div key={b} className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/80">
                {b}
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Brand testimonials</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {CREATOR.testimonials.map((t) => (
              <div key={t.brand} className="bg-card border border-border rounded-xl p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">{t.brand}</p>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs text-muted-foreground">{t.person}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample invoice */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Sample invoice</h2>
          <div className="max-w-md bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Invoice</p>
                <p className="font-semibold text-foreground">Spring Campaign — HelloFresh</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600">Pending</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground mb-0.5">To</p><p className="text-foreground font-medium">HelloFresh</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Due date</p><p className="text-foreground">July 15, 2025</p></div>
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground mb-0.5">Total</p><p className="text-2xl font-bold text-foreground">$1,200</p></div>
              <p className="text-xs text-muted-foreground">1 Instagram Reel + story set</p>
            </div>
          </div>
        </section>

        {/* Opportunities — live from /api/brand-deals */}
        <DemoOpportunities />

        {/* Creator HQ */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-2">Your creator HQ</h2>
          <p className="text-sm text-muted-foreground mb-5">Everything you need to run your creator business — on one platform</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                <Store size={16} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Browse opportunities</h3>
              <p className="text-sm text-muted-foreground">Brand deals, affiliates, and collabs posted directly by brands.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                <FileText size={16} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Send invoices</h3>
              <p className="text-sm text-muted-foreground">Create and send professional invoices. Track payment status in one place.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                <PenLine size={16} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Sign contracts</h3>
              <p className="text-sm text-muted-foreground">E-sign brand contracts with a drawn signature. Full audit trail included.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 size={16} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Track earnings</h3>
              <p className="text-sm text-muted-foreground">See all pending and paid invoices. Know exactly what you&apos;re owed.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-brand-dark rounded-2xl p-10 text-center relative overflow-hidden">
          <h3 className="font-display text-2xl font-bold text-white mb-2">Build your own media kit</h3>
          <p className="text-white/50 mb-7">Free forever. Share one link with every brand you pitch.</p>
          <Link
            href="/signup?type=creator"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-7 py-3 rounded-lg text-base font-bold hover:brightness-110 transition-all"
          >
            Create free profile <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </div>
  )
}
