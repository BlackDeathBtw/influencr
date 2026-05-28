import type { Metadata } from 'next'
import LandingPage from '@/components/landing-page'

const BASE_URL = 'https://influencr-five.vercel.app'

export const metadata: Metadata = {
  title: 'influencr — Influencer Marketing Platform for $19/mo',
  description:
    'influencr replaces MightyScout, Grin, Aspire, and DocuSign with one $19/mo platform. CRM, campaign management, contracts, e-sign, content tracking, and payments for influencer marketers.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    url: BASE_URL,
    title: 'influencr — The Influencer Marketing Operating System',
    description:
      'CRM, campaigns, contracts, content approvals, and payments in one place. Everything the $99–$500/mo tools do, at $19/mo.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'influencr',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-image.png`,
      },
      sameAs: [],
      description:
        'influencr is the all-in-one influencer marketing platform for brands and creators. CRM, campaigns, contracts, content tracking, and payments in one tool.',
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'influencr',
      publisher: { '@id': `${BASE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/discover?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'influencr',
      url: BASE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'All-in-one influencer marketing software. Manage influencer CRM, campaigns, contracts, content deadlines, and payments for $19/mo.',
      offers: {
        '@type': 'Offer',
        price: '19.00',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        description: 'Full access to all features. 14-day free trial, no credit card required.',
      },
      featureList: [
        'Influencer CRM',
        'Campaign management',
        'Contract generator with e-sign',
        'Content deadline tracking',
        'Payment log',
        'Creator discovery',
        'Influencer outreach',
        'Media kit pages for creators',
        'Invoice generator for creators',
        'Deal tracker kanban for creators',
      ],
      screenshot: `${BASE_URL}/og-image.png`,
      publisher: { '@id': `${BASE_URL}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: 'influencr — Influencer Marketing Platform for $19/mo',
      isPartOf: { '@id': `${BASE_URL}/#website` },
      about: { '@id': `${BASE_URL}/#software` },
      description:
        'influencr is the influencer marketing operating system for brands and creators. Replace MightyScout, Grin, Aspire, DocuSign, and HoneyBook with one $19/mo platform.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL }],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is influencr different from Grin or Aspire?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Grin and Aspire are built for enterprise teams with 50–200+ influencer relationships and dedicated platform specialists. influencr is built for growing brands — teams of 1 to 5 managing real programs without the $300–500/mo price tag. Same core workflows, honest scope, a fraction of the cost.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I bring my existing influencer list to influencr?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Upload a CSV with any columns you already use — handles, email, niche, rate, notes — and influencr maps them automatically. No data re-entry.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does influencr integrate with Shopify, TikTok, or Instagram?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Not currently. influencr is a workflow and relationship tool — it manages your deals, documents, and deadlines. For platform-native analytics and affiliate tracking, tools like Modash or Triple Whale sit alongside it perfectly.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my data secure on influencr? Who can see my contracts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Campaign data, contracts, and payments are completely private to your account. Creator media kit profiles are public by design — that's their purpose. All data is encrypted at rest and in transit.",
          },
        },
        {
          '@type': 'Question',
          name: 'What happens when the 14-day trial ends?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "You'll be asked to enter a card and pay $19/mo. No charges happen during the trial, no auto-billing, no surprise at day 15. You keep full access to everything you've built.",
          },
        },
        {
          '@type': 'Question',
          name: 'Is influencr really free for creators forever?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Creator profiles, deal tracker, invoice generator, and e-sign are free forever. No credit card, no time limit, no hidden tiers. influencr makes money from brands — creators are always free.',
          },
        },
        {
          '@type': 'Question',
          name: 'What influencer CRM features does influencr include?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'influencr\'s CRM tracks every influencer contact including their social handles, niches, follower counts, engagement rates, and rates. It supports outreach, deal status tracking, content deadlines, and payment history all in one place.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I manage multiple influencer campaigns in influencr?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. influencr supports unlimited campaigns. Each campaign has its own influencer roster, deal pipeline, content deadlines, and payment tracker. You can run multiple campaigns simultaneously.',
          },
        },
      ],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
