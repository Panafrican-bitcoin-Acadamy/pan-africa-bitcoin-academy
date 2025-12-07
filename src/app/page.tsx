import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";

const chapters = [
  { slug: "what-is-bitcoin", title: "Chapter 1 · What is Bitcoin?", level: "Beginner" },
  { slug: "keys-addresses-utxos", title: "Chapter 2 · Keys, Addresses, UTXOs", level: "Beginner" },
  { slug: "transactions-and-mempool", title: "Chapter 3 · Transactions & Mempool", level: "Intermediate" },
  { slug: "blocks-and-mining", title: "Chapter 4 · Blocks & Mining", level: "Intermediate" },
  { slug: "wallet-recovery", title: "Chapter 5 · Wallet Recovery", level: "Practical" },
  {
    slug: "bitcoin-trading-and-risk",
    title: "Chapter 6 · Bitcoin Trading & Risk",
    level: "Caution",
  },
];

const funders = [
  { name: "Bitcoin Foundation", logo: "/bitcoin-foundation.svg" },
  { name: "Crypto Education Fund", logo: "/crypto-education.svg" },
  { name: "Blockchain Academy", logo: "/blockchain-academy.svg" },
  { name: "Digital Assets Institute", logo: "/digital-assets.svg" },
];

export default function Home() {
  return (
    <PageContainer
      title="Understand Bitcoin with a builder's mindset."
      subtitle="From keys and UTXOs to mining and wallet recovery — a visual, hands-on guide to how Bitcoin really works, before you ever think about touching real coins."
    >
      <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Beginner-friendly · Self-paced · Testnet-safe
          </div>
          <p className="text-sm text-zinc-300 sm:text-base">
            No hype, no noise. Just the mechanics: keys, addresses, UTXOs, transactions,
            blocks, mining, recovery, and the real risks of trading — with diagrams and
            terminal examples to make each idea click.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.8)] transition hover:brightness-110"
            >
              Start learning Bitcoin
            </Link>
            <span className="text-xs text-zinc-400 sm:text-sm">
              Start at Chapter 1 • 10–15 min per chapter • Practice on regtest/testnet
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-zinc-300 sm:grid-cols-3 sm:text-sm">
            <div className="rounded-xl border border-cyan-400/30 bg-black/70 p-3 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              <p className="font-semibold text-cyan-200">Visual diagrams</p>
              <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">
                Flows for UTXOs, transaction lifecycles, mempool, and blocks.
              </p>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-black/70 p-3 shadow-[0_0_30px_rgba(249,115,22,0.35)]">
              <p className="font-semibold text-orange-200">Commands & code</p>
              <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">
                `bitcoin-cli` examples, regtest setups, and wallet walkthroughs.
              </p>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-black/70 p-3 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
              <p className="font-semibold text-purple-200">Risk & safety</p>
              <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">
                Learn recovery and trading risks in a safe, testnet-first way.
              </p>
            </div>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl border border-cyan-400/25 bg-black/80 p-4 shadow-[0_0_50px_rgba(34,211,238,0.45)] sm:p-5">
          <h2 className="text-sm font-semibold text-orange-100 sm:text-base">
            Learning path · Chapters
          </h2>
          <ul className="space-y-2 text-sm">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  href={`/chapters/${chapter.slug}`}
                  className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-zinc-100 transition hover:border-cyan-300/70 hover:bg-cyan-400/10"
                >
                  <span>{chapter.title}</span>
                  <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                    {chapter.level}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="pt-1 text-[11px] text-zinc-500">
            Coming soon: quizzes, glossary, and a "try it on regtest" playground to
            solidify each chapter.
          </p>
        </aside>
      </section>

      {/* Bitcoin Images Section */}
      <section className="mt-12 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl border border-orange-500/30 bg-black/70 p-6 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition hover:border-orange-400/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]">
            <div className="flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-4">
                <svg viewBox="0 0 24 24" className="h-full w-full text-orange-400" fill="currentColor">
                  <path d="M23.638 14.794c-1.284 5.736-6.456 9.594-11.538 8.573-5.082-1.021-8.616-5.91-7.332-11.646 1.284-5.736 6.456-9.594 11.538-8.573 5.082 1.021 8.616 5.91 7.332 11.646zm-6.364-10.127c-.737-1.476-1.832-2.58-3.308-3.317-.737-1.476-1.832-2.58-3.308-3.317C8.781-1.386 6.5-.386 4.5.5c-2 .886-3.5 2.5-4.5 4.5-.5 1-.5 2.5 0 3.5.5 1 1.5 2 2.5 2.5 1 .5 2.5.5 3.5 0 1-.5 2-1.5 2.5-2.5.5-1 .5-2.5 0-3.5z"/>
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-center text-sm font-semibold text-orange-200">Bitcoin Network</h3>
            <p className="mt-2 text-center text-xs text-zinc-400">Decentralized peer-to-peer system</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/70 p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] transition hover:border-cyan-300/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]">
            <div className="flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 p-4">
                <svg viewBox="0 0 24 24" className="h-full w-full text-cyan-400" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-center text-sm font-semibold text-cyan-200">Blockchain Technology</h3>
            <p className="mt-2 text-center text-xs text-zinc-400">Immutable distributed ledger</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-black/70 p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)] transition hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            <div className="flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4">
                <svg viewBox="0 0 24 24" className="h-full w-full text-purple-400" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-center text-sm font-semibold text-purple-200">Cryptographic Security</h3>
            <p className="mt-2 text-center text-xs text-zinc-400">Advanced encryption protocols</p>
          </div>
        </div>
      </section>

      {/* Funders Section */}
      <section className="mt-16 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-50 sm:text-2xl">Our Funders & Partners</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Supported by leading organizations in the Bitcoin and blockchain space
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {funders.map((funder, index) => (
            <div
              key={index}
              className="group flex flex-col items-center justify-center rounded-xl border border-cyan-400/20 bg-black/60 p-6 transition hover:border-cyan-400/40 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-900/50 text-xs font-bold text-orange-300">
                  {funder.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <p className="mt-4 text-center text-xs font-medium text-zinc-300 group-hover:text-cyan-200">
                {funder.name}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

