import type { Metadata } from 'next'
import { Geist, Urbanist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700', '800', '900'],
})

const BASE_URL = 'https://influencr-five.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'influencr — Influencer Marketing Platform for $19/mo',
    template: '%s | influencr',
  },
  description:
    'influencr is the all-in-one influencer marketing platform: CRM, campaign management, contracts, content approvals, and payments. Replace MightyScout, Grin, and DocuSign for $19/mo.',
  keywords: [
    'influencer marketing platform',
    'influencer CRM',
    'campaign management software',
    'influencer contract generator',
    'creator management tool',
    'influencer outreach platform',
    'brand influencer deals',
    'influencer payment tracking',
    'cheap influencer marketing software',
    'MightyScout alternative',
    'Grin alternative',
    'Aspire alternative',
  ],
  authors: [{ name: 'influencr' }],
  creator: 'influencr',
  publisher: 'influencr',
  category: 'Software',
  applicationName: 'influencr',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'influencr',
    title: 'influencr — Influencer Marketing Platform for $19/mo',
    description:
      'CRM, campaigns, contracts, content approvals, and payments in one place. Everything the $99–$500/mo tools do, at $19/mo.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'influencr — The Influencer Marketing Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'influencr — Influencer Marketing Platform for $19/mo',
    description:
      'CRM, campaigns, contracts, content approvals, and payments in one place. Everything the $99–$500/mo tools do, at $19/mo.',
    images: ['/og-image.png'],
    creator: '@influencr',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${urbanist.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
