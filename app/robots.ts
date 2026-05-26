import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo/brand', '/demo/creator', '/login', '/signup'],
        disallow: [
          '/dashboard',
          '/campaigns',
          '/influencers',
          '/payments',
          '/settings',
          '/portal',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://influencr-five.vercel.app/sitemap.xml',
    host: 'https://influencr-five.vercel.app',
  }
}
