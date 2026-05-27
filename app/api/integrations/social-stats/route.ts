import { NextResponse } from 'next/server'

// Best-effort public profile scraper for Instagram and TikTok.
// No API key required. May fail if platforms block the request.

async function scrapeInstagram(handle: string) {
  const username = handle.replace('@', '')
  const url = `https://www.instagram.com/${username}/`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return null
  const html = await res.text()

  // Try to extract follower count from meta description
  // Instagram meta: "X Followers, Y Following, Z Posts"
  const metaMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)
  const description = metaMatch?.[1] ?? ''

  const followerMatch = description.match(/([\d,.]+[KMBkmb]?)\s+Follower/)
  const nameMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)

  if (!followerMatch) return null

  const rawFollowers = followerMatch[1].replace(/,/g, '')
  let followers: number
  if (rawFollowers.toUpperCase().endsWith('M')) {
    followers = Math.round(parseFloat(rawFollowers) * 1_000_000)
  } else if (rawFollowers.toUpperCase().endsWith('K')) {
    followers = Math.round(parseFloat(rawFollowers) * 1_000)
  } else {
    followers = parseInt(rawFollowers)
  }

  const name = nameMatch?.[1]?.split('(')?.[0]?.trim() ?? username

  return { name, handle: `@${username}`, followers, platform: 'instagram' }
}

async function scrapeTikTok(handle: string) {
  const username = handle.replace('@', '')
  const url = `https://www.tiktok.com/@${username}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return null
  const html = await res.text()

  // TikTok embeds JSON data in __UNIVERSAL_DATA_FOR_REHYDRATION__ or og tags
  const metaMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)
  const description = metaMatch?.[1] ?? ''
  const nameMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)

  // Try JSON embedded data
  const jsonMatch = html.match(/"followerCount":(\d+)/)
  const followers = jsonMatch ? parseInt(jsonMatch[1]) : null
  if (!followers) return null

  const name = nameMatch?.[1]?.split('(@')?.[0]?.trim() ?? username

  return { name, handle: `@${username}`, followers, platform: 'tiktok' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')?.toLowerCase()
  const handle = searchParams.get('handle') ?? ''

  if (!platform || !handle) {
    return NextResponse.json({ error: 'platform and handle are required' }, { status: 400 })
  }

  if (!['instagram', 'tiktok'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be instagram or tiktok' }, { status: 400 })
  }

  try {
    const data = platform === 'instagram'
      ? await scrapeInstagram(handle)
      : await scrapeTikTok(handle)

    if (!data) {
      return NextResponse.json({ error: 'Could not fetch stats — platform may be blocking automated requests' }, { status: 422 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Request timed out or failed' }, { status: 503 })
  }
}
