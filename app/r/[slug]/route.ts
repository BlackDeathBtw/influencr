import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('utm_links')
    .select('id, destination, utm_campaign, utm_content, clicks')
    .eq('slug', slug)
    .single()

  if (!link) {
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.influencr.co'))
  }

  // Increment clicks (fire and forget — don't await to keep redirect fast)
  supabase
    .from('utm_links')
    .update({ clicks: link.clicks + 1 })
    .eq('id', link.id)
    .then(() => {})

  // Build redirect URL with UTM params
  const dest = new URL(link.destination)
  dest.searchParams.set('utm_source', 'influencr')
  dest.searchParams.set('utm_medium', 'creator')
  if (link.utm_campaign) dest.searchParams.set('utm_campaign', link.utm_campaign)
  if (link.utm_content) dest.searchParams.set('utm_content', link.utm_content)

  return NextResponse.redirect(dest.toString())
}
