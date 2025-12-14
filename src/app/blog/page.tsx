'use client';

import { useState } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";

const categories = [
  { id: "all", name: "All", icon: "📚" },
  { id: "essays", name: "Student Essays", icon: "✍️" },
  { id: "community", name: "Community Stories", icon: "🤝" },
  { id: "africa", name: "Bitcoin in Africa", icon: "🌍" },
  { id: "technical", name: "Technical Deep Dives", icon: "💻" },
  { id: "lightning", name: "Lightning Experiments", icon: "⚡" },
  { id: "future", name: "Ideas for the Future", icon: "🔮" },
  { id: "beginner", name: "Beginner Lessons", icon: "📖" },
  { id: "reflections", name: "Reflections & Opinions", icon: "💭" },
  { id: "builders", name: "Builder Showcases", icon: "🛠️" },
  { id: "projects", name: "Graduation Projects", icon: "🎓" },
];

const featuredPosts = [
  {
    id: 1,
    title: "My First Bitcoin Wallet: Lessons in Sovereignty",
    author: "Amina K.",
    authorRole: "Graduate, Cohort 1",
    country: "Nigeria",
    date: "March 15, 2025",
    category: "essays",
    excerpt: "Creating my first Bitcoin wallet wasn't just about technology—it was about understanding what true financial sovereignty means...",
    readTime: "6 min read",
    image: "🌍",
    isGraduate: true,
    sats: "5,000",
  },
  {
    id: 2,
    title: "How Lightning Could Change Payments in My Town",
    author: "David M.",
    authorRole: "Graduate, Cohort 1",
    country: "Kenya",
    date: "March 12, 2025",
    category: "lightning",
    excerpt: "After learning about Lightning Network, I see endless possibilities for instant, low-cost payments in my community...",
    readTime: "8 min read",
    image: "⚡",
    isGraduate: true,
    sats: "3,200",
  },
  {
    id: 3,
    title: "Why Bitcoin Makes Sense for African Youth",
    author: "Fatima A.",
    authorRole: "Graduate, Cohort 1",
    country: "Ghana",
    date: "March 10, 2025",
    category: "africa",
    excerpt: "As a young person in Africa, Bitcoin represents more than money—it's a tool for building the future we want...",
    readTime: "7 min read",
    image: "🌍",
    isGraduate: true,
    sats: "4,500",
  },
];

const blogPosts = [
  {
    id: 4,
    title: "How Bitcoin Helped Me Understand Money for the First Time",
    author: "Kwame O.",
    authorRole: "Graduate, Cohort 1",
    country: "Ghana",
    date: "March 8, 2025",
    category: "essays",
    excerpt: "The academy didn't just teach me about Bitcoin—it taught me what money actually is and why it matters...",
    readTime: "5 min read",
    image: "💭",
    isGraduate: true,
    sats: "2,800",
  },
  {
    id: 5,
    title: "I Sent My First Sats — Here's How It Changed Me",
    author: "Sarah N.",
    authorRole: "Graduate, Cohort 1",
    country: "Nigeria",
    date: "March 5, 2025",
    category: "community",
    excerpt: "Sending my first Lightning payment felt like magic. Here's what I learned from that moment...",
    readTime: "4 min read",
    image: "⚡",
    isGraduate: true,
    sats: "3,100",
  },
  {
    id: 6,
    title: "Bitcoin in Africa in 2030: My Vision",
    author: "Brian M.",
    authorRole: "Graduate, Cohort 1",
    country: "Kenya",
    date: "March 3, 2025",
    category: "future",
    excerpt: "What will Bitcoin adoption look like in Africa by 2030? Here's my vision based on what I've learned...",
    readTime: "9 min read",
    image: "🔮",
    isGraduate: true,
    sats: "6,200",
  },
  {
    id: 7,
    title: "How I Created My First Testnet Transaction",
    author: "Daniel K.",
    authorRole: "Graduate, Cohort 1",
    country: "Nigeria",
    date: "February 28, 2025",
    category: "technical",
    excerpt: "A step-by-step guide to creating your first Bitcoin transaction on testnet, from a student's perspective...",
    readTime: "10 min read",
    image: "💻",
    isGraduate: true,
    sats: "4,800",
  },
  {
    id: 8,
    title: "What I Wish My Community Knew About Bitcoin",
    author: "Aisha K.",
    authorRole: "Graduate, Cohort 1",
    country: "Ghana",
    date: "February 25, 2025",
    category: "essays",
    excerpt: "After learning about Bitcoin, I realized how much my community needs to know. Here's what I want to share...",
    readTime: "6 min read",
    image: "🌍",
    isGraduate: true,
    sats: "3,500",
  },
  {
    id: 9,
    title: "Building Bitcoin Tools With React Native",
    author: "Michael T.",
    authorRole: "Graduate, Cohort 1",
    country: "Kenya",
    date: "February 22, 2025",
    category: "builders",
    excerpt: "As a developer, I'm building mobile Bitcoin tools for African users. Here's what I've learned so far...",
    readTime: "12 min read",
    image: "🛠️",
    isGraduate: true,
    sats: "7,500",
  },
];

const blogOfTheMonth = {
  id: 1,
  title: "My First Bitcoin Wallet: Lessons in Sovereignty",
  author: "Amina K.",
  excerpt: "Creating my first Bitcoin wallet wasn't just about technology—it was about understanding what true financial sovereignty means in a world where our money is controlled by others.",
};

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const getCategoryPosts = (categoryId: string) => {
    return blogPosts.filter(post => post.category === categoryId);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Header Title + Mission */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Bitcoin Stories, Ideas & Experiences
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                A community-driven publication featuring essays, insights, and experiences from graduates of the Pan-Africa Bitcoin Academy — exploring the future of Bitcoin in Africa and beyond.
              </p>
            </div>
          </AnimatedSection>

          {/* Blog of the Month */}
          <AnimatedSection animation="slideRight">
            <div className="mb-16 rounded-xl border-2 border-orange-400/50 bg-gradient-to-br from-orange-500/10 to-cyan-500/10 p-8 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="rounded-full border border-orange-400/30 bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300">
                BLOG OF THE MONTH
              </span>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-orange-200 sm:text-3xl">
              {blogOfTheMonth.title}
            </h2>
            <p className="mb-4 text-base text-zinc-300">{blogOfTheMonth.excerpt}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                  <span>👤</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">{blogOfTheMonth.author}</p>
                  <p className="text-xs text-zinc-500">Graduate, Cohort 1</p>
                </div>
              </div>
              <Link
                href={`/blog/${blogOfTheMonth.id}`}
                className="ml-auto rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-2 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Read Article →
              </Link>
            </div>
            </div>
          </AnimatedSection>

          {/* Featured Articles */}
          <AnimatedSection animation="slideLeft">
            <div className="mb-16">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-50 sm:text-3xl">Featured Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="group relative rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                >
                  {post.isGraduate && (
                    <div className="absolute -top-2 -right-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      🎓 Graduate
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-3xl">{post.image}</span>
                    <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                      {categories.find(c => c.id === post.category)?.name}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
                  <div className="mt-auto space-y-2 border-t border-cyan-400/10 pt-4">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-300">{post.author}</span>
                        <span>•</span>
                        <span>{post.country}</span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{post.date}</span>
                      <span className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                        ⚡ {post.sats} sats
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            </div>
          </AnimatedSection>

          {/* Categories Filter */}
          <AnimatedSection animation="slideRight">
            <div className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-50 sm:text-3xl">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                      : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  {category.id !== "all" && (
                    <span className="rounded-full bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-400">
                      {getCategoryPosts(category.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            </div>
          </AnimatedSection>

          {/* All Posts Grid */}
          <AnimatedSection animation="slideLeft">
            <div className="mb-16">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-50 sm:text-3xl">
              {selectedCategory === "all" ? "All Articles" : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="group relative flex flex-col rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                >
                  {post.isGraduate && (
                    <div className="absolute -top-2 -right-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      🎓
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-2xl">{post.image}</span>
                    <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                      {categories.find(c => c.id === post.category)?.name}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                    {post.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
                  <div className="mt-auto space-y-2 border-t border-cyan-400/10 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                        <span className="text-xs">👤</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-300">{post.author}</p>
                        <p className="text-[10px] text-zinc-500">{post.country} • {post.authorRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{post.date}</span>
                      <div className="flex items-center gap-2">
                        <span>{post.readTime}</span>
                        <span className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                          ⚡ {post.sats}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            </div>
          </AnimatedSection>

          {/* Write for Us CTA */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-cyan-200">Write for Us</h2>
              <p className="mb-2 text-base text-zinc-300">
                Want to publish your Bitcoin story?
              </p>
              <p className="mb-6 text-sm text-zinc-400">
                If you're a graduate of the academy, mentor, or community member, we invite you to share your ideas, experiences, and insights.
              </p>
              <Link
                href="/blog/submit"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
              >
                ✍️ Submit Your Article
              </Link>
            </div>
          </div>

          {/* Submission Guidelines */}
          <div className="rounded-xl border border-purple-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <h2 className="mb-6 text-2xl font-semibold text-purple-200">What We Publish</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-purple-200">Student Essays</h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>How Bitcoin changed your thinking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>What sovereignty means to you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Personal learning journeys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>New Bitcoin habits and practices</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-lg font-semibold text-purple-200">Use Cases & Stories</h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Real-world Bitcoin applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Lightning payment experiences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Teaching family and friends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Community building stories</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-lg font-semibold text-purple-200">Technical & Development</h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Technical deep dives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Development projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Lightning experiments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Builder showcases</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-lg font-semibold text-purple-200">Vision & Ideas</h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Future of Bitcoin in Africa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Development ideas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Community visions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Reflections and opinions</span>
                  </li>
                </ul>
              </div>
            </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
