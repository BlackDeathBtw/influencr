import type { ScrapedDeal } from './types'

interface PSProgram {
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
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: ['https://partnerstack.com/marketplace'],
        prompt:
          'Extract all partner programs listed on this marketplace page. For each program extract: company name, short description, commission rate or structure, program category/niche, and the URL to apply or learn more.',
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
    const programs: PSProgram[] = json.data?.programs ?? []

    return programs
      .filter((p) => p.company_name && p.apply_url)
      .map((p) => ({
        source: 'partnerstack',
        brand_name: p.company_name!,
        logo_url:
          p.logo_url ??
          `https://logo.clearbit.com/${p.company_name!.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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
