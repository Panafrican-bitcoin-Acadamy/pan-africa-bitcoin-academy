import { MetadataRoute } from 'next';
import { chaptersContent } from '@/content/chaptersContent';
import { supabaseAdmin } from '@/lib/supabase';

/** Fallback when DB is unavailable at build/request time (matches legacy static IDs). */
const FALLBACK_BLOG_ROUTES: { path: string; lastModified: Date }[] = [
  { path: '/blog/1', lastModified: new Date('2025-03-15T00:00:00.000Z') },
  { path: '/blog/2', lastModified: new Date('2025-03-10T00:00:00.000Z') },
  { path: '/blog/3', lastModified: new Date('2025-03-10T00:00:00.000Z') },
];

async function getPublishedBlogSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from('blog_posts')
      .select('id, slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error || !posts?.length) {
      return FALLBACK_BLOG_ROUTES.map((r) => ({
        url: `${baseUrl}${r.path}`,
        lastModified: r.lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));
    }

    return posts.map((post: { id: string; slug: string | null; published_at?: string | null }) => {
      const segment = post.slug?.trim() || String(post.id);
      const last = post.published_at ? new Date(post.published_at) : new Date();
      return {
        url: `${baseUrl}/blog/${encodeURIComponent(segment)}`,
        lastModified: last,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      };
    });
  } catch {
    return FALLBACK_BLOG_ROUTES.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: r.lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com').replace(/\/$/, '');

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
  }> = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/chapters', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/apply', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/developer-hub', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/mentorship', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/impact', priority: 0.75, changeFrequency: 'monthly' },
    { path: '/donate', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/events', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/sponsor', priority: 0.65, changeFrequency: 'monthly' },
    { path: '/scam', priority: 0.7, changeFrequency: 'monthly' },
  ];

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogEntries = await getPublishedBlogSitemapEntries(baseUrl);

  const chapterEntries: MetadataRoute.Sitemap = chaptersContent.map((chapter) => ({
    url: `${baseUrl}/chapters/${encodeURIComponent(chapter.slug)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  return [...staticEntries, ...blogEntries, ...chapterEntries];
}
