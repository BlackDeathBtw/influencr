import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret to prevent public access
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Find content due tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: dueContent } = await admin
    .from('content')
    .select('*, influencer:influencers(name, contact_email), campaign:campaigns(name)')
    .eq('due_date', tomorrowStr)
    .not('status', 'in', '("posted","approved")')

  if (!dueContent || dueContent.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Group by user_id to send one email per user
  const byUser: Record<string, typeof dueContent> = {}
  for (const item of dueContent) {
    if (!byUser[item.user_id]) byUser[item.user_id] = []
    byUser[item.user_id].push(item)
  }

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    return NextResponse.json({ sent: 0, note: 'Resend not configured' })
  }

  let sent = 0
  for (const [userId, items] of Object.entries(byUser)) {
    // Get user email
    const { data: { user } } = await admin.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const listHtml = items.map((c: any) =>
      `<li><strong>${c.influencer?.name ?? 'Unknown'}</strong> — ${c.type} for <em>${c.campaign?.name ?? 'campaign'}</em></li>`
    ).join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'influencr <reminders@influencr.app>',
        to: user.email,
        subject: `${items.length} content piece${items.length > 1 ? 's' : ''} due tomorrow`,
        html: `
          <p>Hi,</p>
          <p>The following content is due <strong>tomorrow</strong>:</p>
          <ul>${listHtml}</ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/campaigns">View in influencr →</a></p>
        `,
      }),
    })
    sent++
  }

  return NextResponse.json({ sent })
}
