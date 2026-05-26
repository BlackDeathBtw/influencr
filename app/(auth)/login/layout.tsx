import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in to influencr',
  description: 'Sign in to your influencr account to manage influencer campaigns, contracts, and payments.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
