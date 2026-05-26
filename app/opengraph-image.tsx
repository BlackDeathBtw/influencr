import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'influencr — The Influencer Marketing Operating System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'oklch(0.11 0.022 258)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#d4a827',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            influencer marketing platform
          </span>
        </div>

        {/* Middle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ fontSize: '88px', fontWeight: 900, color: '#ffffff', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
            influencr
          </div>
          <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.55)', maxWidth: '700px', lineHeight: 1.4 }}>
            CRM, campaigns, contracts, content &amp; payments. Everything the $99–$500/mo tools do, at{' '}
            <span style={{ color: '#d4a827', fontWeight: 700 }}>$19/mo.</span>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['Influencer CRM', 'Campaigns', 'Contracts', 'Payments'].map((f) => (
              <span key={f} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>
                {f}
              </span>
            ))}
          </div>
          <div
            style={{
              background: '#d4a827',
              color: '#1a1200',
              padding: '12px 28px',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Start free trial
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
