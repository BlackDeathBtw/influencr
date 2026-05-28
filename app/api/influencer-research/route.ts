import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface NormalizedProfile {
  handle: string
  platform: string
  display_name: string | null
  bio: string | null
  followers: number | null
  following: number | null
  posts: number | null
  profile_url: string
}

async function fetchInstagram(handle: string): Promise<NormalizedProfile> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`

  const res = await fetch(url, {
    headers: {
      'x-ig-app-id': '936619743392459',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Instagram returned ${res.status}`)

  const json = await res.json()
  const user = json?.data?.user
  if (!user) throw new Error('Profile not found')

  return {
    handle,
    platform: 'instagram',
    display_name: user.full_name ?? null,
    bio: user.biography ?? null,
    followers: user.edge_followed_by?.count ?? null,
    following: user.edge_follow?.count ?? null,
    posts: user.edge_owner_to_timeline_media?.count ?? null,
    profile_url: `https://www.instagram.com/${handle}/`,
  }
}

async function fetchTikTok(handle: string): Promise<NormalizedProfile> {
  const url = `https://www.tiktok.com/api/user/detail/?uniqueId=${encodeURIComponent(handle)}&aid=1988`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/',
    },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`TikTok returned ${res.status}`)

  const json = await res.json()
  const userInfo = json?.userInfo
  if (!userInfo) throw new Error('Profile not found')

  const stats = userInfo.stats ?? {}
  const user = userInfo.user ?? {}

  return {
    handle,
    platform: 'tiktok',
    display_name: user.nickname ?? null,
    bio: user.signature ?? null,
    followers: stats.followerCount ?? null,
    following: stats.followingCount ?? null,
    posts: stats.videoCount ?? null,
    profile_url: `https://www.tiktok.com/@${handle}`,
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')?.replace(/^@/, '').trim()
  const platform = searchParams.get('platform')?.toLowerCase()

  if (!handle) return NextResponse.json({ error: 'handle is required' }, { status: 400 })
  if (platform !== 'instagram' && platform !== 'tiktok') {
    return NextResponse.json({ error: 'platform must be instagram or tiktok' }, { status: 400 })
  }

  try {
    const profile =
      platform === 'instagram'
        ? await fetchInstagram(handle)
        : await fetchTikTok(handle)

    return NextResponse.json(profile)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isNotFound =
      message.includes('Profile not found') ||
      message.includes('404') ||
      message.includes('400')

    return NextResponse.json(
      { error: isNotFound ? 'Profile not found or private' : 'Failed to fetch profile — try again shortly' },
      { status: isNotFound ? 404 : 502 }
    )
  }
}
