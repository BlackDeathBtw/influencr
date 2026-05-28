import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function makeAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = makeAdmin()

  const { data: link } = await admin
    .from('creator_links')
    .select('url, click_count')
    .eq('id', id)
    .single()

  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment click count (fire-and-forget — don't block redirect on failure)
  await admin
    .from('creator_links')
    .update({ click_count: (link.click_count ?? 0) + 1 })
    .eq('id', id)

  return NextResponse.redirect(link.url, { status: 307 })
}
