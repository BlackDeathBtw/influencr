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
