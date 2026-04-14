import { MetadataRoute } from 'next';
import { chaptersContent } from '@/content/chaptersContent';
import { supabaseAdmin } from '@/lib/supabase';

/** Turn DB or CMS paths into absolute URLs for image sitemap entries. */
function toAbsoluteAssetUrl(baseUrl: string, raw: string | null | undefined): string | null {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) return `${baseUrl}${t}`;
  return null;
}

/** Refresh sitemap periodically so new blog posts / events appear without redeploying. */
export const revalidate = 3600;

/** Primary OG image — helps Google discover key brand images (image sitemap extension). */
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

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
      .select('id, slug, published_at, cover_image_url')
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

    return posts.map(
      (post: {
        id: string;
        slug: string | null;
        published_at?: string | null;
        cover_image_url?: string | null;
      }) => {
        const segment = post.slug?.trim() || String(post.id);
        const last = post.published_at ? new Date(post.published_at) : new Date();
        const cover = toAbsoluteAssetUrl(baseUrl, post.cover_image_url);
        const row: MetadataRoute.Sitemap[number] = {
          url: `${baseUrl}/blog/${encodeURIComponent(segment)}`,
          lastModified: last,
          changeFrequency: 'monthly',
          priority: 0.8,
        };
        if (cover) row.images = [cover];
        return row;
      }
    );
  } catch {
    return FALLBACK_BLOG_ROUTES.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: r.lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  }
}

/** Public event detail pages (cohort-only events excluded — same as events listing logic). */
async function getPublicEventSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('events')
      .select('id, start_time')
      .is('cohort_id', null)
      .order('start_time', { ascending: false })
      .limit(200);

    if (error || !rows?.length) return [];

    return rows.map((e: { id: string; start_time?: string | null }) => ({
      url: `${baseUrl}/events/${encodeURIComponent(e.id)}`,
      lastModified: e.start_time ? new Date(e.start_time) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com').replace(/\/$/, '');
  const ogAbsolute = `${baseUrl}${DEFAULT_OG_IMAGE_PATH}`;

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[0]['changeFrequency']>;
    /** Attach image sitemap hints for key landing URLs only. */
    images?: string[];
  }> = [
    { path: '', priority: 1.0, changeFrequency: 'daily', images: [ogAbsolute] },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/chapters', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/white_paper', priority: 0.88, changeFrequency: 'monthly' },
    {
      path: '/bitcoin-in-eritrea',
      priority: 0.92,
      changeFrequency: 'monthly',
    },
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
    { path: '/search', priority: 0.55, changeFrequency: 'weekly' },
  ];

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
    if (route.images?.length) {
      entry.images = route.images;
    }
    return entry;
  });

  const [blogEntries, eventEntries] = await Promise.all([
    getPublishedBlogSitemapEntries(baseUrl),
    getPublicEventSitemapEntries(baseUrl),
  ]);

  const chapterEntries: MetadataRoute.Sitemap = chaptersContent.map((chapter) => {
    const row: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}/chapters/${encodeURIComponent(chapter.slug)}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    };
    for (const section of chapter.sections) {
      const src = section.images?.[0]?.src;
      const abs = toAbsoluteAssetUrl(baseUrl, src);
      if (abs) {
        row.images = [abs];
        break;
      }
    }
    return row;
  });

  return [...staticEntries, ...blogEntries, ...eventEntries, ...chapterEntries];
}
