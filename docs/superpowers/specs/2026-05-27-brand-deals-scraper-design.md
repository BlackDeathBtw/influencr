# Brand Deals Scraper — Design Spec
Date: 2026-05-27

## Goal
Populate the marketplace tab with real brand deal/affiliate listings scraped from the internet. The tab currently shows user-created listings (empty in practice). Replace with live scraped data. Expose the data as a public API that can be sold later.

## What We're Building
1. A `brand_deals` Supabase table seeded with curated programs and refreshed via live scrapers
2. Three scraping sources (seed + PartnerStack + Refersion + optional more)
3. A daily cron endpoint that triggers scraping + upserts
4. A public `/api/brand-deals` endpoint (the product)
5. UI updates to the marketplace tab to show brand logos and an "Apply →" link

---

## Database

### New table: `brand_deals`
Separate from `marketplace_listings` to keep user-created and scraped data decoupled.

```sql
CREATE TABLE brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,              -- 'seed' | 'partnerstack' | 'refersion' | ...
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'affiliate',  -- 'brand_deal' | 'affiliate' | 'collab'
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
CREATE POLICY "Service role write brand deals" ON brand_deals FOR ALL USING (auth.role() = 'service_role');
```

---

## Files

### New files
| File | Purpose |
|------|---------|
| `lib/scrapers/types.ts` | `ScrapedDeal` type shared by all scrapers |
| `lib/scrapers/seed-data.ts` | 50+ curated real brand programs (guaranteed baseline) |
| `lib/scrapers/partnerstack.ts` | Scrapes partnerstack.com/marketplace via Firecrawl |
| `lib/scrapers/refersion.ts` | Scrapes refersion.com/marketplace via Firecrawl |
| `lib/scrapers/index.ts` | Orchestrates all scrapers, deduplicates by (brand_name, apply_url) |
| `app/api/cron/scrape-brands/route.ts` | Protected cron endpoint — triggers scrape + upsert |
| `app/api/brand-deals/route.ts` | **Public** API endpoint with filtering + pagination |

### Modified files
| File | Change |
|------|--------|
| `app/(dashboard)/marketplace/page.tsx` | Query `brand_deals` instead of `marketplace_listings` |
| `app/(dashboard)/marketplace/client.tsx` | Add logo display, swap "Express interest" for "Apply →" button |
| `types/index.ts` | Add `BrandDeal` type |
| `supabase/schema.sql` | Append `brand_deals` table DDL |

---

## Scraping Sources

### 1. Seed data (`lib/scrapers/seed-data.ts`)
50+ hardcoded real programs. Always present, no external dependency. Examples:
- Shopify Affiliates — 20% commission, all niches
- Fiverr Affiliates — up to $150/referral
- Coursera — 45% commission, education
- Semrush — 40% commission, marketing/SEO
- HubSpot — 30% commission, B2B
- Canva — 80% for first payment, design
- NordVPN — 40% commission, tech
- Squarespace — up to $200/sale, design
- Adobe — 85% first month, design/creative
- Grammarly — $0.20 per free signup + $20 per premium

### 2. PartnerStack (`lib/scrapers/partnerstack.ts`)
URL: `https://partnerstack.com/marketplace`
Method: Firecrawl scrape (JS-rendered). Falls back gracefully if `FIRECRAWL_API_KEY` is absent.
Returns: company name, logo, commission info, category → normalized to `ScrapedDeal`.

### 3. Refersion (`lib/scrapers/refersion.ts`)
URL: `https://www.refersion.com/marketplace`
Method: Firecrawl scrape (JS-rendered). Same graceful fallback.
Returns: brand name, commission rate, category, apply URL.

### Extensibility
`lib/scrapers/index.ts` exports a `scrapers: Scraper[]` array. Adding a new source = add one file + push to the array.

---

## Cron Endpoint (`/api/cron/scrape-brands`)

- `GET` request, protected by `Authorization: Bearer <CRON_SECRET>` header check
- Calls `runAllScrapers()` from `lib/scrapers/index.ts`
- Upserts results to `brand_deals` via `ON CONFLICT (brand_name, apply_url) DO UPDATE`
- Returns `{ inserted, updated, total }` JSON
- Configured in `vercel.json` to run daily at 03:00 UTC

---

## Public API (`/api/brand-deals`)

```
GET /api/brand-deals
  ?type=affiliate|brand_deal|collab
  ?niche=tech
  ?platform=instagram
  ?q=shopify          (search brand_name + title + description)
  ?page=1             (default 1)
  ?limit=20           (default 20, max 100)

Response:
{
  "deals": BrandDeal[],
  "total": number,
  "page": number,
  "limit": number
}
```

No auth required. Rate limiting handled at Vercel edge level.

---

## UI Changes

**`ListingCard` in `client.tsx`:**
- Add brand logo (`<img src={deal.logo_url} />`) at top of card, fallback to brand initials avatar
- Replace "Express interest" expand form with single "Apply →" link button (`href={deal.apply_url}`, opens new tab)
- Remove application tracking (no `marketplace_applications` involvement)

**`marketplace/page.tsx`:**
- Read from `brand_deals` table (public read, no auth filter needed)
- Order by `is_featured DESC, scraped_at DESC`
- Pass to `MarketplaceClient` as `listings` shaped as `BrandDeal[]`

---

## Error Handling
- Each scraper is wrapped in try/catch; failure of one source doesn't block others
- Seed data is always injected first, so the tab never shows empty
- If `FIRECRAWL_API_KEY` is unset, live scrapers log a warning and return `[]`

---

## Out of Scope
- User-created listings (marketplace_listings table) — untouched, usable later
- Application tracking for scraped deals (creators apply directly on brand's site)
- API key management / monetization layer (future)
