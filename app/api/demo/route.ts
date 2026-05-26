import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEMO_EMAIL = 'demo@influencr.app'
const DEMO_PASSWORD = 'Demo123456!'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedDemoData(admin: any, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const influencers = await (admin as any).from('influencers').insert([
    {
      user_id: userId, name: 'Sarah Miller', handle: '@glowwithsarah',
      platform: 'Instagram', niche: 'Beauty', followers: 45200,
      engagement_rate: 4.2, contact_email: 'sarah@glowwithsarah.com',
      status: 'active', tags: ['beauty', 'skincare'],
    },
    {
      user_id: userId, name: 'Lena Hoffmann', handle: '@lifestylebylena',
      platform: 'TikTok', niche: 'Lifestyle', followers: 122000,
      engagement_rate: 8.1, contact_email: 'lena@lifestylebylena.com',
      status: 'active', tags: ['lifestyle', 'fashion'],
    },
    {
      user_id: userId, name: 'Freja Hansen', handle: '@fitnessfreja',
      platform: 'Instagram', niche: 'Fitness', followers: 67500,
      engagement_rate: 5.6, contact_email: 'freja@fitnessfreja.com',
      status: 'active', tags: ['fitness', 'wellness'],
    },
    {
      user_id: userId, name: 'Bianca Santos', handle: '@beautybybia',
      platform: 'YouTube', niche: 'Beauty', followers: 89100,
      engagement_rate: 4.9, contact_email: 'bia@beautybybia.com',
      status: 'active', tags: ['beauty', 'tutorials'],
    },
    {
      user_id: userId, name: 'Tom Berg', handle: '@travelwithtom',
      platform: 'Instagram', niche: 'Travel', followers: 28400,
      engagement_rate: 3.8, contact_email: 'tom@travelwithtom.com',
      status: 'prospect', tags: ['travel', 'outdoor'],
    },
  ]).select()

  if (!influencers.data) return

  const [sarah, lena, freja, bia] = influencers.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaigns = await (admin as any).from('campaigns').insert([
    {
      user_id: userId, name: 'Summer Glow 2025', status: 'active',
      budget: 5000, currency: 'USD',
      start_date: '2025-06-01', end_date: '2025-08-31',
      description: 'Promote the summer skincare line across Instagram and TikTok.',
    },
    {
      user_id: userId, name: 'Holiday Collection Drop', status: 'planning',
      budget: 8500, currency: 'USD',
      start_date: '2025-11-01', end_date: '2025-12-31',
      description: 'Holiday gift sets launch with unboxing and review content.',
    },
  ]).select()

  if (!campaigns.data) return

  const [summer, holiday] = campaigns.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('campaign_influencers').insert([
    { campaign_id: summer.id, influencer_id: sarah.id, fee: 800, status: 'confirmed' },
    { campaign_id: summer.id, influencer_id: lena.id, fee: 1200, status: 'confirmed' },
    { campaign_id: summer.id, influencer_id: freja.id, fee: 600, status: 'negotiating' },
    { campaign_id: holiday.id, influencer_id: bia.id, fee: 1500, status: 'outreach' },
    { campaign_id: holiday.id, influencer_id: sarah.id, fee: 900, status: 'outreach' },
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('content').insert([
    {
      user_id: userId, campaign_id: summer.id, influencer_id: sarah.id,
      type: 'post', status: 'posted', due_date: '2025-06-15', posted_at: '2025-06-14',
      url: 'https://instagram.com/p/example1', notes: 'Summer moisturizer flat lay',
    },
    {
      user_id: userId, campaign_id: summer.id, influencer_id: sarah.id,
      type: 'story', status: 'posted', due_date: '2025-06-20', posted_at: '2025-06-20',
    },
    {
      user_id: userId, campaign_id: summer.id, influencer_id: lena.id,
      type: 'reel', status: 'approved', due_date: '2025-07-01',
      notes: 'Get-ready-with-me using the SPF serum',
    },
    {
      user_id: userId, campaign_id: summer.id, influencer_id: freja.id,
      type: 'post', status: 'briefed', due_date: '2025-07-10',
      notes: 'Post-workout skincare routine',
    },
    {
      user_id: userId, campaign_id: holiday.id, influencer_id: bia.id,
      type: 'video', status: 'briefed', due_date: '2025-11-15',
      notes: 'Unboxing holiday gift set on YouTube',
    },
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('payments').insert([
    {
      user_id: userId, campaign_id: summer.id, influencer_id: sarah.id,
      amount: 800, currency: 'USD', status: 'paid',
      paid_at: '2025-06-30', invoice_number: 'INV-001',
    },
    {
      user_id: userId, campaign_id: summer.id, influencer_id: lena.id,
      amount: 1200, currency: 'USD', status: 'pending',
      due_date: '2025-07-15', invoice_number: 'INV-002',
    },
    {
      user_id: userId, campaign_id: summer.id, influencer_id: freja.id,
      amount: 600, currency: 'USD', status: 'pending',
      due_date: '2025-07-31', invoice_number: 'INV-003',
    },
    {
      user_id: userId, campaign_id: holiday.id, influencer_id: bia.id,
      amount: 1500, currency: 'USD', status: 'pending',
      due_date: '2025-11-01', invoice_number: 'INV-004',
    },
  ])
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Try to sign in first (user may already exist)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (signInError) {
    // Create demo user
    const { data: { user }, error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })

    if (createError || !user) {
      return NextResponse.redirect(`${origin}/login?error=demo`)
    }

    await seedDemoData(admin, user.id)

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (retryError) return NextResponse.redirect(`${origin}/login?error=demo`)
  } else {
    // User exists — seed data if influencers table is empty
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (admin as any)
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (!count) await seedDemoData(admin, user.id)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
