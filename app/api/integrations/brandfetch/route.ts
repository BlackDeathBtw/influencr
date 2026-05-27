import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')?.toLowerCase().trim()
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 })

  const apiKey = process.env.BRANDFETCH_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'BRANDFETCH_API_KEY not configured' }, { status: 503 })

  const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '')

  const res = await fetch(`https://api.brandfetch.io/v2/brands/${clean}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    if (res.status === 404) return NextResponse.json({ error: 'Brand not found for this domain' }, { status: 404 })
    return NextResponse.json({ error: 'Brandfetch request failed' }, { status: res.status })
  }

  const data = await res.json()

  const logo = data.logos?.find((l: { type: string }) => l.type === 'icon') ?? data.logos?.[0]
  const logoUrl = logo?.formats?.find((f: { format: string }) => f.format === 'png')?.src
    ?? logo?.formats?.[0]?.src
    ?? null

  const colors = (data.colors ?? [])
    .slice(0, 3)
    .map((c: { hex: string; type: string }) => ({ hex: c.hex, type: c.type }))

  return NextResponse.json({
    name: data.name ?? clean,
    domain: clean,
    logo_url: logoUrl,
    colors,
    description: data.description ?? null,
  })
}
