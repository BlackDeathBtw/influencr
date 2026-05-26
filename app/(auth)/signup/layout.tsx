import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get started free — influencr',
  description:
    'Create your influencr account. Brands get a 14-day free trial with full access. Creators get free tools forever including a public media kit, deal tracker, and invoice generator.',
  alternates: { canonical: 'https://influencr-five.vercel.app/signup' },
  openGraph: {
    title: 'Get started free — influencr',
    description:
      'Start your free 14-day trial. No credit card required. Brands pay $19/mo. Creators are free forever.',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
