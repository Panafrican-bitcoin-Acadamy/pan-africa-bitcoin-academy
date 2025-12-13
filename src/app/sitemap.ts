import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/chapters', priority: 0.95, changeFrequency: 'weekly' as const },
    { path: '/apply', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/developer-hub', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/faq', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/mentorship', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/impact', priority: 0.75, changeFrequency: 'monthly' as const },
    { path: '/donate', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

