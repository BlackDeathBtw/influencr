import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('*, platform_stats:creator_platform_stats(*)')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(profile ?? null)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { username, display_name, bio, location, niches, rate_min, rate_max, is_public, platform_stats } = body

  if (username !== undefined) {
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 lowercase letters, numbers, or underscores' },
        { status: 400 }
      )
    }
  }

  const { data: profile, error } = await supabase
    .from('creator_profiles')
    .upsert(
      {
        user_id: user.id,
        username,
        display_name: display_name ?? null,
        bio: bio ?? null,
        location: location ?? null,
        niches: niches ?? [],
        rate_min: rate_min ?? null,
        rate_max: rate_max ?? null,
        is_public: is_public ?? false,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (Array.isArray(platform_stats) && profile) {
    await supabase.from('creator_platform_stats').delete().eq('profile_id', profile.id)
    if (platform_stats.length > 0) {
      await supabase.from('creator_platform_stats').insert(
        platform_stats.map((s: { platform: string; handle?: string; followers?: number; engagement_rate?: number }) => ({
          profile_id: profile.id,
          platform: s.platform,
          handle: s.handle ?? null,
          followers: s.followers ?? null,
          engagement_rate: s.engagement_rate ?? null,
        }))
      )
    }
  }

  const { data: full } = await supabase
    .from('creator_profiles')
    .select('*, platform_stats:creator_platform_stats(*)')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(full)
}
