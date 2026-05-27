import { NextResponse } from 'next/server'

function extractChannelId(input: string): { type: 'id' | 'handle' | 'username'; value: string } | null {
  const trimmed = input.trim()
  // youtube.com/channel/UC...
  const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (channelMatch) return { type: 'id', value: channelMatch[1] }
  // youtube.com/@handle
  const handleMatch = trimmed.match(/youtube\.com\/@([\w.-]+)/)
  if (handleMatch) return { type: 'handle', value: handleMatch[1] }
  // youtube.com/c/name or youtube.com/user/name
  const legacyMatch = trimmed.match(/youtube\.com\/(?:c|user)\/([\w.-]+)/)
  if (legacyMatch) return { type: 'username', value: legacyMatch[1] }
  // bare @handle
  if (trimmed.startsWith('@')) return { type: 'handle', value: trimmed.slice(1) }
  // bare channel ID
  if (trimmed.startsWith('UC')) return { type: 'id', value: trimmed }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('url') ?? searchParams.get('handle') ?? ''
  if (!input) return NextResponse.json({ error: 'Provide a YouTube URL or handle' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 503 })

  const parsed = extractChannelId(input)
  if (!parsed) return NextResponse.json({ error: 'Could not parse YouTube channel from input' }, { status: 400 })

  const base = 'https://www.googleapis.com/youtube/v3/channels'
  let url: string

  if (parsed.type === 'id') {
    url = `${base}?part=statistics,snippet&id=${parsed.value}&key=${apiKey}`
  } else if (parsed.type === 'handle') {
    url = `${base}?part=statistics,snippet&forHandle=${parsed.value}&key=${apiKey}`
  } else {
    url = `${base}?part=statistics,snippet&forUsername=${parsed.value}&key=${apiKey}`
  }

  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok || !json.items?.length) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }

  const ch = json.items[0]
  const stats = ch.statistics

  return NextResponse.json({
    name: ch.snippet.title,
    handle: ch.snippet.customUrl ?? null,
    followers: parseInt(stats.subscriberCount ?? '0'),
    // YouTube engagement proxy: (likes + comments per 10 videos) / subscribers
    // We just return view data; engagement_rate is not directly available
    view_count: parseInt(stats.viewCount ?? '0'),
    video_count: parseInt(stats.videoCount ?? '0'),
    thumbnail: ch.snippet.thumbnails?.default?.url ?? null,
  })
}
