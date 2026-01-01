import { MetadataRoute } from 'next';
import { chaptersContent } from '@/content/chaptersContent';

// Blog posts data - in production, fetch from database
const blogPosts: Record<number, { id: number; date: string }> = {
  1: { id: 1, date: '2025-03-15' },
  2: { id: 2, date: '2025-03-10' },
  3: { id: 3, date: '2025-03-10' },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

  // Static routes
  const staticRoutes = [
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

  // Blog post routes
  const blogRoutes = Object.values(blogPosts).map((post) => ({
    path: `/blog/${post.id}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(post.date),
  }));

  // Chapter routes
  const chapterRoutes = chaptersContent.map((chapter) => ({
    path: `/chapters/${chapter.slug}`,
    priority: 0.9,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(), // In production, use actual last modified date from database
  }));

  // Combine all routes
  const allRoutes = [
    ...staticRoutes.map((route) => ({
      ...route,
      lastModified: new Date(),
    })),
    ...blogRoutes,
    ...chapterRoutes,
  ];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

