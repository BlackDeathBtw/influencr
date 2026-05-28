import { NextResponse } from 'next/server'

const MOCK_CAPTIONS: Record<string, string[]> = {
  Instagram: [
    "Chasing dreams one post at a time ✨ Drop a comment if this resonates with you! #ContentCreator #Lifestyle #Inspiration",
    "Real talk: this is what my day actually looks like 👀 Save this for when you need motivation! #BehindTheScenes #CreatorLife #Authentic",
    "POV: You found your people 💫 Tag someone who needs to see this today! #Community #GoodVibes #Motivation",
  ],
  TikTok: [
    "Wait for it… 👀 #fyp #viral #trending #contentcreator",
    "Nobody talks about this but… 🤫 #honest #reallife #tiktoktrend #foryou",
    "The glow-up is real 🔥 #transformation #beforeandafter #fyp #viral",
  ],
  YouTube: [
    "Everything you need to know about this topic — I break it all down in this video. Watch till the end for the most important part!",
    "I spent weeks testing this so you don't have to. Here's my honest review after using it daily — the results surprised me.",
    "This changed how I approach everything. In this video I share the exact framework I use and how you can apply it starting today.",
  ],
  'Twitter/X': [
    "Unpopular opinion: most advice on this topic is completely wrong. Here's what actually works (thread) 🧵",
    "Just realized something that completely changed my perspective on this. Sharing in case it helps someone else.",
    "Hot take: the best creators aren't the most talented — they're the most consistent. Agree or disagree?",
  ],
}

function buildPrompt(platform: string, topic: string, tone: string, keywords: string): string {
  const keywordNote = keywords
    ? `Include some of these hashtag topics naturally: ${keywords}.`
    : ''

  const platformGuide: Record<string, string> = {
    Instagram:
      'Instagram captions should be engaging, 1-3 sentences, and end with 3-5 relevant hashtags.',
    TikTok:
      'TikTok captions are short (under 150 chars), punchy, and include 3-5 trending hashtags like #fyp #viral.',
    YouTube:
      'YouTube descriptions are 2-3 sentences, informative, and encourage viewers to watch the full video.',
    'Twitter/X':
      'Twitter/X posts are under 280 characters, direct, and spark engagement or debate.',
  }

  return `You are a social media copywriter. Generate exactly 3 distinct caption options for ${platform}.

Platform guidelines: ${platformGuide[platform] ?? `Write captions appropriate for ${platform}.`}

Post topic: ${topic}
Tone: ${tone}
${keywordNote}

Return ONLY a JSON object with this exact shape:
{"captions": ["caption 1", "caption 2", "caption 3"]}

No extra text, no markdown, just the JSON.`
}

export async function POST(request: Request) {
  const body = await request.json()
  const { platform, topic, tone, keywords } = body as {
    platform: string
    topic: string
    tone: string
    keywords?: string
  }

  if (!platform || !topic || !tone) {
    return NextResponse.json({ error: 'platform, topic, and tone are required' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const mock = MOCK_CAPTIONS[platform] ?? MOCK_CAPTIONS['Instagram']
    return NextResponse.json({ captions: mock, mock: true })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: buildPrompt(platform, topic, tone, keywords ?? ''),
          },
        ],
        temperature: 0.85,
        max_tokens: 600,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('OpenAI error:', err)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content ?? ''

    let parsed: { captions: string[] }
    try {
      parsed = JSON.parse(content)
    } catch {
      // Fallback: try to extract JSON substring
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        return NextResponse.json({ error: 'Could not parse AI response' }, { status: 502 })
      }
    }

    if (!Array.isArray(parsed.captions) || parsed.captions.length === 0) {
      return NextResponse.json({ error: 'Invalid AI response shape' }, { status: 502 })
    }

    return NextResponse.json({ captions: parsed.captions.slice(0, 3) })
  } catch (err) {
    console.error('Caption generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
