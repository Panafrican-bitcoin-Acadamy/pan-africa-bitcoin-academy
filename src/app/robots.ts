import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard/',
          '/admin/',
          '/exam',
          '/setup-password',
          '/reset-password',
          '/verify-email',
          '/assignments/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

