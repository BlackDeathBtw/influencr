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

// Try PartnerStack's v2 programs API (public programs may be accessible without auth)
async function tryV2API(): Promise<ScrapedDeal[]> {
  const urls = [
    'https://api.partnerstack.com/api/v2/programs?limit=100&page=0',
    'https://api.partnerstack.com/api/v2/programs/public?limit=100',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
          Origin: 'https://partnerstack.com',
          Referer: 'https://partnerstack.com/marketplace',
        },
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) continue

      const json = await res.json()
      const programs: any[] = json.programs ?? json.data ?? []
      if (!Array.isArray(programs) || programs.length === 0) continue

      return programs
        .filter((p) => p.company_name || p.name)
        .map((p) => {
          const name: string = p.company_name ?? p.name ?? ''
          return {
            source: 'partnerstack',
            brand_name: name,
            logo_url: p.logo_url ?? toClearbitLogo(name),
            title: `${name} Partner Program${p.commission ? ` — ${p.commission}` : ''}`,
            description: p.description ?? null,
            type: 'affiliate' as const,
            niches: Array.isArray(p.categories) ? p.categories : [],
            platforms: [],
            commission_rate: parseCommission(p.commission),
            budget_min: null,
            budget_max: null,
            min_followers: null,
            apply_url:
              p.apply_url ??
              p.application_url ??
              `https://partnerstack.com/apply/${p.slug ?? name.toLowerCase().replace(/\s+/g, '-')}`,
            is_featured: false,
          } satisfies ScrapedDeal
        })
    } catch {
      continue
    }
  }

  return []
}

// Try extracting SSR payload from the marketplace HTML
async function tryHtmlExtract(): Promise<ScrapedDeal[]> {
  const res = await fetch('https://partnerstack.com/marketplace', {
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
        data?.props?.pageProps?.programs ??
        data?.props?.pageProps?.initialData?.programs ??
        []
      if (Array.isArray(programs) && programs.length > 0) {
        return programs
          .filter((p) => p.company_name || p.name)
          .map((p) => {
            const name: string = p.company_name ?? p.name ?? ''
            return {
              source: 'partnerstack',
              brand_name: name,
              logo_url: p.logo_url ?? toClearbitLogo(name),
              title: `${name} Partner Program`,
              description: p.description ?? null,
              type: 'affiliate' as const,
              niches: [],
              platforms: [],
              commission_rate: parseCommission(p.commission),
              budget_min: null,
              budget_max: null,
              min_followers: null,
              apply_url: p.apply_url ?? 'https://partnerstack.com/marketplace',
              is_featured: false,
            } satisfies ScrapedDeal
          })
      }
    } catch {
      // JSON parse failed
    }
  }

  return []
}

export async function scrapePartnerStack(): Promise<ScrapedDeal[]> {
  try {
    const apiResults = await tryV2API()
    if (apiResults.length > 0) {
      console.log(`[partnerstack] fetched ${apiResults.length} programs via API`)
      return apiResults
    }

    const htmlResults = await tryHtmlExtract()
    if (htmlResults.length > 0) {
      console.log(`[partnerstack] fetched ${htmlResults.length} programs via HTML`)
    }
    return htmlResults
  } catch (err) {
    console.warn('[partnerstack] scrape failed:', err)
    return []
  }
}
