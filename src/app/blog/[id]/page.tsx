import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ShareButtons } from "@/components/ShareButtons";

type BlogPostPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    // Get base URL from headers or environment
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    
    const res = await fetch(`${baseUrl}/api/blog/${id}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return {
        title: 'Blog Post Not Found',
      };
    }
    
    const data = await res.json();
    const post = data.post;
    
    if (!post) {
      return {
        title: 'Blog Post Not Found',
      };
    }

    return {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160) + '...',
      alternates: {
        canonical: `/blog/${post.slug || id}`,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160) + '...',
        url: `/blog/${post.slug || id}`,
        type: 'article',
        authors: [post.author],
        publishedTime: post.publishedAt || post.createdAt,
      },
    };
  } catch (error) {
    return {
      title: 'Blog Post',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  
  let post;
  try {
    // Get base URL from headers or environment
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    
    const res = await fetch(`${baseUrl}/api/blog/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      notFound();
    }
    
    const data = await res.json();
    post = data.post;
    
    if (!post) {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            ← Back to Blog
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                {post.category === "pre-education" ? "Pre-Education Ideas" : post.category}
              </span>
              {post.category === "pre-education" && (
                <span className="rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
                  💡 Pre-Education Ideas
                </span>
              )}
              {post.isAcademyStudent && post.category !== "pre-education" && (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                  🎓 Academy Student
                  {post.studentCohort && ` • ${post.studentCohort}`}
                </span>
              )}
              {!post.isAcademyStudent && post.authorRole?.toLowerCase().includes('graduate') && post.category !== "pre-education" && (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                  🎓 Written by Academy Graduate
                </span>
              )}
              <span className="text-2xl">{post.image}</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">{post.author}</p>
                  <p className="text-xs text-zinc-500">{post.country ? `${post.country} • ` : ''}{post.authorRole}</p>
                </div>
              </div>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Sats Tipping */}
          <div className="mb-8 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-orange-200">Support the Author</h3>
                <p className="text-sm text-zinc-400">Tip the author with sats via Lightning Network</p>
                {post.satsAmount > 0 && (
                  <p className="mt-1 text-xs text-orange-300">
                    Total tips received: {post.satsAmount.toLocaleString()} sats
                  </p>
                )}
              </div>
              <form action="/api/blog/tip" method="POST">
                <input type="hidden" name="postId" value={post.id} />
                <button 
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  ⚡ Tip 1,000 sats
                </button>
              </form>
            </div>
            <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
              <p className="text-xs text-zinc-400">
                <span className="font-semibold text-orange-300">Note:</span> Lightning tips go directly to the author. 
                Scan QR code or use LNURL to send sats instantly.
              </p>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-invert prose-cyan max-w-none">
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              <MarkdownContent content={post.content} />
            </div>
          </article>

          {/* Author Profile */}
          <div className="mt-12 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <h3 className="mb-4 text-lg font-semibold text-cyan-200">About the Author</h3>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-zinc-50">{post.author}</h4>
                  {post.category === "pre-education" && (
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/20 px-2 py-1 text-[10px] font-bold text-purple-300">
                      💡 Pre-Education
                    </span>
                  )}
                  {post.isAcademyStudent && post.category !== "pre-education" && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      🎓 Academy Student
                      {post.studentCohort && ` • ${post.studentCohort}`}
                    </span>
                  )}
                  {!post.isAcademyStudent && post.category !== "pre-education" && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      🎓 Graduate
                    </span>
                  )}
                </div>
                <p className="mb-2 text-sm text-zinc-400">{post.authorRole}</p>
                <p className="mb-3 text-sm text-zinc-300">
                  {post.authorBio || 'Graduate of the Pan-Africa Bitcoin Academy passionate about Bitcoin adoption in Africa. Building tools and educating communities about financial sovereignty.'}
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-cyan-300 transition hover:text-cyan-200"
                    aria-label="Follow on Nostr"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.5 2L3 13h7.5l-1 9 10.5-11h-7.5l1-9z"/>
                    </svg>
                    <span>Nostr</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <ShareButtons title={post.title} slug={post.slug} id={id} />

          {/* CTA to Write */}
          <div className="mt-12 rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <h3 className="mb-4 text-xl font-semibold text-orange-200">Want to Share Your Story?</h3>
            <p className="mb-6 text-sm text-zinc-300">
              Are you a graduate? Submit your own blog post about Bitcoin, your ideas, or your journey.
            </p>
            <Link
              href="/blog/submit"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
            >
              Submit Your Blog Post
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

