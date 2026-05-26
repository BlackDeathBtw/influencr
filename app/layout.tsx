import type { Metadata } from 'next'
import { Geist, Urbanist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'influencr — Influencer CRM for $19/mo',
  description: 'Manage campaigns, contracts, and payments. Everything MightyScout and Grin charge $99–$500/mo for, at $19/mo.',
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
