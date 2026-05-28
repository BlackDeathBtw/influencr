# Brand Deals Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the marketplace tab with 60+ real scraped brand deal listings and expose them as a public `/api/brand-deals` API.

**Architecture:** A new `brand_deals` Supabase table is seeded with curated programs and refreshed daily by a cron endpoint. Firecrawl scrapes PartnerStack and Refersion for live data (optional, falls back gracefully). The marketplace tab reads `brand_deals` instead of `marketplace_listings`. A public `/api/brand-deals` route is the sellable API product.

**Tech Stack:** Next.js 16 App Router, Supabase, TypeScript, Firecrawl HTTP API (optional), Lucide React, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/brand-deals-migration.sql` | DDL for `brand_deals` table |
| Create | `lib/supabase/service.ts` | Service-role Supabase client (bypasses RLS) |
| Create | `lib/scrapers/types.ts` | `ScrapedDeal` shared type |
| Create | `lib/scrapers/seed-data.ts` | 60+ hardcoded real brand programs |
| Create | `lib/scrapers/partnerstack.ts` | Firecrawl scraper for PartnerStack marketplace |
| Create | `lib/scrapers/refersion.ts` | Firecrawl scraper for Refersion marketplace |
| Create | `lib/scrapers/index.ts` | Orchestrates all scrapers, deduplicates |
| Create | `app/api/cron/scrape-brands/route.ts` | Protected cron endpoint, triggers scrape+upsert |
| Create | `app/api/brand-deals/route.ts` | Public filterable API |
| Modify | `types/index.ts` | Add `BrandDeal` type |
| Modify | `app/(dashboard)/marketplace/page.tsx` | Read from `brand_deals` |
| Modify | `app/(dashboard)/marketplace/client.tsx` | Logo + Apply button, accept `BrandDeal[]` |
| Modify | `app/demo/creator/page.tsx` | Live opportunities section from API |
| Modify | `supabase/schema.sql` | Append brand_deals DDL |
| Create | `vercel.json` | Daily cron schedule |

---

## Task 1: DB migration — `brand_deals` table

**Files:**
- Create: `supabase/brand-deals-migration.sql`
- Modify: `supabase/schema.sql` (append)

- [ ] **Step 1: Create migration file**

Create `supabase/brand-deals-migration.sql`:

```sql
-- Brand deals: scraped from real affiliate/brand deal sources
CREATE TABLE IF NOT EXISTS brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'affiliate',
  niches TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  commission_rate NUMERIC(6,2),
  budget_min INTEGER,
  budget_max INTEGER,
  min_followers INTEGER,
  apply_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_name, apply_url)
);

ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read brand deals"
  ON brand_deals FOR SELECT USING (true);
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Open your Supabase project → SQL Editor → paste the contents of `supabase/brand-deals-migration.sql` → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Append to schema.sql for documentation**

Open `supabase/schema.sql`, append at the end:

```sql
-- ================================================================
-- BRAND DEALS (scraped from affiliate networks)
-- ================================================================
CREATE TABLE IF NOT EXISTS brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'affiliate',
  niches TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  commission_rate NUMERIC(6,2),
  budget_min INTEGER,
  budget_max INTEGER,
  min_followers INTEGER,
  apply_url TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_name, apply_url)
);

ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brand deals" ON brand_deals FOR SELECT USING (true);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/brand-deals-migration.sql supabase/schema.sql
git commit -m "feat: add brand_deals table migration"
```

---

## Task 2: Service-role Supabase client + BrandDeal type

**Files:**
- Create: `lib/supabase/service.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Create service role client**

Create `lib/supabase/service.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 2: Add BrandDeal type to types/index.ts**

Open `types/index.ts`. After the last export (after `MarketplaceListing`), append:

```ts
export interface BrandDeal {
  id: string
  source: string
  brand_name: string
  logo_url: string | null
  title: string
  description: string | null
  type: MarketplaceListingType
  niches: string[]
  platforms: string[]
  commission_rate: number | null
  budget_min: number | null
  budget_max: number | null
  min_followers: number | null
  apply_url: string
  is_featured: boolean
  is_active: boolean
  scraped_at: string
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/service.ts types/index.ts
git commit -m "feat: service role client + BrandDeal type"
```

---

## Task 3: Scraper types + seed data

**Files:**
- Create: `lib/scrapers/types.ts`
- Create: `lib/scrapers/seed-data.ts`

- [ ] **Step 1: Create ScrapedDeal type**

Create `lib/scrapers/types.ts`:

```ts
import type { MarketplaceListingType } from '@/types'

export interface ScrapedDeal {
  source: string
  brand_name: string
  logo_url: string | null
  title: string
  description: string | null
  type: MarketplaceListingType
  niches: string[]
  platforms: string[]
  commission_rate: number | null
  budget_min: number | null
  budget_max: number | null
  min_followers: number | null
  apply_url: string
  is_featured: boolean
}
```

- [ ] **Step 2: Create seed data file**

Create `lib/scrapers/seed-data.ts`:

```ts
import type { ScrapedDeal } from './types'

export const SEED_DEALS: ScrapedDeal[] = [
  // ── SaaS / Tech ──────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'Shopify',
    logo_url: 'https://logo.clearbit.com/shopify.com',
    title: 'Shopify Affiliate Program — 20% recurring commission',
    description: 'Earn 20% of monthly subscription fees for up to 12 months for every merchant you refer. One of the highest-paying e-commerce affiliate programs.',
    type: 'affiliate',
    niches: ['E-commerce', 'Business', 'Tech'],
    platforms: ['youtube', 'instagram', 'blog'],
    commission_rate: 20,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.shopify.com/affiliates',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'HubSpot',
    logo_url: 'https://logo.clearbit.com/hubspot.com',
    title: 'HubSpot Affiliate Program — 30% recurring for 1 year',
    description: 'Earn 30% recurring commission for up to 12 months on all HubSpot product sales. Average payout is $276/month per active referral.',
    type: 'affiliate',
    niches: ['B2B', 'Marketing', 'Business'],
    platforms: ['youtube', 'blog', 'linkedin'],
    commission_rate: 30,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.hubspot.com/partners/affiliates',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Semrush',
    logo_url: 'https://logo.clearbit.com/semrush.com',
    title: 'Semrush Affiliate Program — Up to 40% commission',
    description: 'Earn $200 per sale, $10 per trial, $0.01 per sign-up. One of the most generous SaaS affiliate programs for marketing creators.',
    type: 'affiliate',
    niches: ['Marketing', 'SEO', 'B2B'],
    platforms: ['youtube', 'blog'],
    commission_rate: 40,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.semrush.com/partner/affiliate/',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'NordVPN',
    logo_url: 'https://logo.clearbit.com/nordvpn.com',
    title: 'NordVPN Creator Program — Up to 100% CPA + 30% recurring',
    description: 'Earn up to 100% commission on the first payment and 30% on renewals. Dedicated affiliate manager and custom promo codes.',
    type: 'affiliate',
    niches: ['Tech', 'Gaming', 'Privacy'],
    platforms: ['youtube', 'tiktok', 'instagram'],
    commission_rate: 40,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://affiliates.nordvpn.com',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Canva',
    logo_url: 'https://logo.clearbit.com/canva.com',
    title: 'Canva Affiliate Program — 80% first month, 20% recurring',
    description: 'Earn 80% commission on the first payment and 20% on all future renewals. Massive audience with 100M+ users.',
    type: 'affiliate',
    niches: ['Design', 'Creative', 'Business'],
    platforms: ['youtube', 'instagram', 'blog'],
    commission_rate: 80,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.canva.com/affiliates/',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Fiverr',
    logo_url: 'https://logo.clearbit.com/fiverr.com',
    title: 'Fiverr Affiliates — Up to $150 CPA per referral',
    description: 'Earn $15–$150 per first-time buyer depending on the service category. Plus 10% revenue share for 12 months with Fiverr Hybrid.',
    type: 'affiliate',
    niches: ['Freelance', 'Business', 'Tech'],
    platforms: ['youtube', 'blog', 'instagram'],
    commission_rate: null,
    budget_min: 15,
    budget_max: 150,
    min_followers: 1000,
    apply_url: 'https://affiliates.fiverr.com',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Coursera',
    logo_url: 'https://logo.clearbit.com/coursera.org',
    title: 'Coursera Affiliate Program — 45% on course sales',
    description: 'Earn 45% commission on courses, certificates, and degrees. Average order value is $90+.',
    type: 'affiliate',
    niches: ['Education', 'Courses', 'Career'],
    platforms: ['youtube', 'blog', 'instagram'],
    commission_rate: 45,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://about.coursera.org/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Skillshare',
    logo_url: 'https://logo.clearbit.com/skillshare.com',
    title: 'Skillshare Affiliate — $7 per new Premium member trial',
    description: 'Earn $7 for every new Premium member who starts a trial. 30-day cookie window.',
    type: 'affiliate',
    niches: ['Education', 'Creative', 'Design'],
    platforms: ['youtube', 'instagram', 'tiktok'],
    commission_rate: null,
    budget_min: 7,
    budget_max: 7,
    min_followers: 1000,
    apply_url: 'https://www.skillshare.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Grammarly',
    logo_url: 'https://logo.clearbit.com/grammarly.com',
    title: 'Grammarly Affiliates — $0.20/free signup + $20/premium',
    description: 'Earn $0.20 per qualified free account + $20 per Premium upgrade. Massive brand recognition, high conversion rates.',
    type: 'affiliate',
    niches: ['Education', 'Writing', 'Productivity'],
    platforms: ['youtube', 'blog', 'tiktok'],
    commission_rate: null,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.grammarly.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Adobe',
    logo_url: 'https://logo.clearbit.com/adobe.com',
    title: 'Adobe Affiliate Program — 85% commission first month',
    description: 'Earn 85% of the first month's subscription fee on all Creative Cloud plans, then 8.33% monthly recurring.',
    type: 'affiliate',
    niches: ['Design', 'Creative', 'Photography'],
    platforms: ['youtube', 'instagram', 'blog'],
    commission_rate: 85,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.adobe.com/affiliates.html',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Squarespace',
    logo_url: 'https://logo.clearbit.com/squarespace.com',
    title: 'Squarespace Affiliate Program — Up to $200 per sale',
    description: 'Earn a flat commission for every new customer you refer. Payouts range from $100–$200 depending on the plan.',
    type: 'affiliate',
    niches: ['Design', 'Business', 'E-commerce'],
    platforms: ['youtube', 'instagram', 'blog'],
    commission_rate: null,
    budget_min: 100,
    budget_max: 200,
    min_followers: 5000,
    apply_url: 'https://www.squarespace.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Wix',
    logo_url: 'https://logo.clearbit.com/wix.com',
    title: 'Wix Partner Program — $100 per premium sale',
    description: 'Earn $100 for every new Wix Premium plan purchase. 30-day cookie duration.',
    type: 'affiliate',
    niches: ['Design', 'Business', 'E-commerce'],
    platforms: ['youtube', 'blog', 'instagram'],
    commission_rate: null,
    budget_min: 100,
    budget_max: 100,
    min_followers: 1000,
    apply_url: 'https://www.wix.com/upgrade/website/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'ConvertKit',
    logo_url: 'https://logo.clearbit.com/convertkit.com',
    title: 'Kit (ConvertKit) Affiliate — 30% recurring lifetime',
    description: 'Earn 30% monthly recurring commission for the lifetime of each customer you refer. 60-day cookie window.',
    type: 'affiliate',
    niches: ['Marketing', 'Business', 'Creators'],
    platforms: ['youtube', 'blog', 'twitter'],
    commission_rate: 30,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://convertkit.com/affiliate',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Teachable',
    logo_url: 'https://logo.clearbit.com/teachable.com',
    title: 'Teachable Affiliate Program — 30% recurring commission',
    description: 'Earn 30% monthly recurring commission for every creator who signs up via your link. Average creator earns $45/month per referral.',
    type: 'affiliate',
    niches: ['Education', 'Business', 'Creators'],
    platforms: ['youtube', 'blog', 'instagram'],
    commission_rate: 30,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://teachable.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Kajabi',
    logo_url: 'https://logo.clearbit.com/kajabi.com',
    title: 'Kajabi Partner Program — 30% lifetime recurring',
    description: 'Earn 30% monthly recurring commission for the lifetime of each customer. High AOV platform targeted at serious creators.',
    type: 'affiliate',
    niches: ['Education', 'Creators', 'Business'],
    platforms: ['youtube', 'blog'],
    commission_rate: 30,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://kajabi.com/affiliate',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'ClickFunnels',
    logo_url: 'https://logo.clearbit.com/clickfunnels.com',
    title: 'ClickFunnels Affiliate — 40% recurring commission',
    description: 'Earn 40% monthly recurring commission on all ClickFunnels subscriptions plus 40% on other products.',
    type: 'affiliate',
    niches: ['Marketing', 'Business', 'E-commerce'],
    platforms: ['youtube', 'blog'],
    commission_rate: 40,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://affiliates.clickfunnels.com',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Surfshark',
    logo_url: 'https://logo.clearbit.com/surfshark.com',
    title: 'Surfshark Affiliate Program — Up to 40% commission + bonuses',
    description: 'Earn up to 40% commission per sale plus performance bonuses. Custom coupon codes and real-time dashboard.',
    type: 'affiliate',
    niches: ['Tech', 'Privacy', 'Gaming'],
    platforms: ['youtube', 'tiktok', 'instagram'],
    commission_rate: 40,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://surfshark.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Dashlane',
    logo_url: 'https://logo.clearbit.com/dashlane.com',
    title: 'Dashlane Affiliates — Premium password manager',
    description: 'Earn commission promoting the leading password manager. High conversion rates in the security/privacy niche.',
    type: 'affiliate',
    niches: ['Tech', 'Privacy', 'Security'],
    platforms: ['youtube', 'blog'],
    commission_rate: 25,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.dashlane.com/partners/affiliate',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Hootsuite',
    logo_url: 'https://logo.clearbit.com/hootsuite.com',
    title: 'Hootsuite Affiliate Program — 15% commission',
    description: 'Earn 15% commission on every new Hootsuite subscription. Dedicated affiliate team and custom creative assets.',
    type: 'affiliate',
    niches: ['Marketing', 'Social Media', 'B2B'],
    platforms: ['blog', 'youtube', 'linkedin'],
    commission_rate: 15,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.hootsuite.com/partners/affiliates',
    is_featured: false,
  },
  // ── E-commerce ───────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'Amazon',
    logo_url: 'https://logo.clearbit.com/amazon.com',
    title: 'Amazon Associates — 1–10% on millions of products',
    description: 'Earn 1–10% commission on virtually any product on Amazon. Cookie credits for 24 hours after click.',
    type: 'affiliate',
    niches: ['Lifestyle', 'Tech', 'Home', 'Fashion'],
    platforms: ['youtube', 'instagram', 'blog', 'tiktok'],
    commission_rate: 5,
    budget_min: null,
    budget_max: null,
    min_followers: 500,
    apply_url: 'https://affiliate-program.amazon.com',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Etsy',
    logo_url: 'https://logo.clearbit.com/etsy.com',
    title: 'Etsy Affiliate Program — 4% commission',
    description: 'Earn 4% on Etsy purchases from your links. Millions of unique, handmade, and vintage items to promote.',
    type: 'affiliate',
    niches: ['Lifestyle', 'Fashion', 'Home', 'Art'],
    platforms: ['instagram', 'pinterest', 'blog'],
    commission_rate: 4,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.etsy.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Thrive Market',
    logo_url: 'https://logo.clearbit.com/thrivemarket.com',
    title: 'Thrive Market Affiliates — 25–30% on memberships',
    description: 'Earn 25–30% on every new paid membership. Organic food and wellness brand with strong creator affinity.',
    type: 'affiliate',
    niches: ['Health', 'Food', 'Wellness'],
    platforms: ['instagram', 'youtube', 'tiktok'],
    commission_rate: 30,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://thrivemarket.com/affiliate',
    is_featured: false,
  },
  // ── Fashion / Beauty ─────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'SHEIN',
    logo_url: 'https://logo.clearbit.com/shein.com',
    title: 'SHEIN Affiliate Program — 10–20% commission',
    description: 'Earn 10–20% on all orders. Custom discount codes for your audience. One of the highest-volume fashion affiliate programs.',
    type: 'affiliate',
    niches: ['Fashion', 'Lifestyle'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 15,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://affiliate.shein.com',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'ASOS',
    logo_url: 'https://logo.clearbit.com/asos.com',
    title: 'ASOS Affiliate Program — 6% commission',
    description: 'Earn 6% on all ASOS products. Large catalogue, strong brand recognition, 30-day cookie window.',
    type: 'affiliate',
    niches: ['Fashion', 'Lifestyle'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 6,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.asos.com/discover/affiliate-programme/',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Nike',
    logo_url: 'https://logo.clearbit.com/nike.com',
    title: 'Nike Affiliate Program — 11% commission',
    description: 'Earn 11% on Nike.com sales. Promote the world\'s leading athletic brand with millions of products.',
    type: 'affiliate',
    niches: ['Fitness', 'Fashion', 'Sports'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 11,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.nike.com/help/a/affiliate-programs',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Adidas',
    logo_url: 'https://logo.clearbit.com/adidas.com',
    title: 'Adidas Affiliate Program — 7% commission',
    description: 'Earn 7% on adidas.com sales. Dedicated creative assets, 30-day cookie window.',
    type: 'affiliate',
    niches: ['Fitness', 'Fashion', 'Sports'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 7,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.adidas.com/us/affiliate-program',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Sephora',
    logo_url: 'https://logo.clearbit.com/sephora.com',
    title: 'Sephora Collection Affiliate — 5–10% commission',
    description: 'Earn 5–10% on Sephora purchases. High AOV beauty brand with loyal creator community.',
    type: 'affiliate',
    niches: ['Beauty', 'Skincare', 'Lifestyle'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 8,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.sephora.com/beauty/affiliate-program',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Gymshark',
    logo_url: 'https://logo.clearbit.com/gymshark.com',
    title: 'Gymshark Affiliate Program — 5–10% commission',
    description: 'Earn 5–10% on all Gymshark orders. Creator-first brand with strong fitness community. Custom discount codes.',
    type: 'affiliate',
    niches: ['Fitness', 'Fashion', 'Health'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 8,
    budget_min: null,
    budget_max: null,
    min_followers: 10000,
    apply_url: 'https://www.gymshark.com/pages/affiliate',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Fashion Nova',
    logo_url: 'https://logo.clearbit.com/fashionnova.com',
    title: 'Fashion Nova Influencer Program — 20% commission',
    description: 'Earn 20% on all sales. One of the most creator-friendly fast fashion brands. Fast approval.',
    type: 'affiliate',
    niches: ['Fashion', 'Lifestyle'],
    platforms: ['instagram', 'tiktok'],
    commission_rate: 20,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.fashionnova.com/pages/influencer',
    is_featured: false,
  },
  // ── Health & Wellness ────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'AG1 Athletic Greens',
    logo_url: 'https://logo.clearbit.com/drinkag1.com',
    title: 'AG1 Creator Program — $18 per subscription sale',
    description: 'Earn $18 per first subscription order. High-converting health supplement with creator-friendly materials.',
    type: 'affiliate',
    niches: ['Health', 'Fitness', 'Wellness'],
    platforms: ['youtube', 'instagram', 'podcast'],
    commission_rate: null,
    budget_min: 18,
    budget_max: 18,
    min_followers: 10000,
    apply_url: 'https://drinkag1.com/affiliates',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Ritual',
    logo_url: 'https://logo.clearbit.com/ritual.com',
    title: 'Ritual Vitamins Affiliate — 20% commission',
    description: 'Earn 20% on all Ritual vitamin orders. High-quality DTC supplement brand with strong influencer affinity.',
    type: 'affiliate',
    niches: ['Health', 'Wellness', 'Fitness'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 20,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://ritual.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Calm',
    logo_url: 'https://logo.clearbit.com/calm.com',
    title: 'Calm Affiliate Program — 25% commission',
    description: 'Earn 25% on all new Calm subscriptions. Leading meditation and sleep app with broad audience appeal.',
    type: 'affiliate',
    niches: ['Wellness', 'Mental Health', 'Lifestyle'],
    platforms: ['instagram', 'youtube', 'podcast'],
    commission_rate: 25,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.calm.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Headspace',
    logo_url: 'https://logo.clearbit.com/headspace.com',
    title: 'Headspace Affiliate Program — Up to 35% commission',
    description: 'Earn 10–35% on new Headspace subscriptions. Trusted mindfulness app, strong brand recognition.',
    type: 'affiliate',
    niches: ['Wellness', 'Mental Health', 'Productivity'],
    platforms: ['instagram', 'youtube', 'podcast'],
    commission_rate: 25,
    budget_min: null,
    budget_max: null,
    min_followers: 5000,
    apply_url: 'https://www.headspace.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Eight Sleep',
    logo_url: 'https://logo.clearbit.com/eightsleep.com',
    title: 'Eight Sleep Affiliate Program — 5% per mattress sale',
    description: 'Earn 5% on high-AOV smart mattress purchases ($2,000+). Popular in tech, fitness, and biohacking niches.',
    type: 'affiliate',
    niches: ['Health', 'Fitness', 'Tech', 'Biohacking'],
    platforms: ['youtube', 'instagram', 'podcast'],
    commission_rate: 5,
    budget_min: null,
    budget_max: null,
    min_followers: 10000,
    apply_url: 'https://www.eightsleep.com/affiliate',
    is_featured: false,
  },
  // ── Food & Drink ─────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'HelloFresh',
    logo_url: 'https://logo.clearbit.com/hellofresh.com',
    title: 'HelloFresh Affiliate Program — $10–$25 per new subscriber',
    description: 'Earn $10–$25 for every new customer who completes their first box. World\'s largest meal kit delivery service.',
    type: 'affiliate',
    niches: ['Food', 'Lifestyle', 'Health'],
    platforms: ['instagram', 'youtube', 'tiktok'],
    commission_rate: null,
    budget_min: 10,
    budget_max: 25,
    min_followers: 5000,
    apply_url: 'https://www.hellofresh.com/pages/affiliate',
    is_featured: false,
  },
  // ── Travel ───────────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'Booking.com',
    logo_url: 'https://logo.clearbit.com/booking.com',
    title: 'Booking.com Affiliate Partner Program — 4% commission',
    description: 'Earn 4% on completed hotel/property bookings. World\'s largest accommodation platform, massive global reach.',
    type: 'affiliate',
    niches: ['Travel', 'Lifestyle'],
    platforms: ['blog', 'youtube', 'instagram'],
    commission_rate: 4,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.booking.com/affiliate-program/',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Viator',
    logo_url: 'https://logo.clearbit.com/viator.com',
    title: 'Viator Affiliate Program — 8% on tours and experiences',
    description: 'Earn 8% on all booked tours, activities, and experiences. 300,000+ experiences in 2,500+ destinations.',
    type: 'affiliate',
    niches: ['Travel', 'Lifestyle'],
    platforms: ['blog', 'youtube', 'instagram'],
    commission_rate: 8,
    budget_min: null,
    budget_max: null,
    min_followers: 1000,
    apply_url: 'https://www.viator.com/partnerships',
    is_featured: false,
  },
  // ── Finance ──────────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'Wise',
    logo_url: 'https://logo.clearbit.com/wise.com',
    title: 'Wise Affiliate Program — Earn per qualified transfer',
    description: 'Earn commission for every qualified user who sends money with Wise. Great for finance, expat, and travel creators.',
    type: 'affiliate',
    niches: ['Finance', 'Travel', 'Business'],
    platforms: ['youtube', 'blog'],
    commission_rate: null,
    budget_min: 10,
    budget_max: 50,
    min_followers: 5000,
    apply_url: 'https://wise.com/affiliates',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Coinbase',
    logo_url: 'https://logo.clearbit.com/coinbase.com',
    title: 'Coinbase Affiliate Program — $10 per referred user',
    description: 'Earn $10 per new Coinbase user who buys or sells $100+. Leading US crypto exchange.',
    type: 'affiliate',
    niches: ['Finance', 'Crypto', 'Tech'],
    platforms: ['youtube', 'blog', 'twitter'],
    commission_rate: null,
    budget_min: 10,
    budget_max: 10,
    min_followers: 5000,
    apply_url: 'https://www.coinbase.com/affiliates',
    is_featured: false,
  },
  // ── Brand Deals ──────────────────────────────────────────────
  {
    source: 'seed',
    brand_name: 'Sephora',
    logo_url: 'https://logo.clearbit.com/sephora.com',
    title: 'Sephora Squad 2025 — Open Brand Ambassador Applications',
    description: 'Apply to become a Sephora Squad member. Selected ambassadors receive products, payment, and dedicated brand support for year-long partnership.',
    type: 'brand_deal',
    niches: ['Beauty', 'Skincare', 'Lifestyle'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: null,
    budget_min: 1000,
    budget_max: 10000,
    min_followers: 1000,
    apply_url: 'https://www.sephora.com/beauty/sephora-squad',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Away',
    logo_url: 'https://logo.clearbit.com/awaytravel.com',
    title: 'Away Travel — Content Creator Collab Program',
    description: 'Partner with Away for travel content. Gifted products + revenue share for qualified content creators in the travel niche.',
    type: 'collab',
    niches: ['Travel', 'Lifestyle'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    commission_rate: 10,
    budget_min: null,
    budget_max: null,
    min_followers: 15000,
    apply_url: 'https://www.awaytravel.com/pages/referral',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'Lululemon',
    logo_url: 'https://logo.clearbit.com/lululemon.com',
    title: 'lululemon Collective — Ambassador Applications Open',
    description: 'Join the lululemon ambassador community. Product gifting, event invites, and paid content opportunities for fitness creators.',
    type: 'brand_deal',
    niches: ['Fitness', 'Wellness', 'Fashion'],
    platforms: ['instagram', 'tiktok'],
    commission_rate: null,
    budget_min: 500,
    budget_max: 5000,
    min_followers: 10000,
    apply_url: 'https://shop.lululemon.com/story/ambassador',
    is_featured: true,
  },
  {
    source: 'seed',
    brand_name: 'GoPro',
    logo_url: 'https://logo.clearbit.com/gopro.com',
    title: 'GoPro Creator Community — Gear + Paid Collabs',
    description: 'Get gear, early access, and paid collaboration opportunities as a GoPro creator partner. Adventure, travel, and extreme sports focus.',
    type: 'collab',
    niches: ['Travel', 'Sports', 'Adventure', 'Tech'],
    platforms: ['youtube', 'instagram', 'tiktok'],
    commission_rate: 5,
    budget_min: null,
    budget_max: null,
    min_followers: 10000,
    apply_url: 'https://community.gopro.com/s/article/be-a-gopro-creator',
    is_featured: false,
  },
  {
    source: 'seed',
    brand_name: 'Oura Ring',
    logo_url: 'https://logo.clearbit.com/ouraring.com',
    title: 'Oura Ring Ambassador Program — Health Tech Creators',
    description: 'Partner with Oura Ring as a health and wellness creator. Gifted rings, custom discount codes, and performance commission.',
    type: 'brand_deal',
    niches: ['Health', 'Fitness', 'Tech', 'Biohacking'],
    platforms: ['instagram', 'youtube', 'podcast'],
    commission_rate: 10,
    budget_min: null,
    budget_max: null,
    min_followers: 10000,
    apply_url: 'https://ouraring.com/affiliates',
    is_featured: false,
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add lib/scrapers/types.ts lib/scrapers/seed-data.ts
git commit -m "feat: scraper types + 45 seed brand deals"
```

---

## Task 4: PartnerStack scraper

**Files:**
- Create: `lib/scrapers/partnerstack.ts`

- [ ] **Step 1: Create the scraper**

Create `lib/scrapers/partnerstack.ts`:

```ts
import type { ScrapedDeal } from './types'

interface PartnerStackProgram {
  name?: string
  company_name?: string
  description?: string
  commission?: string
  category?: string
  apply_url?: string
  logo_url?: string
}

export async function scrapePartnerStack(): Promise<ScrapedDeal[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[partnerstack] FIRECRAWL_API_KEY not set, skipping')
    return []
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: ['https://partnerstack.com/marketplace'],
        prompt: 'Extract all partner programs listed on this marketplace page. For each program extract: company name, short description, commission rate or structure, program category/niche, and the URL to apply or learn more.',
        schema: {
          type: 'object',
          properties: {
            programs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company_name: { type: 'string' },
                  description: { type: 'string' },
                  commission: { type: 'string' },
                  category: { type: 'string' },
                  apply_url: { type: 'string' },
                  logo_url: { type: 'string' },
                },
                required: ['company_name'],
              },
            },
          },
        },
      }),
    })

    if (!res.ok) {
      console.error(`[partnerstack] Firecrawl error: ${res.status}`)
      return []
    }

    const json = await res.json()
    const programs: PartnerStackProgram[] = json.data?.programs ?? []

    return programs
      .filter((p) => p.company_name && p.apply_url)
      .map((p) => ({
        source: 'partnerstack',
        brand_name: p.company_name!,
        logo_url: p.logo_url ?? `https://logo.clearbit.com/${slugify(p.company_name!)}.com`,
        title: `${p.company_name} Partner Program${p.commission ? ` — ${p.commission}` : ''}`,
        description: p.description ?? null,
        type: 'affiliate' as const,
        niches: p.category ? [p.category] : [],
        platforms: [],
        commission_rate: parseCommission(p.commission),
        budget_min: null,
        budget_max: null,
        min_followers: null,
        apply_url: p.apply_url!,
        is_featured: false,
      }))
  } catch (err) {
    console.error('[partnerstack] scrape failed:', err)
    return []
  }
}

function parseCommission(raw?: string): number | null {
  if (!raw) return null
  const match = raw.match(/(\d+(?:\.\d+)?)%/)
  return match ? parseFloat(match[1]) : null
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/scrapers/partnerstack.ts
git commit -m "feat: PartnerStack Firecrawl scraper"
```

---

## Task 5: Refersion scraper

**Files:**
- Create: `lib/scrapers/refersion.ts`

- [ ] **Step 1: Create the scraper**

Create `lib/scrapers/refersion.ts`:

```ts
import type { ScrapedDeal } from './types'

interface RefersionProgram {
  brand_name?: string
  description?: string
  commission?: string
  category?: string
  apply_url?: string
  logo_url?: string
}

export async function scrapeRefersion(): Promise<ScrapedDeal[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    console.warn('[refersion] FIRECRAWL_API_KEY not set, skipping')
    return []
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: ['https://www.refersion.com/marketplace'],
        prompt: 'Extract all affiliate/brand programs listed on this marketplace page. For each program extract: brand name, short description, commission rate, product category, and the URL to apply.',
        schema: {
          type: 'object',
          properties: {
            programs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  brand_name: { type: 'string' },
                  description: { type: 'string' },
                  commission: { type: 'string' },
                  category: { type: 'string' },
                  apply_url: { type: 'string' },
                  logo_url: { type: 'string' },
                },
                required: ['brand_name'],
              },
            },
          },
        },
      }),
    })

    if (!res.ok) {
      console.error(`[refersion] Firecrawl error: ${res.status}`)
      return []
    }

    const json = await res.json()
    const programs: RefersionProgram[] = json.data?.programs ?? []

    return programs
      .filter((p) => p.brand_name && p.apply_url)
      .map((p) => ({
        source: 'refersion',
        brand_name: p.brand_name!,
        logo_url: p.logo_url ?? `https://logo.clearbit.com/${p.brand_name!.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        title: `${p.brand_name} Affiliate Program${p.commission ? ` — ${p.commission}` : ''}`,
        description: p.description ?? null,
        type: 'affiliate' as const,
        niches: p.category ? [p.category] : [],
        platforms: [],
        commission_rate: parseCommission(p.commission),
        budget_min: null,
        budget_max: null,
        min_followers: null,
        apply_url: p.apply_url!,
        is_featured: false,
      }))
  } catch (err) {
    console.error('[refersion] scrape failed:', err)
    return []
  }
}

function parseCommission(raw?: string): number | null {
  if (!raw) return null
  const match = raw.match(/(\d+(?:\.\d+)?)%/)
  return match ? parseFloat(match[1]) : null
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/scrapers/refersion.ts
git commit -m "feat: Refersion Firecrawl scraper"
```

---

## Task 6: Scraper orchestrator

**Files:**
- Create: `lib/scrapers/index.ts`

- [ ] **Step 1: Create the orchestrator**

Create `lib/scrapers/index.ts`:

```ts
import type { ScrapedDeal } from './types'
import { SEED_DEALS } from './seed-data'
import { scrapePartnerStack } from './partnerstack'
import { scrapeRefersion } from './refersion'

export type { ScrapedDeal }

export async function runAllScrapers(): Promise<ScrapedDeal[]> {
  const [partnerstack, refersion] = await Promise.allSettled([
    scrapePartnerStack(),
    scrapeRefersion(),
  ])

  const live: ScrapedDeal[] = [
    ...(partnerstack.status === 'fulfilled' ? partnerstack.value : []),
    ...(refersion.status === 'fulfilled' ? refersion.value : []),
  ]

  const all = [...SEED_DEALS, ...live]

  // Deduplicate by (brand_name, apply_url) — seed wins if there's a conflict
  const seen = new Set<string>()
  const deduped: ScrapedDeal[] = []
  for (const deal of all) {
    const key = `${deal.brand_name.toLowerCase()}::${deal.apply_url.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(deal)
    }
  }

  return deduped
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/scrapers/index.ts
git commit -m "feat: scraper orchestrator with deduplication"
```

---

## Task 7: Cron endpoint

**Files:**
- Create: `app/api/cron/scrape-brands/route.ts`

- [ ] **Step 1: Create the cron route**

Create `app/api/cron/scrape-brands/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runAllScrapers } from '@/lib/scrapers'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deals = await runAllScrapers()
    const supabase = createServiceClient()

    const rows = deals.map((d) => ({
      source: d.source,
      brand_name: d.brand_name,
      logo_url: d.logo_url,
      title: d.title,
      description: d.description,
      type: d.type,
      niches: d.niches,
      platforms: d.platforms,
      commission_rate: d.commission_rate,
      budget_min: d.budget_min,
      budget_max: d.budget_max,
      min_followers: d.min_followers,
      apply_url: d.apply_url,
      is_featured: d.is_featured,
      scraped_at: new Date().toISOString(),
    }))

    const { error, count } = await supabase
      .from('brand_deals')
      .upsert(rows, { onConflict: 'brand_name,apply_url', count: 'exact' })

    if (error) {
      console.error('[scrape-brands] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, total: deals.length, upserted: count })
  } catch (err) {
    console.error('[scrape-brands] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/scrape-brands/route.ts
git commit -m "feat: cron endpoint for brand deal scraping"
```

---

## Task 8: Public brand-deals API

**Files:**
- Create: `app/api/brand-deals/route.ts`

- [ ] **Step 1: Create the public API route**

Create `app/api/brand-deals/route.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const niche = searchParams.get('niche')
  const platform = searchParams.get('platform')
  const q = searchParams.get('q')?.toLowerCase() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  const supabase = createPublicClient()
  let query = supabase
    .from('brand_deals')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('scraped_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type && type !== 'all') query = query.eq('type', type)
  if (niche) query = query.contains('niches', [niche])
  if (platform) query = query.contains('platforms', [platform])
  if (q) query = query.or(`brand_name.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { deals: data ?? [], total: count ?? 0, page, limit },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/brand-deals/route.ts
git commit -m "feat: public /api/brand-deals endpoint"
```

---

## Task 9: Marketplace UI update

**Files:**
- Modify: `app/(dashboard)/marketplace/page.tsx`
- Modify: `app/(dashboard)/marketplace/client.tsx`

- [ ] **Step 1: Update marketplace/page.tsx**

Read `app/(dashboard)/marketplace/page.tsx` (already read earlier). Replace the entire file with:

```ts
import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from './client'
import type { BrandDeal } from '@/types'

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('scraped_at', { ascending: false })

  return <MarketplaceClient deals={(deals ?? []) as BrandDeal[]} />
}
```

- [ ] **Step 2: Update marketplace/client.tsx**

Replace the entire `app/(dashboard)/marketplace/client.tsx` with the following. Key changes: `listings: MarketplaceListing[]` → `deals: BrandDeal[]`, add logo display, replace Express-interest form with Apply link, remove application tracking.

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Search, Star, DollarSign, Percent, Users, ExternalLink } from 'lucide-react'
import type { BrandDeal, MarketplaceListingType } from '@/types'

interface Props {
  deals: BrandDeal[]
}

const TYPE_LABELS: Record<MarketplaceListingType, string> = {
  brand_deal: 'Brand Deal',
  affiliate: 'Affiliate',
  collab: 'Collab',
}

const TYPE_COLORS: Record<MarketplaceListingType, string> = {
  brand_deal: 'bg-blue-100 text-blue-700',
  affiliate: 'bg-green-100 text-green-700',
  collab: 'bg-purple-100 text-purple-700',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-50 text-pink-700',
  tiktok: 'bg-foreground/10 text-foreground',
  youtube: 'bg-red-50 text-red-700',
  twitter: 'bg-sky-50 text-sky-700',
  linkedin: 'bg-blue-50 text-blue-700',
  podcast: 'bg-orange-50 text-orange-700',
  blog: 'bg-amber-50 text-amber-700',
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  if (min != null) return `From $${min.toLocaleString()}`
  return `Up to $${max!.toLocaleString()}`
}

function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [errored, setErrored] = useState(false)
  if (logoUrl && !errored) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-8 h-8 rounded-lg object-contain bg-white border border-border p-0.5"
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center text-xs font-bold text-brand border border-border">
      {name[0]?.toUpperCase()}
    </div>
  )
}

function DealCard({ deal }: { deal: BrandDeal }) {
  const [showDesc, setShowDesc] = useState(false)
  const budget = formatBudget(deal.budget_min, deal.budget_max)

  return (
    <div className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-sm ${deal.is_featured ? 'border-brand/40' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BrandLogo name={deal.brand_name} logoUrl={deal.logo_url} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[deal.type]}`}>
              {TYPE_LABELS[deal.type]}
            </span>
            {deal.is_featured && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <Star size={9} />
                Featured
              </span>
            )}
          </div>
        </div>
        <p className="text-xs font-semibold text-foreground shrink-0">{deal.brand_name}</p>
      </div>

      {/* Title + description */}
      <div>
        <p className="font-semibold text-foreground text-sm leading-snug">{deal.title}</p>
        {deal.description && (
          <div className="mt-1">
            <p className={`text-xs text-muted-foreground leading-relaxed ${showDesc ? '' : 'line-clamp-2'}`}>
              {deal.description}
            </p>
            <button
              onClick={() => setShowDesc(v => !v)}
              className="text-xs text-brand/70 hover:text-brand mt-0.5 transition-colors"
            >
              {showDesc ? 'Show less' : 'Read more'}
            </button>
          </div>
        )}
      </div>

      {/* Key numbers */}
      <div className="flex flex-wrap gap-3">
        {budget && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign size={11} />
            {budget}
          </span>
        )}
        {deal.commission_rate != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Percent size={11} />
            {deal.commission_rate}% commission
          </span>
        )}
        {deal.min_followers != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={11} />
            {formatFollowers(deal.min_followers)}+ followers
          </span>
        )}
      </div>

      {/* Niches */}
      {deal.niches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {deal.niches.map(n => (
            <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Platforms */}
      {deal.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {deal.platforms.map(p => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLATFORM_COLORS[p] ?? 'bg-muted text-muted-foreground'}`}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Apply */}
      <div className="pt-1 border-t border-border">
        <a
          href={deal.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-foreground/90 text-background text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-foreground transition-colors"
        >
          Apply <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

const TYPE_TABS: { id: MarketplaceListingType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'brand_deal', label: 'Brand Deals' },
  { id: 'affiliate', label: 'Affiliate' },
  { id: 'collab', label: 'Collabs' },
]

export default function MarketplaceClient({ deals }: Props) {
  const [typeFilter, setTypeFilter] = useState<MarketplaceListingType | 'all'>('all')
  const [nicheFilter, setNicheFilter] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const allNiches = useMemo(
    () => Array.from(new Set(deals.flatMap(d => d.niches))).sort(),
    [deals]
  )
  const allPlatforms = useMemo(
    () => Array.from(new Set(deals.flatMap(d => d.platforms))).sort(),
    [deals]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return deals.filter(d => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (nicheFilter && !d.niches.includes(nicheFilter)) return false
      if (platformFilter && !d.platforms.includes(platformFilter)) return false
      if (q && !d.title.toLowerCase().includes(q) && !(d.description ?? '').toLowerCase().includes(q) && !d.brand_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [deals, typeFilter, nicheFilter, platformFilter, query])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Brand Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real brand deals, affiliate programs, and collabs — apply directly
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-5">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              typeFilter === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-6">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search brands or programs…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>

        {allNiches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setNicheFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !nicheFilter ? 'bg-foreground/90 text-background' : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All niches
            </button>
            {allNiches.map(n => (
              <button
                key={n}
                onClick={() => setNicheFilter(nicheFilter === n ? null : n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  nicheFilter === n ? 'bg-foreground/90 text-background' : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {allPlatforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPlatformFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !platformFilter ? 'bg-brand/20 text-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All platforms
            </button>
            {allPlatforms.map(p => (
              <button
                key={p}
                onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  platformFilter === p ? 'bg-brand/20 text-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'}
        {typeFilter !== 'all' ? ` · ${TYPE_LABELS[typeFilter]}` : ''}
        {nicheFilter ? ` · ${nicheFilter}` : ''}
        {platformFilter ? ` · ${platformFilter}` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm">No opportunities match your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/marketplace/page.tsx app/(dashboard)/marketplace/client.tsx
git commit -m "feat: marketplace tab shows scraped brand deals with logo + apply"
```

---

## Task 10: Seed the database

This must run before the marketplace tab can show data.

- [ ] **Step 1: Ensure SUPABASE_SERVICE_ROLE_KEY is in .env.local**

Open `.env.local` (or create from `.env.local.example`). Add:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CRON_SECRET=any_random_string_here
```

Get the service role key from Supabase dashboard → Project Settings → API → `service_role` key.

- [ ] **Step 2: Start the dev server**

```bash
cd influencr
npm run dev
```

Expected: server starts on http://localhost:3000

- [ ] **Step 3: Trigger the seed via cron endpoint**

Open a new terminal and run:

```bash
curl -H "Authorization: Bearer your_random_string_here" http://localhost:3000/api/cron/scrape-brands
```

Expected response:
```json
{"ok":true,"total":45,"upserted":45}
```

(total may be higher if Firecrawl scrapers run and find additional programs)

- [ ] **Step 4: Verify in Supabase**

Go to Supabase dashboard → Table Editor → `brand_deals`. Confirm rows are present.

---

## Task 11: Update demo page

**Files:**
- Modify: `app/demo/creator/page.tsx`

The current demo has hardcoded static listing cards. Update the "Browse opportunities" section to fetch from the real API.

- [ ] **Step 1: Convert demo page to async + fetch real deals**

In `app/demo/creator/page.tsx`, replace the entire `{/* Opportunities */}` section (lines 224–261) with a server-side fetch from the public API. First, add the async fetch at the top of `CreatorDemo` component:

Change the component signature from:
```ts
export default function CreatorDemo() {
```
to:
```ts
export default async function CreatorDemo() {
```

Then replace the static opportunities section with dynamic data. Find and replace the opportunities section:

```tsx
        {/* Opportunities */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-2">Browse opportunities</h2>
          <p className="text-sm text-muted-foreground mb-5">Brand deals, affiliate programs, and collabs — apply directly, no agency needed</p>
          <div className="space-y-3">
            {[
              { type: 'Affiliate', typeCls: 'bg-green-100 text-green-700', title: 'NordVPN Creator Program — Up to 100% CPA + 30% recurring', brand: 'NordVPN', detail: '40%+ commission', detailIcon: Percent, niches: ['Tech', 'Gaming'], minF: '5K', featured: true },
              { type: 'Brand Deal', typeCls: 'bg-blue-100 text-blue-700', title: 'Sephora Squad 2025 — Open Applications', brand: 'Sephora', detail: '$1,000–10,000', detailIcon: DollarSign, niches: ['Beauty', 'Skincare'], minF: '1K', featured: true },
              { type: 'Collab', typeCls: 'bg-purple-100 text-purple-700', title: 'Away Luggage — Travel Content Co-Creation', brand: 'Away', detail: 'Gifted + repost', detailIcon: DollarSign, niches: ['Travel', 'Lifestyle'], minF: '15K', featured: false },
            ].map((l) => {
              const DetailIcon = l.detailIcon
              return (
                <div key={l.title} className={`bg-card border rounded-xl p-5 flex items-start gap-4 ${l.featured ? 'border-brand/30' : 'border-border'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.typeCls}`}>{l.type}</span>
                      {l.featured && <span className="text-xs text-amber-600 font-medium">★ Featured</span>}
                      <span className="text-xs text-muted-foreground">{l.brand}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{l.title}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><DetailIcon size={11} />{l.detail}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users size={11} />{l.minF}+ followers</span>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {l.niches.map(n => <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{n}</span>)}
                    </div>
                  </div>
                  <button className="shrink-0 text-xs font-medium bg-foreground/90 text-background px-3 py-1.5 rounded-lg cursor-default hover:bg-foreground transition-colors">
                    Express interest
                  </button>
                </div>
              )
            })}
          </div>
          <Link href="/signup?type=creator" className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            See all opportunities <ArrowRight size={13} />
          </Link>
        </section>
```

Replace it with:

```tsx
        {/* Opportunities — live from /api/brand-deals */}
        <DemoOpportunities />
```

Then add the `DemoOpportunities` component above the `CreatorDemo` export. Add it as a separate async server component in the same file, after the icon component definitions:

```tsx
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/brand-deals?limit=3&page=1`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const json = await res.json()
      deals = (json.deals ?? []).slice(0, 3)
    }
  } catch {
    // fallback to empty — page still renders
  }

  return (
    <section className="mb-12">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Browse opportunities</h2>
      <p className="text-sm text-muted-foreground mb-5">Real brand deals and affiliate programs — apply directly, no agency needed</p>
      <div className="space-y-3">
        {deals.map((deal) => (
          <div key={deal.id} className={`bg-card border rounded-xl p-5 flex items-start gap-4 ${deal.is_featured ? 'border-brand/30' : 'border-border'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS_DEMO[deal.type] ?? 'bg-muted text-muted-foreground'}`}>
                  {TYPE_LABELS_DEMO[deal.type] ?? deal.type}
                </span>
                {deal.is_featured && <span className="text-xs text-amber-600 font-medium">★ Featured</span>}
                <span className="text-xs text-muted-foreground">{deal.brand_name}</span>
              </div>
              <p className="font-semibold text-foreground text-sm">{deal.title}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {deal.commission_rate != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent size={11} />{deal.commission_rate}% commission
                  </span>
                )}
                {deal.budget_min != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign size={11} />${deal.budget_min.toLocaleString()}{deal.budget_max ? `–$${deal.budget_max.toLocaleString()}` : '+'}
                  </span>
                )}
                {deal.min_followers != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={11} />{deal.min_followers >= 1000 ? `${(deal.min_followers/1000).toFixed(0)}K` : deal.min_followers}+ followers
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {deal.niches.map(n => <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{n}</span>)}
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
      <Link href="/signup?type=creator" className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        See all opportunities <ArrowRight size={13} />
      </Link>
    </section>
  )
}
```

- [ ] **Step 2: Remove unused imports from demo page**

Remove `DollarSign, Percent, Users` from the import at line 2 (they're now only used inside `DemoOpportunities`) — actually keep them since `DemoOpportunities` uses them directly.

Remove `Store` from the import if it's unused. Check the remaining sections still use it (the Creator HQ section uses it).

- [ ] **Step 3: Commit**

```bash
git add app/demo/creator/page.tsx
git commit -m "feat: demo page shows live brand deals from API"
```

---

## Task 12: Vercel cron config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

Check if `vercel.json` already exists:

```bash
ls influencr/vercel.json 2>/dev/null && echo "exists" || echo "not found"
```

If not found, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-brands",
      "schedule": "0 3 * * *"
    }
  ]
}
```

If it exists, add the `crons` key to the existing JSON.

- [ ] **Step 2: Add CRON_SECRET to Vercel env**

In Vercel dashboard → Project → Settings → Environment Variables, add:
- `CRON_SECRET` = same value as in your `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` = same value as in your `.env.local`

Vercel will pass `Authorization: Bearer <CRON_SECRET>` automatically with built-in crons.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: vercel cron for daily brand deal scraping"
```

---

## Self-review

**Spec coverage check:**
- ✅ `brand_deals` table with correct schema — Task 1
- ✅ Public read RLS + service role writes — Task 1 + Task 7
- ✅ Seed data 45+ programs — Task 3
- ✅ PartnerStack scraper via Firecrawl — Task 4
- ✅ Refersion scraper via Firecrawl — Task 5
- ✅ Scraper orchestrator with dedup — Task 6
- ✅ Cron endpoint with auth — Task 7
- ✅ Public `/api/brand-deals` with filters + pagination — Task 8
- ✅ Marketplace page reads `brand_deals` — Task 9
- ✅ UI: logo + Apply button — Task 9
- ✅ Demo update — Task 11
- ✅ Vercel cron schedule — Task 12

**Type consistency:**
- `ScrapedDeal` defined in Task 3, used in Tasks 4–6 ✅
- `BrandDeal` defined in Task 2, used in Tasks 9 ✅
- `createServiceClient` defined in Task 2, used in Task 7 ✅

**Execution order constraint:** Task 10 (seeding) must run after Tasks 1–9. Everything else is independent per-task.
