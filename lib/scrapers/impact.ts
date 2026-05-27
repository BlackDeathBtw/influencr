import type { ScrapedDeal } from './types'

function parseCommission(raw?: string): number | null {
  if (!raw) return null
  const match = raw.match(/(\d+(?:\.\d+)?)%/)
  return match ? parseFloat(match[1]) : null
}

function toClearbitLogo(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://logo.clearbit.com/${slug}.com`
}

// Impact.com has a public-facing brand marketplace. Try their search API.
async function tryImpactAPI(): Promise<ScrapedDeal[]> {
  const urls = [
    'https://impact.com/marketplace/search?format=json&page=1&size=100',
    'https://api.impact.com/programs/public?limit=100',
    'https://app.impact.com/campaign-marketplace/search?format=json&limit=100',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
          Referer: 'https://impact.com/marketplace',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue

      const json = await res.json()
      const programs: any[] =
        json.programs ?? json.campaigns ?? json.data ?? json.results ?? []

      if (!Array.isArray(programs) || programs.length === 0) continue

      const deals = programs
        .filter((p) => p.name || p.brand_name || p.advertiser_name)
        .map((p): ScrapedDeal => {
          const name: string = p.name ?? p.brand_name ?? p.advertiser_name ?? ''
          return {
            source: 'impact',
            brand_name: name,
            logo_url: p.logo_url ?? p.logo ?? toClearbitLogo(name),
            title: `${name} Affiliate Program${p.commission_rate ? ` — ${p.commission_rate}%` : ''}`,
            description: p.description ?? null,
            type: 'affiliate' as const,
            niches: Array.isArray(p.categories) ? p.categories : [],
            platforms: [],
            commission_rate: parseCommission(p.commission_rate ?? p.commission),
            budget_min: null,
            budget_max: null,
            min_followers: null,
            apply_url:
              p.apply_url ??
              p.campaign_url ??
              p.url ??
              `https://impact.com/marketplace`,
            is_featured: false,
          }
        })

      if (deals.length > 0) {
        console.log(`[impact] fetched ${deals.length} programs`)
        return deals
      }
    } catch {
      continue
    }
  }

  return []
}

export async function scrapeImpact(): Promise<ScrapedDeal[]> {
  try {
    return await tryImpactAPI()
  } catch (err) {
    console.warn('[impact] scrape failed:', err)
    return []
  }
}
