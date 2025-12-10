import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

  const routes = [
    '',
    '/about',
    '/chapters',
    '/apply',
    '/developer-hub',
    '/blog',
    '/faq',
    '/mentorship',
    '/impact',
    '/donate',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : route === '/blog' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/apply' || route === '/developer-hub' ? 0.9 : 0.7,
  }));
}

