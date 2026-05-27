'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

interface BrandData {
  name: string
  domain: string
  logo_url: string | null
  colors: { hex: string; type: string }[]
  description: string | null
}

export default function BrandKitSection() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetch_brand() {
    if (!domain.trim()) return
    setLoading(true)
    setError(null)
    setBrand(null)
    const res = await fetch(`/api/integrations/brandfetch?domain=${encodeURIComponent(domain.trim())}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not fetch brand data')
      return
    }
    setBrand(data)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="font-semibold text-foreground mb-1">Brand kit</h2>
      <p className="text-xs text-muted-foreground mb-4">Pull your logo and brand colors from your domain. Used in contracts and campaign briefs.</p>
      <div className="flex gap-2 mb-4">
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetch_brand()}
          placeholder="yourbrand.com"
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={fetch_brand}
          disabled={loading || !domain.trim()}
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors hover:bg-foreground"
        >
          <Wand2 size={13} />
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      {brand && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            {brand.logo_url && (
              <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded-lg object-contain bg-white p-1" />
            )}
            <div>
              <p className="font-semibold text-foreground">{brand.name}</p>
              <p className="text-xs text-muted-foreground">{brand.domain}</p>
            </div>
          </div>
          {brand.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{brand.description}</p>
          )}
          {brand.colors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Brand colors</p>
              <div className="flex gap-2">
                {brand.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs font-mono text-muted-foreground">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {brand.logo_url && (
            <p className="text-xs text-muted-foreground/60">Logo URL saved — will appear on generated contracts.</p>
          )}
        </div>
      )}
    </div>
  )
}
