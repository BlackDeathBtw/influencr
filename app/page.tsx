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
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '47',
        bestRating: '5',
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
          name: 'What is influencr?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'influencr is an all-in-one influencer marketing platform that combines CRM, campaign management, contract generation with e-sign, content deadline tracking, payment logging, and creator discovery — all for $19/mo.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does influencr cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'influencr costs $19/mo for brands with a 14-day free trial and no credit card required. Creators get free access forever, including a public media kit page, deal tracker, and invoice generator.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does influencr replace?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'influencr replaces MightyScout ($99/mo), Grin ($299+/mo), Aspire ($500+/mo), DocuSign ($45+/mo), and HoneyBook ($39+/mo) with a single $19/mo subscription that covers all influencer marketing workflows.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does influencr have contract generation and e-signing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. influencr includes a built-in contract generator. Brands can generate and send contracts directly from the platform, and creators can e-sign without needing DocuSign or any third-party tool.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is influencr free for content creators?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Creators get a free public media kit profile at influencr.app/c/username, a deal tracker, invoice generator, and the ability to e-sign contracts from brands — all free forever, no credit card required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does influencr have a free trial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. influencr offers a 14-day free trial for brands with no credit card required. You get full access to all features during the trial.',
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
