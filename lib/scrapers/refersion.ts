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

function mapToScrapedDeal(p: any): ScrapedDeal {
  const name: string = p.brand_name ?? p.name ?? p.company_name ?? ''
  return {
    source: 'refersion',
    brand_name: name,
    logo_url: p.logo_url ?? p.image_url ?? toClearbitLogo(name),
    title: `${name} Affiliate Program${p.commission ? ` — ${p.commission}` : ''}`,
    description: p.description ?? null,
    type: 'affiliate' as const,
    niches: Array.isArray(p.categories)
      ? p.categories
      : p.category
        ? [p.category]
        : [],
    platforms: [],
    commission_rate: parseCommission(p.commission ?? p.commission_rate),
    budget_min: null,
    budget_max: null,
    min_followers: null,
    apply_url:
      p.apply_url ??
      p.url ??
      `https://www.refersion.com/marketplace`,
    is_featured: false,
  }
}

// Try Refersion's internal marketplace API
async function tryAPIEndpoints(): Promise<ScrapedDeal[]> {
  const urls = [
    'https://api.refersion.com/v2/marketplace/offers?limit=100&page=1',
    'https://www.refersion.com/api/marketplace/programs?limit=100',
    'https://www.refersion.com/marketplace/programs.json?limit=100',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
          Origin: 'https://www.refersion.com',
          Referer: 'https://www.refersion.com/marketplace',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue

      const json = await res.json()
      const programs: any[] = json.programs ?? json.offers ?? json.data ?? []
      if (!Array.isArray(programs) || programs.length === 0) continue

      const deals = programs.filter((p) => p.brand_name || p.name || p.company_name).map(mapToScrapedDeal)
      if (deals.length > 0) {
        console.log(`[refersion] fetched ${deals.length} programs via API`)
        return deals
      }
    } catch {
      continue
    }
  }

  return []
}

// Try extracting SSR/embedded JSON from the marketplace HTML
async function tryHtmlExtract(): Promise<ScrapedDeal[]> {
  const res = await fetch('https://www.refersion.com/marketplace', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return []

  const html = await res.text()

  // Try __NEXT_DATA__ (Next.js SSR)
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1])
      const programs: any[] =
        data?.props?.pageProps?.offers ??
        data?.props?.pageProps?.programs ??
        data?.props?.pageProps?.data?.programs ??
        []
      if (Array.isArray(programs) && programs.length > 0) {
        const deals = programs.filter((p) => p.brand_name || p.name).map(mapToScrapedDeal)
        if (deals.length > 0) {
          console.log(`[refersion] fetched ${deals.length} programs via HTML __NEXT_DATA__`)
          return deals
        }
      }
    } catch {
      // JSON parse failed
    }
  }

  // Try window.__INITIAL_STATE__ pattern
  const stateMatch = html.match(/window\.__(?:INITIAL|APP)_STATE__\s*=\s*(\{[\s\S]*?\});/)
  if (stateMatch) {
    try {
      const data = JSON.parse(stateMatch[1])
      const programs: any[] = data?.marketplace?.programs ?? data?.programs ?? []
      if (Array.isArray(programs) && programs.length > 0) {
        const deals = programs.filter((p) => p.brand_name || p.name).map(mapToScrapedDeal)
        if (deals.length > 0) {
          console.log(`[refersion] fetched ${deals.length} programs via HTML state`)
          return deals
        }
      }
    } catch {
      // JSON parse failed
    }
  }

  return []
}

export async function scrapeRefersion(): Promise<ScrapedDeal[]> {
  try {
    const apiResults = await tryAPIEndpoints()
    if (apiResults.length > 0) return apiResults

    return await tryHtmlExtract()
  } catch (err) {
    console.warn('[refersion] scrape failed:', err)
    return []
  }
}
