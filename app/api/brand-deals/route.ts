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
