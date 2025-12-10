import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";

const chapterSummaries: Record<
  string,
  { title: string; level: string; summary: string; keyPoints: string[] }
> = {
  "what-is-bitcoin": {
    title: "Chapter 1 · What is Bitcoin?",
    level: "Beginner",
    summary:
      "Big-picture mental model: Bitcoin as a network, a money, and a ledger. No buzzwords, just the core ideas.",
    keyPoints: [
      "Why Bitcoin exists and what problem it tries to solve",
      "Separation of money and state, digital scarcity, and the idea of a global ledger",
      "High-level view of nodes, miners, and the blockchain",
    ],
  },
  "keys-addresses-utxos": {
    title: "Chapter 2 · Keys, Addresses, UTXOs",
    level: "Beginner",
    summary:
      "From private keys to UTXOs: how ownership is represented in Bitcoin, and why balances are an illusion.",
    keyPoints: [
      "Private keys, public keys, and Bitcoin addresses",
      "What a UTXO is and why wallets track sets of UTXOs, not balances",
      "Why \"not your keys, not your coins\" is technically true",
    ],
  },
  "transactions-and-mempool": {
    title: "Chapter 3 · Transactions & Mempool",
    level: "Intermediate",
    summary:
      "How a transaction is constructed, signed, and propagated through the network before it lands in a block.",
    keyPoints: [
      "Inputs, outputs, and change addresses",
      "The mempool as a waiting room for unconfirmed transactions",
      "Fees, fee rates (sat/vB), and why some transactions get stuck",
    ],
  },
  "blocks-and-mining": {
    title: "Chapter 4 · Blocks & Mining",
    level: "Intermediate",
    summary:
      "What miners actually do, why proof-of-work matters, and how blocks get chained together securely.",
    keyPoints: [
      "Block structure (header, transactions, coinbase)",
      "Proof-of-work, difficulty, and security",
      "Reorgs, confirmations, and finality intuition",
    ],
  },
  "wallet-recovery": {
    title: "Chapter 5 · Wallet Recovery",
    level: "Practical",
    summary:
      "Understanding seed phrases, backups, and safe recovery practices — without exposing real funds.",
    keyPoints: [
      "BIP39 seed phrases and derivation paths (high level)",
      "Best practices for backups and recovery testing",
      "Common mistakes (screenshots, cloud backups, phishing) and how to avoid them",
    ],
  },
  "bitcoin-trading-and-risk": {
    title: "Chapter 6 · Bitcoin Trading & Risk",
    level: "Caution",
    summary:
      "How Bitcoin trading works at a high level — and why risk management, position sizing, and emotional control matter more than \"signals\".",
    keyPoints: [
      "Difference between buying/holding (spot) and trading short-term price moves",
      "Why leverage, derivatives, and overtrading can blow up accounts quickly",
      "Core risk ideas: position sizing, only using money you can lose, and avoiding FOMO",
      "Why no one can reliably predict short-term price moves, and how to protect yourself from scams and paid signal groups",
    ],
  },
};

type ChapterPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ChapterPage(props: ChapterPageProps) {
  const { slug } = await props.params;
  const chapter = chapterSummaries[slug];

  // If chapter not found in summaries, create a basic entry from the slug
  if (!chapter) {
    // Convert slug back to title for display
    const titleFromSlug = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return (
      <PageContainer
        title={`Chapter: ${titleFromSlug}`}
        subtitle="This chapter is part of the Pan-Africa Bitcoin Academy curriculum. Full content coming soon."
      >
        <div className="space-y-8 text-sm text-zinc-100 sm:text-base">
          <section className="rounded-xl border border-orange-500/25 bg-zinc-950/80 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-orange-200 sm:text-base">
              Chapter Content
            </h2>
            <p className="mt-2 text-sm text-zinc-200">
              This chapter is being developed. Please check back soon for the full lesson content, including theory, practice exercises, videos, and quizzes.
            </p>
          </section>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={chapter.title}
      subtitle={`${chapter.level} level · Draft outline. This will become a fully written lesson with diagrams, markdown, and a quiz.`}
    >
      <div className="space-y-8 text-sm text-zinc-100 sm:text-base">
        <section className="rounded-xl border border-orange-500/25 bg-zinc-950/80 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-orange-200 sm:text-base">
            Big-picture summary
          </h2>
          <p className="mt-2 text-sm text-zinc-200">{chapter.summary}</p>
        </section>

        <section className="rounded-xl border border-orange-500/20 bg-zinc-950/70 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-orange-200 sm:text-base">
            Key ideas you&apos;ll understand
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
            {chapter.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-orange-500/10 bg-zinc-950/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-orange-200 sm:text-base">
            What&apos;s coming next
          </h2>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            This is the structural placeholder for your full chapter content. Next steps:
            connect markdown files, add diagrams (SVG), include `bitcoin-cli` examples for
            regtest/testnet, and attach a short quiz so learners can check their
            understanding.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}


