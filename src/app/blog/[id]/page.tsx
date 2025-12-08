import Link from "next/link";
import { notFound } from "next/navigation";

const blogPosts: Record<number, {
  id: number;
  title: string;
  author: string;
  authorRole: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  content: string;
}> = {
  1: {
    id: 1,
    title: "How I'm Using Bitcoin to Build Financial Sovereignty in Nigeria",
    author: "Amina K.",
    authorRole: "Graduate, Cohort 1",
    date: "March 15, 2025",
    category: "Use Cases",
    readTime: "5 min read",
    image: "🌍",
    content: `After completing the Bitcoin Academy, I've started using Lightning Network for daily transactions and helping my community understand Bitcoin. The journey from learning to implementation has been transformative.

## My Bitcoin Journey

When I first enrolled in the Bitcoin Academy, I had no idea how much this technology would change my perspective on money and financial independence. The course opened my eyes to the possibilities of decentralized finance.

## Practical Applications

I've been using Lightning Network for:
- Sending money to family members instantly
- Paying for services in my local community
- Building a small business that accepts Bitcoin payments

## Community Impact

The most rewarding part has been teaching others. I've started a small meetup group where we discuss Bitcoin and help each other learn. The community aspect is just as important as the technology itself.

## Looking Forward

I'm excited to see how Bitcoin continues to evolve and how we can build more tools that serve our communities in Africa.`,
  },
  2: {
    id: 2,
    title: "The Future of Bitcoin Development: What Africa Needs",
    author: "David M.",
    authorRole: "Graduate, Cohort 1",
    date: "March 10, 2025",
    category: "Development",
    readTime: "7 min read",
    image: "💻",
    content: `As a developer, I see huge potential for Bitcoin in Africa. Here's what we need to build next...

## Current State

Bitcoin adoption in Africa is growing, but we need more tools built specifically for our context. The existing tools are great, but they don't always address our unique challenges.

## What We Need

1. **Better Mobile Wallets**: We need wallets that work well on low-end smartphones
2. **Local Payment Integration**: Connecting Bitcoin to local payment systems
3. **Educational Tools**: More resources in local languages
4. **Developer Tools**: Better documentation and tooling for African developers

## My Vision

I believe we can build a thriving Bitcoin ecosystem in Africa that serves our communities while contributing to the global Bitcoin network.`,
  },
  3: {
    id: 3,
    title: "Why Bitcoin Makes Sense for African Youth",
    author: "Fatima A.",
    authorRole: "Graduate, Cohort 1",
    date: "March 10, 2025",
    category: "Bitcoin in Africa",
    readTime: "7 min read",
    image: "🌍",
    content: `As a young person in Africa, Bitcoin represents more than money—it's a tool for building the future we want.

## My Perspective

Growing up, I've seen how traditional financial systems often exclude young people and limit our opportunities. Bitcoin changes that equation entirely.

## Why Bitcoin Matters for Us

1. **Financial Inclusion**: Bitcoin doesn't require a bank account or credit history
2. **Global Access**: We can participate in the global economy without barriers
3. **Sovereignty**: We control our own money, no intermediaries needed
4. **Opportunity**: Bitcoin opens doors to new economic possibilities

## Real-World Impact

Since learning about Bitcoin, I've started using it for:
- Receiving payments from international clients
- Saving money that can't be inflated away
- Teaching my peers about financial sovereignty

## The Future

I believe African youth will be at the forefront of Bitcoin adoption. We understand the need for better money, and we're ready to build the tools and communities that will make Bitcoin thrive across our continent.`,
  },
  // Add more posts as needed
};

export default function BlogPostPage({ params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  const post = blogPosts[postId];

  if (!post) {
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
                {post.category}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                🎓 Written by Academy Graduate
              </span>
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
                  <p className="text-xs text-zinc-500">Nigeria • {post.authorRole}</p>
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
              </div>
              <button className="rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110">
                ⚡ Tip 1,000 sats
              </button>
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
              <div className="space-y-6 text-base leading-relaxed text-zinc-300 whitespace-pre-line">
                {post.content}
              </div>
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
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                    🎓 Graduate
                  </span>
                </div>
                <p className="mb-2 text-sm text-zinc-400">{post.authorRole}</p>
                <p className="mb-3 text-sm text-zinc-300">
                  Graduate of the Bitcoin Academy passionate about Bitcoin adoption in Africa. 
                  Building tools and educating communities about financial sovereignty.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://nostr.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-300 transition hover:text-cyan-200"
                  >
                    Follow on Nostr →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="mt-6 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <h3 className="mb-4 text-lg font-semibold text-purple-200">Share This Post</h3>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20">
                Share on X
              </button>
              <button className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-400/20">
                Share on Nostr
              </button>
              <button className="rounded-lg border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/20">
                Copy Link
              </button>
            </div>
          </div>

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

