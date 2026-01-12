import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { getChapterBySlug, chaptersContent } from "@/content/chaptersContent";
import { ChapterAccessCheck } from "./ChapterAccessCheck";
import { ChapterCompletionTracker } from "./ChapterCompletionTracker";
import { NextChapterButton } from "./NextChapterButton";
import { LiveBlockchainData } from "@/components/LiveBlockchainData";
import { AdminModeWrapper } from "@/components/AdminModeWrapper";
import { ChapterAssignment } from "@/components/ChapterAssignment";
import { Chapter6Assignment } from "@/components/Chapter6Assignment";
import { Chapter8Assignment } from "@/components/Chapter8Assignment";
import { Chapter18Assignment } from "@/components/Chapter18Assignment";
import { ChapterUTXOAssignment } from "@/components/ChapterUTXOAssignment";
import { Chapter14HalvingPuzzle } from "@/components/Chapter14HalvingPuzzle";
import type { Metadata } from "next";

type ChapterPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);
  
  if (!chapter) {
    return {
      title: 'Chapter Not Found',
    };
  }

  return {
    title: `Chapter ${chapter.number}: ${chapter.title}`,
    description: chapter.hook || `Learn about ${chapter.title} in the PanAfrican Bitcoin Academy curriculum.`,
    alternates: {
      canonical: `/chapters/${slug}`,
    },
    openGraph: {
      title: `Chapter ${chapter.number}: ${chapter.title}`,
      description: chapter.hook || `Learn about ${chapter.title} in the PanAfrican Bitcoin Academy curriculum.`,
      url: `/chapters/${slug}`,
    },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  
  if (!slug) {
    notFound();
  }
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    const titleFromSlug = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return (
      <PageContainer
        title={`Chapter: ${titleFromSlug}`}
        subtitle="This chapter is part of the Pan-Africa Bitcoin Academy curriculum. Full content coming soon."
      >
        <div className="space-y-8 text-sm text-zinc-100 sm:text-base">
          <section className="rounded-xl border border-zinc-800/50 bg-zinc-950 p-4 sm:p-5 shadow-inner">
            <h2 className="text-sm font-semibold text-zinc-100 sm:text-base">
              Chapter Content
            </h2>
            <p className="mt-2 text-sm text-zinc-200">
              This chapter is being developed. Please check back soon for the full lesson content.
            </p>
          </section>
        </div>
      </PageContainer>
    );
  }

  const nextChapter =
    chapter.nextSlug && chaptersContent.find((c) => c.slug === chapter.nextSlug);
  
  const previousChapter = chapter.number > 1
    ? chaptersContent.find((c) => c.number === chapter.number - 1)
    : null;

  return (
    <AdminModeWrapper>
      <ChapterAccessCheck chapterNumber={chapter.number} chapterSlug={chapter.slug}>
        <ChapterCompletionTracker chapterNumber={chapter.number} chapterSlug={chapter.slug} />
        <PageContainer
      title={`${chapter.number < 10 ? `Chapter ${chapter.number}` : `Chapter ${chapter.number}`} · ${chapter.title}`}
      subtitle={`${chapter.level} · ${chapter.duration} · ${chapter.type}`}
    >
      <div className="space-y-8 text-sm text-zinc-100 sm:text-base">
        {/* Hero */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-950 p-5 sm:p-6 shadow-inner">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-cyan-300/90">
                <span className="rounded-full border border-cyan-400/40 px-2 py-0.5">
                  {chapter.level}
                </span>
                <span className="rounded-full border border-orange-400/40 px-2 py-0.5">
                  {chapter.type}
                </span>
                <span className="rounded-full border border-purple-400/40 px-2 py-0.5">
                  {chapter.duration}
                </span>
              </div>
              <p className="text-lg font-semibold text-zinc-100 sm:text-xl">
                {chapter.hook}
              </p>
            </div>
            <div className="flex gap-2">
              {previousChapter ? (
                <Link
                  href={`/chapters/${previousChapter.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-purple-400/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:border-purple-400/70 hover:bg-purple-500/20"
                >
                  ← Chapter {previousChapter.number}
                </Link>
              ) : null}
              {nextChapter ? (
                <NextChapterButton
                  nextChapterSlug={nextChapter.slug}
                  nextChapterNumber={nextChapter.number}
                  currentChapterNumber={chapter.number}
                  currentChapterSlug={chapter.slug}
                  variant="top"
                />
              ) : null}
            </div>
          </div>
        </section>

        {/* What you will learn */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-950 p-5 sm:p-6 shadow-inner">
          <h2 className="text-base font-semibold text-zinc-100 sm:text-lg">
            What You Will Learn
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-200">
            {chapter.learn.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Main lesson content */}
        <section className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-950 p-5 sm:p-6 shadow-inner">
          <h2 className="text-base font-semibold text-zinc-100 sm:text-lg">
            Main Lesson Content
          </h2>
          <div className="space-y-5">
            {chapter.sections.map((section, sectionIdx) => {
              const sectionId = `section-${sectionIdx}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return (
              <div key={section.heading} id={sectionId} className="scroll-mt-20 rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner">
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl mb-3 pb-2 border-b border-zinc-800/50">
                  {section.heading}
                </h3>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="mt-3 text-zinc-200 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-200 leading-relaxed">
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {section.callouts?.map((callout, idx) => {
                  // Skip example callout for section 3.1 - it will be rendered after images
                  if (section.heading === "3.1 Inflation and Loss of Purchasing Power" && callout.type === "example") {
                    return null;
                  }
                  return (
                  <div
                    key={idx}
                    className={`mt-4 rounded-lg border p-4 bg-zinc-900/80 ${
                      callout.type === "note"
                        ? "border-cyan-900/50 text-cyan-100"
                        : callout.type === "tip"
                        ? "border-green-900/50 text-green-100"
                        : callout.type === "warning"
                        ? "border-red-900/50 text-red-100"
                        : "border-orange-900/50 text-orange-100"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">
                        {callout.type === "note"
                          ? "📝 Note:"
                          : callout.type === "tip"
                          ? "💡 Tip:"
                          : callout.type === "warning"
                          ? "⚠️ Warning:"
                          : "📖 Example:"}
                      </span>
                      <div className="flex-1 text-sm">
                        {(() => {
                          const parts: React.ReactNode[] = [];
                          const content = callout.content;
                          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                          let lastIndex = 0;
                          let match;
                          let key = 0;

                          while ((match = linkRegex.exec(content)) !== null) {
                            // Add text before the link
                            if (match.index > lastIndex) {
                              parts.push(<span key={key++}>{content.substring(lastIndex, match.index)}</span>);
                            }
                            // Add the link
                            const [, linkText, linkUrl] = match;
                            parts.push(
                              <a
                                key={key++}
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-300 underline hover:text-cyan-200"
                              >
                                {linkText}
                              </a>
                            );
                            lastIndex = linkRegex.lastIndex;
                          }
                          // Add remaining text after last link
                          if (lastIndex < content.length) {
                            parts.push(<span key={key++}>{content.substring(lastIndex)}</span>);
                          }
                          return parts.length > 0 ? parts : <span>{content}</span>;
                        })()}
                      </div>
                    </div>
                    </div>
                  );
                })}
                {section.heading === "7.0 What Is a Block?" ? (
                  // Special rendering for live blockchain data
                  <div className="mt-6">
                    <LiveBlockchainData />
                  </div>
                ) : section.heading === "6.1 Public/Private Keys Explained Simply" ? (
                  // Special rendering for public/private key examples
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Public Key Example */}
                      <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-5">
                        <h4 className="text-base font-semibold text-cyan-200 mb-3">Public Key Example</h4>
                        <p className="text-xs text-cyan-300 mb-3">This is what others use to send you Bitcoin</p>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-cyan-400/20">
                          <p className="text-xs text-cyan-100 font-mono break-all">
                            02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5fb
                          </p>
                        </div>
                        <p className="text-xs text-cyan-400 mt-2 italic">Or as a Bitcoin address:</p>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-cyan-400/20 mt-2">
                          <p className="text-xs text-cyan-100 font-mono break-all">
                            1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
                          </p>
                        </div>
                      </div>
                      {/* Private Key Example */}
                      <div className="rounded-lg border border-orange-400/30 bg-orange-500/10 p-5">
                        <h4 className="text-base font-semibold text-orange-200 mb-3">Private Key Example</h4>
                        <p className="text-xs text-orange-300 mb-3">Keep this secret and secure - never share it!</p>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-orange-400/20">
                          <p className="text-xs text-orange-100 font-mono break-all">
                            5KJvsngHeMooDxQjypVsHmNi6yFcd2PHYVvHdY8kVoDBNswkdXmi
                          </p>
                        </div>
                        <p className="text-xs text-orange-400 mt-2 italic">Or in hex format:</p>
                        <div className="bg-zinc-900 rounded-lg p-4 border border-orange-400/20 mt-2">
                          <p className="text-xs text-orange-100 font-mono break-all">
                            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : section.heading === "7.4 Why Blockchain Matters" ? (
                  // Special rendering for blockchain demo link
                  <div className="mt-6">
                    <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-6">
                      <h4 className="mb-3 text-base font-semibold text-cyan-200">Interactive Blockchain Demo</h4>
                      <p className="mb-4 text-sm text-zinc-300">
                        Explore how blocks, hashes, and blockchain work together in this interactive demonstration. 
                        You can experiment with creating blocks, changing data, and seeing how the hash changes.
                      </p>
                      <a
                        href="https://andersbrownworth.com/blockchain"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 font-semibold text-black transition hover:brightness-110"
                      >
                        <span>🔗 Try Blockchain Demo</span>
                        <span className="text-sm">→</span>
                      </a>
                      <p className="mt-3 text-xs text-zinc-400">
                        This demo covers: Hash functions, Block structure, Blockchain linking, and Distributed consensus
                      </p>
                    </div>
                  </div>
                ) : section.heading === "13.2 Halving Schedule and Fixed Supply (Declining Inflation)" ? (
                  // Special rendering for halving periods table
                  <div className="mt-6">
                    <div className="overflow-x-auto rounded-lg border border-purple-400/25 bg-zinc-950/70">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-purple-400/30 bg-purple-500/10">
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">Period Start Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">Period End Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">Block Height Range</th>
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">Subsidy per Block (BTC)</th>
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">BTC Created in Period</th>
                            <th className="px-4 py-3 text-left font-semibold text-purple-200">Total BTC Issued at End</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">2009-01-03</td>
                            <td className="px-4 py-3">2012-11-28</td>
                            <td className="px-4 py-3 font-mono text-xs">0 – 209,999</td>
                            <td className="px-4 py-3 font-mono">50.00000000</td>
                            <td className="px-4 py-3 font-mono">10,500,000.00000000</td>
                            <td className="px-4 py-3 font-mono">10,500,000.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">2012-11-28</td>
                            <td className="px-4 py-3">2016-07-09</td>
                            <td className="px-4 py-3 font-mono text-xs">210,000 – 419,999</td>
                            <td className="px-4 py-3 font-mono">25.00000000</td>
                            <td className="px-4 py-3 font-mono">5,250,000.00000000</td>
                            <td className="px-4 py-3 font-mono">15,750,000.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">2016-07-09</td>
                            <td className="px-4 py-3">2020-05-11</td>
                            <td className="px-4 py-3 font-mono text-xs">420,000 – 629,999</td>
                            <td className="px-4 py-3 font-mono">12.50000000</td>
                            <td className="px-4 py-3 font-mono">2,625,000.00000000</td>
                            <td className="px-4 py-3 font-mono">18,375,000.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">2020-05-11</td>
                            <td className="px-4 py-3">2024-04-20</td>
                            <td className="px-4 py-3 font-mono text-xs">630,000 – 839,999</td>
                            <td className="px-4 py-3 font-mono">6.25000000</td>
                            <td className="px-4 py-3 font-mono">1,312,500.00000000</td>
                            <td className="px-4 py-3 font-mono">19,687,500.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">2024-04-20</td>
                            <td className="px-4 py-3">~2028-03</td>
                            <td className="px-4 py-3 font-mono text-xs">840,000 – 1,049,999</td>
                            <td className="px-4 py-3 font-mono">3.12500000</td>
                            <td className="px-4 py-3 font-mono">656,250.00000000</td>
                            <td className="px-4 py-3 font-mono">20,343,750.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">~2028-03</td>
                            <td className="px-4 py-3">~2032-02</td>
                            <td className="px-4 py-3 font-mono text-xs">1,050,000 – 1,259,999</td>
                            <td className="px-4 py-3 font-mono">1.56250000</td>
                            <td className="px-4 py-3 font-mono">328,125.00000000</td>
                            <td className="px-4 py-3 font-mono">20,671,875.00000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">~2032-02</td>
                            <td className="px-4 py-3">~2036-01</td>
                            <td className="px-4 py-3 font-mono text-xs">1,260,000 – 1,469,999</td>
                            <td className="px-4 py-3 font-mono">0.78125000</td>
                            <td className="px-4 py-3 font-mono">164,062.50000000</td>
                            <td className="px-4 py-3 font-mono">20,835,937.50000000</td>
                          </tr>
                          <tr className="border-b border-purple-400/10 hover:bg-purple-500/5">
                            <td className="px-4 py-3">~2036-01</td>
                            <td className="px-4 py-3">~2040-01</td>
                            <td className="px-4 py-3 font-mono text-xs">1,470,000 – 1,679,999</td>
                            <td className="px-4 py-3 font-mono">0.39062500</td>
                            <td className="px-4 py-3 font-mono">82,031.25000000</td>
                            <td className="px-4 py-3 font-mono">20,917,968.75000000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-xs text-zinc-400 italic">
                      (Issuance continues with the same halving logic until the subsidy reaches 0 satoshis around the year 2140.)
                    </p>
                    <div className="mt-4 rounded-lg border border-orange-400/30 bg-orange-500/10 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-orange-200">Warning: Important Precision Notes</h4>
                      <div className="space-y-2 text-sm text-orange-100">
                        <p>Blocks define supply, not dates.</p>
                        <p>Dates are an observation. Block height is the law.</p>
                        <p>Every number above can be verified by multiplying: blocks in period × subsidy per block = BTC created in period.</p>
                      </div>
                    </div>
                  </div>
                ) : section.images && section.images.length > 0 && (
                  section.heading === "Introduction" && section.images.length === 5 ? (
                    // Circular layout for Introduction section with 5 images
                    <div className="mt-16 sm:mt-24 lg:mt-12 mb-24 sm:mb-32 lg:mb-6 flex items-center justify-center w-full overflow-hidden lg:overflow-visible">
                      <div className="relative w-full sm:max-w-3xl lg:max-w-lg aspect-square overflow-visible">
                        {/* Futuristic arrows showing the flow: Left (banana) → Right (banana→shoes) → Bottom (shoes→bread) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                          <defs>
                            {/* Glow filter for futuristic effect */}
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            {/* Futuristic arrowhead */}
                            <marker id="arrowhead-futuristic" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
                              <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="#f97316" filter="url(#glow)" />
                            </marker>
                            {/* Animated gradient */}
                            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                              <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                            </linearGradient>
                          </defs>
                          {/* Arrow from Left (banana) to Right (banana→shoes) */}
                          <path
                            d="M 5 50 L 95 50"
                            stroke="url(#arrowGradient)"
                            strokeWidth="4"
                            fill="none"
                            markerEnd="url(#arrowhead-futuristic)"
                            filter="url(#glow)"
                            className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                          />
                          {/* Arrow from Right (banana→shoes) to Bottom (shoes→bread) */}
                          <path
                            d="M 50 50 L 50 98"
                            stroke="url(#arrowGradient)"
                            strokeWidth="4"
                            fill="none"
                            markerEnd="url(#arrowhead-futuristic)"
                            filter="url(#glow)"
                            className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                          />
                        </svg>
                        
                        {/* Center image (barter_system) */}
                        <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/3 z-10 w-[21rem] sm:w-[27rem] lg:w-36">
                          <img
                            src={section.images[3].src}
                            alt={section.images[3].alt}
                            className="w-full rounded-lg border border-orange-400/20"
                          />
                          {section.images[3].caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {section.images[3].caption}
                            </p>
                          )}
                        </div>
                        {/* Top image */}
                        <div className="absolute -top-16 sm:-top-20 lg:top-[5%] left-1/2 transform -translate-x-1/2 lg:-translate-y-1/5 w-[9rem] sm:w-[12rem] lg:w-[9rem] z-20">
                          <img
                            src={section.images[0].src}
                            alt={section.images[0].alt}
                            className="w-full rounded-lg border border-orange-400/20"
                          />
                          {section.images[0].caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {section.images[0].caption}
                            </p>
                          )}
                        </div>
                        {/* Right image */}
                        <div className="absolute top-1/2 -right-16 sm:-right-20 lg:right-[2%] transform -translate-y-1/2 translate-x-full w-[9rem] sm:w-[12rem] lg:w-[9rem] z-20">
                          <img
                            src={section.images[1].src}
                            alt={section.images[1].alt}
                            className="w-full rounded-lg border border-orange-400/20"
                          />
                          {section.images[1].caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {section.images[1].caption}
                            </p>
                          )}
                        </div>
                        {/* Bottom image */}
                        <div className="absolute -bottom-24 sm:-bottom-32 lg:bottom-[5%] left-1/2 transform -translate-x-1/2 lg:translate-y-1/2 w-[9rem] sm:w-[12rem] lg:w-[9rem] z-20">
                          <img
                            src={section.images[4].src}
                            alt={section.images[4].alt}
                            className="w-full rounded-lg border border-orange-400/20"
                          />
                          {section.images[4].caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {section.images[4].caption}
                            </p>
                          )}
                        </div>
                        {/* Left image */}
                        <div className="absolute top-1/2 -left-16 sm:-left-20 lg:left-[2%] transform -translate-y-1/2 -translate-x-full w-[9rem] sm:w-[12rem] lg:w-[9rem] z-20">
                          <img
                            src={section.images[2].src}
                            alt={section.images[2].alt}
                            className="w-full rounded-lg border border-orange-400/20"
                          />
                          {section.images[2].caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {section.images[2].caption}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Default layout for other sections
                    section.heading === "1.3 Properties of Sound Money" && section.images.length > 1 ? (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {section.images.map((image, idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-3">
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="w-full rounded-lg border border-orange-400/20 shadow-lg"
                            />
                            {image.caption && (
                              <p className="text-center text-sm text-zinc-200 leading-relaxed px-2">
                                {image.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : section.heading === "3.1 Inflation and Loss of Purchasing Power" && section.images.length >= 4 ? (
                      // Special layout: first 3 images (animals, arrow, animals) in a row, then the 4th image below, then Zimbabwe images side by side
                      <div className="mt-6 space-y-6">
                        <div className="flex flex-col items-center mb-4">
                          <p className="text-lg font-semibold text-orange-200">20 Years ago: 40,000 UGX → Now: 4,000,000 UGX</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                          {section.images.slice(0, 3).map((image, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              {idx === 0 && (
                                <p className="mb-2 text-base font-semibold text-orange-200">20 Years ago</p>
                              )}
                              {idx === 2 && (
                                <p className="mb-2 text-base font-semibold text-orange-200">Now</p>
                              )}
                              <img
                                src={image.src}
                                alt={image.alt}
                                className={`rounded-lg border border-orange-400/20 shadow-lg ${image.src.includes('arrow') ? 'w-32 h-16 sm:w-40 sm:h-20 object-contain' : 'w-48 sm:w-64'}`}
                              />
                              {image.caption && (
                                <p className="mt-2 text-center text-xs text-zinc-400 italic">
                                  {image.caption}
                                </p>
                              )}
                  </div>
                ))}
                        </div>
                        {/* Example callout before Zimbabwe images for section 3.1 */}
                        {section.callouts?.find(c => c.type === "example") && (
                          <div className="rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-orange-100">📖 Example:</span>
                              <p className="flex-1 text-sm text-orange-100">
                                {section.callouts.find(c => c.type === "example")?.content}
                              </p>
                            </div>
                          </div>
                        )}
                        {section.images.length >= 5 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {section.images.slice(3, 5).map((image, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                    <img
                      src={image.src}
                      alt={image.alt}
                                  className="w-full rounded-lg border border-orange-400/20 shadow-lg"
                    />
                    {image.caption && (
                      <p className="mt-2 text-center text-xs text-zinc-400 italic">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
                          </div>
                        )}
                      </div>
                    ) : section.heading === "3.2 Centralized Control — Governments and Banks" && section.images.length === 2 ? (
                      // Special layout for Centralized Control section with title below images
                      <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {section.images.map((image, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <img
                                src={image.src}
                                alt={image.alt}
                                className="w-full rounded-lg border border-orange-400/20 shadow-lg"
                              />
                              {image.caption && (
                                <p className="mt-3 text-center text-sm text-zinc-200 leading-relaxed px-2">
                                  {image.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-orange-200">Centralized control over money</p>
                        </div>
                      </div>
                    ) : section.images.length === 2 ? (
                      // Side by side layout for sections with exactly 2 images
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.images.map((image, idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-3">
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="w-full rounded-lg border border-orange-400/20 shadow-lg"
                            />
                            {image.caption && (
                              <p className="text-center text-sm text-zinc-200 leading-relaxed px-2">
                                {image.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      section.images.map((image, idx) => (
                        <div key={idx} className={`mt-4 ${image.src.includes('money_usage') || image.src.includes('chinese_first_fiat_money') || image.src.includes('jade.png') ? 'flex flex-col items-center' : ''}`}>
                          <img
                            src={image.src}
                            alt={image.alt}
                            className={`rounded-lg border border-orange-400/20 ${image.src.includes('money_usage') || image.src.includes('chinese_first_fiat_money') ? 'w-64 sm:w-80 max-w-full' : image.src.includes('jade.png') ? 'w-48 sm:w-64 max-w-full' : 'w-full'}`}
                          />
                          {image.caption && (
                            <p className="mt-2 text-center text-xs text-zinc-400 italic">
                              {image.caption}
                            </p>
                          )}
                          {image.src.includes('money_usage') && section.bullets && (
                            <div className="mt-4 w-full max-w-2xl space-y-3">
                              <h4 className="text-base font-semibold text-orange-200 text-center">The three essential functions of money:</h4>
                              <ul className="space-y-2 text-zinc-100 text-base leading-relaxed">
                                {section.bullets.map((bullet, bulletIdx) => (
                                  <li key={bulletIdx} className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-1">•</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))
                    )
                  )
                )}
              </div>
              );
            })}
          </div>
        </section>

        {/* Assignments */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-950 p-5 sm:p-6 shadow-inner">
          <h2 className="text-base font-semibold text-zinc-100 sm:text-lg mb-4">
            Assignment
          </h2>
          {chapter.slug === 'the-nature-of-money' ? (
            <ChapterAssignment
              assignmentId="11111111-1111-4111-8111-111111111111"
              title="Assignment: &quot;What Is Money to Me?&quot;"
              question="What problem does money solve in my community?"
              description="Reflect on how money functions in your daily life and community."
              points={10}
              rewardSats={50}
            />
          ) : chapter.slug === 'the-journey-of-money' ? (
            <ChapterAssignment
              assignmentId="22222222-2222-4222-8222-222222222222"
              title="Assignment: Money Under Pressure"
              question="Write about how you saw old money fail."
              description="Reflect on your experiences or observations of traditional money systems failing."
              points={10}
              rewardSats={75}
            />
          ) : chapter.slug === 'problems-with-traditional-fiat-money' ? (
            <ChapterAssignment
              assignmentId="33333333-3333-4333-8333-333333333333"
              title="Assignment: Inflation Reality Check"
              question="Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago."
              description="Research and compare prices to understand inflation's impact on purchasing power."
              points={10}
              rewardSats={75}
            />
          ) : chapter.slug === 'from-crisis-to-innovation' ? (
            <ChapterAssignment
              assignmentId="44444444-4444-4444-8444-444444444444"
              title="Assignment: &quot;What Broke?&quot;"
              question="Explain in your own words one reason the old system failed (inflation, debt, bailouts, control)."
              description="Reflect on the failures of the traditional financial system."
              points={10}
              rewardSats={75}
            />
          ) : chapter.slug === 'the-birth-of-bitcoin' ? (
            <ChapterAssignment
              assignmentId="55555555-5555-4555-8555-555555555555"
              title="Assignment: Whitepaper Sentence Decode"
              question="Rewrite this sentence in plain language: &quot;A purely peer-to-peer version of electronic cash…&quot;"
              description="Practice translating technical language into everyday terms."
              points={10}
              rewardSats={100}
            />
          ) : chapter.slug === 'keys-and-transactions' ? (
            <Chapter8Assignment
              assignmentId="66666666-6666-4666-8666-666666666666"
            />
          ) : chapter.slug === 'blockchain-basics' ? (
            <ChapterAssignment
              assignmentId="77777777-7777-4777-8777-777777777777"
              title="Assignment: Understanding a Block"
              question="What would happen if someone tried to change a transaction in an old block?"
              description="Explain the consequences of attempting to alter a transaction in a previous block on the blockchain."
              points={10}
              rewardSats={100}
            />
          ) : chapter.slug === 'exchange-software-wallet' ? (
            <Chapter6Assignment
              assignmentId="88888888-8888-4888-8888-888888888888"
            />
          ) : chapter.slug === 'hardware-signers' ? (
            <ChapterAssignment
              assignmentId="bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
              title="Assignment: Threat Model"
              question="List 3 threats a hardware wallet protects against."
              description="Understand the security benefits of hardware wallets."
              points={10}
              rewardSats={100}
            />
          ) : chapter.slug === 'utxos-fees-coin-control' ? (
            <ChapterUTXOAssignment
              assignmentId="99999999-9999-4999-8999-999999999999"
            />
          ) : chapter.slug === 'good-bitcoin-hygiene' ? (
            <ChapterAssignment
              assignmentId="10101010-1010-4101-8101-010101010101"
              title="Assignment: Protect Your Future Self"
              question="Why should you use a new receive address every time?"
              description="Reflect on why using a new receive address every time is important for privacy and security."
              points={10}
              rewardSats={100}
            />
          ) : chapter.slug === 'intro-to-bitcoin-script-optional-track' ? (
            <Chapter18Assignment
              assignmentId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
            />
          ) : chapter.slug === 'why-bitcoin-philosophy-adoption' ? (
            <ChapterAssignment
              assignmentId="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
              title="Assignment: Code or State"
              question="What do you think of Bitcoin?"
              description="Reflect on your perspective of Bitcoin after completing the course."
              points={10}
              rewardSats={100}
            />
          ) : chapter.slug === 'verify-for-yourself-block-explorers-nodes' ? (
            <div className="mt-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-purple-200">
                <span>📋 Explorer Scavenger Hunt Assignment</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Complete the assignment to practice using block explorers and verify transactions independently.
              </p>
            </div>
          ) : chapter.slug === 'proof-of-work-and-block-rewards' ? (
            <Chapter14HalvingPuzzle
              assignmentId="dddddddd-dddd-4ddd-8ddd-dddddddddddd"
            />
          ) : null}
        </section>

        {/* Summary */}
        <section className="rounded-xl border border-green-400/25 bg-black/70 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-green-200 sm:text-lg">
            Summary / Key Takeaways
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-200">
            {chapter.summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {/* Key terms */}
        <section className="rounded-xl border border-cyan-400/20 bg-zinc-950/70 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-cyan-200 sm:text-lg">
            Key Terms
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {chapter.keyTerms.map((term) => {
              // Find the section that mentions this term
              const termLower = term.toLowerCase();
              const relevantSection = chapter.sections.findIndex((section) => {
                const headingLower = section.heading.toLowerCase();
                const contentLower = [
                  ...(section.paragraphs || []),
                  ...(section.bullets || []),
                  ...(section.callouts?.map(c => c.content) || []),
                ].join(' ').toLowerCase();
                return headingLower.includes(termLower) || contentLower.includes(termLower);
              });
              
              const sectionId = relevantSection >= 0 
                ? `section-${relevantSection}-${chapter.sections[relevantSection].heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                : null;
              
              return sectionId ? (
                <a
                  key={term}
                  href={`#${sectionId}`}
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:text-cyan-50 cursor-pointer"
                >
                  {term}
                </a>
              ) : (
                <span
                  key={term}
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                >
                  {term}
                </span>
              );
            })}
          </div>
        </section>

        {/* Navigation CTA */}
        <div className="flex items-center justify-between gap-4">
          {previousChapter ? (
            <Link
              href={`/chapters/${previousChapter.slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-purple-400/50 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20"
            >
              ← Previous: Chapter {previousChapter.number}
            </Link>
          ) : (
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              ← Back to Chapters
            </Link>
          )}
          {nextChapter ? (
            <NextChapterButton
              nextChapterSlug={nextChapter.slug}
              nextChapterNumber={nextChapter.number}
              currentChapterNumber={chapter.number}
              currentChapterSlug={chapter.slug}
              variant="bottom"
            />
          ) : (
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Back to Chapters →
            </Link>
          )}
        </div>
      </div>
    </PageContainer>
    </ChapterAccessCheck>
    </AdminModeWrapper>
  );
}
