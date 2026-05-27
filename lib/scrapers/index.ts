import type { ScrapedDeal } from './types'
import { SEED_DEALS } from './seed-data'
import { scrapePartnerStack } from './partnerstack'
import { scrapeRefersion } from './refersion'
import { scrapeImpact } from './impact'

export type { ScrapedDeal }

export async function runAllScrapers(): Promise<ScrapedDeal[]> {
  const [partnerstack, refersion, impact] = await Promise.allSettled([
    scrapePartnerStack(),
    scrapeRefersion(),
    scrapeImpact(),
  ])

  const live: ScrapedDeal[] = [
    ...(partnerstack.status === 'fulfilled' ? partnerstack.value : []),
    ...(refersion.status === 'fulfilled' ? refersion.value : []),
    ...(impact.status === 'fulfilled' ? impact.value : []),
  ]

  // Seed first so seed data wins on conflict
  const all = [...SEED_DEALS, ...live]

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
