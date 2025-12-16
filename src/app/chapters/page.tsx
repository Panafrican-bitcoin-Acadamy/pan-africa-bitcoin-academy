'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BitcoinIcon, WalletIcon, LightningIcon, BookIcon, ToolIcon, BlockchainIcon, KeysIcon, UTXOIcon, TransactionIcon, MiningIcon } from "@/components/BitcoinIcons";
import { useAuth } from "@/hooks/useAuth";
import { Download, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { AnimatedSection } from "@/components/AnimatedSection";
import { AnimatedList } from "@/components/AnimatedList";
import type { Metadata } from "next";

// Note: Metadata cannot be exported from client components
// Metadata is handled via layout or server components

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const levels = [
  { id: 1, name: "Level I (Genesis)", description: "Foundations, the fiat problem, and first steps into Bitcoin", color: "cyan" },
  { id: 2, name: "Level II (Difficulty-Adjustment 1)", description: "Intermediate concepts and practical skills", color: "orange" },
  { id: 3, name: "Level III (Advanced Sovereignty)", description: "Full control: your rules, your verification, collaborative custody", color: "purple" },
];

const chapters = [
  // Level I
  {
    id: 1,
    level: 1,
    number: 1,
    title: "The Nature of Money",
    difficulty: "Beginner",
    time: "45 min",
    icon: "📘",
    type: "theory",
    activities: ["Class Questions on 'What is Money?'"],
    learnPoints: [
      "Why humans created money",
      "Functions of money — Medium of Exchange, Store of Value, Unit of Account",
      "Properties of sound money — Scarce, Durable, Portable, Divisible, Recognizable",
    ],
    theory: ["Introduction to money", "Why humans created money", "Functions and properties of money"],
    practice: ["Class discussion on money", "Activity: What is Money?"],
    video: "5-minute explanation of money evolution",
    quiz: "5 questions on money fundamentals",
  },
  {
    id: 2,
    level: 1,
    number: 2,
    title: "The Journey of Money",
    difficulty: "Beginner",
    time: "50 min",
    icon: "📘",
    type: "theory",
    activities: ["Timeline of Money"],
    learnPoints: [
      "From barter to commodity exchange",
      "Coinage and precious metals",
      "Paper money and banknotes",
      "The rise of fiat currencies",
      "Precursors to Bitcoin — Haber & Stornetta Time-Stamping",
    ],
    theory: ["History of money evolution", "Barter to fiat transition", "Pre-Bitcoin innovations"],
    practice: ["Create timeline of money", "Activity: Timeline of Money"],
    video: "Visual journey through money history",
    quiz: "5 questions on money evolution",
  },
  {
    id: 3,
    level: 1,
    number: 3,
    title: "Problems with Traditional (Fiat) Money",
    difficulty: "Beginner",
    time: "55 min",
    icon: "📘",
    type: "theory",
    activities: ["Class Discussion: 'Do We Trust Our Money?'"],
    learnPoints: [
      "Inflation and loss of purchasing power",
      "Centralized control — Governments and Banks",
      "Financial exclusion and inequality",
      "Fragility of the current system",
    ],
    theory: ["Fiat money problems", "Inflation mechanisms", "Centralization risks"],
    practice: ["Class discussion", "Activity: Trust in money"],
    video: "Problems with fiat explained",
    quiz: "5 questions on fiat issues",
  },
  {
    id: 4,
    level: 1,
    number: 4,
    title: "From Crisis to Innovation",
    difficulty: "Beginner",
    time: "60 min",
    icon: "📘",
    type: "theory",
    activities: ["The Effects of Inflation — An Auction Simulation"],
    learnPoints: [
      "Why the old system was failing",
      "Decreasing purchasing power",
      "Monetary inflation and its effects",
      "Global debt burden and social inequality",
      "The Cypherpunks & Early Digital Currencies",
    ],
    theory: ["System failures", "Inflation effects", "Cypherpunk movement"],
    practice: ["Auction simulation", "Activity: Inflation effects"],
    video: "Crisis to innovation story",
    quiz: "5 questions on crisis and innovation",
  },
  {
    id: 5,
    level: 1,
    number: 5,
    title: "The Birth of Bitcoin",
    difficulty: "Beginner",
    time: "50 min",
    icon: "📘",
    type: "theory",
    activities: ["Reading a Simplified Whitepaper Excerpt"],
    learnPoints: [
      "2008 Financial Crisis context",
      "Satoshi Nakamoto and the Whitepaper",
      "Bitcoin as Peer-to-Peer Electronic Cash",
      "Ledger/platform money concept",
    ],
    theory: ["2008 crisis", "Satoshi's vision", "Bitcoin whitepaper basics"],
    practice: ["Read whitepaper excerpt", "Activity: Whitepaper analysis"],
    video: "Birth of Bitcoin story",
    quiz: "5 questions on Bitcoin origins",
  },
  {
    id: 6,
    level: 1,
    number: 6,
    title: "Keys and Transactions",
    difficulty: "Beginner",
    time: "60 min",
    icon: "🛠",
    type: "practice",
    activities: ["Role-play a Bitcoin Transaction"],
    learnPoints: [
      "Digital signatures — How Bitcoin verifies ownership",
      "Public/Private keys explained simply",
      "Peer-to-Peer transactions (broadcast, verification, confirmation)",
    ],
    theory: ["Digital signatures", "Public/private keys", "Transaction flow"],
    practice: ["Role-play transaction", "Activity: Transaction simulation"],
    video: "Keys and transactions explained",
    quiz: "5 questions on keys and transactions",
  },
  {
    id: 7,
    level: 1,
    number: 7,
    title: "Blockchain Basics",
    difficulty: "Beginner",
    time: "55 min",
    icon: "📘",
    type: "theory",
    activities: ["Build a Paper Blockchain (hash-link demo)"],
    learnPoints: [
      "Blocks, Hashes, and Linking",
      "The Role of Merkle Trees in Proving Transactions",
      "Immutability, Tamper-Evidence, and Trust-Minimization",
      "What Miners Hash — Anatomy of a Block Header",
    ],
    theory: ["Block structure", "Merkle trees", "Immutability concepts"],
    practice: ["Paper blockchain demo", "Activity: Hash-link demo"],
    video: "Blockchain basics visualized",
    quiz: "5 questions on blockchain",
  },
  {
    id: 8,
    level: 1,
    number: 8,
    title: "Exchange & Software Wallet",
    difficulty: "Beginner",
    time: "70 min",
    icon: "🛠",
    type: "practice",
    activities: ["Testnet Walkthrough — Buy mock sats → send to class wallets"],
    learnPoints: [
      "What Is an Exchange? How to Acquire Bitcoin",
      "Software Signer (mobile/desktop): create wallet, seed backup",
      "Complete a First Transaction (send/receive)",
      "Privacy Basics (VPN, address reuse awareness, local-first tools)",
    ],
    theory: ["Exchanges overview", "Wallet basics", "Privacy fundamentals"],
    practice: ["Create wallet", "Testnet transaction", "Activity: Testnet walkthrough"],
    video: "Wallet setup tutorial",
    quiz: "5 questions on wallets",
  },
  // Level II
  {
    id: 9,
    level: 2,
    number: 9,
    title: "UTXOs, Fees & Coin Control",
    difficulty: "Intermediate",
    time: "65 min",
    icon: "🛠",
    type: "practice",
    activities: ["Plan a Spend from a UTXO Set (paper exercise)"],
    learnPoints: [
      "What You Really Own (UTXO model)",
      "Fees and Input Selection (change outputs; sat/vB basics)",
      "UTXO Management & When to Consolidate",
      "Privacy & fee trade-offs",
    ],
    theory: ["UTXO model", "Fee mechanisms", "Coin control"],
    practice: ["UTXO planning", "Activity: UTXO set exercise"],
    video: "UTXOs explained",
    quiz: "5 questions on UTXOs",
  },
  {
    id: 10,
    level: 2,
    number: 10,
    title: "Good Bitcoin Hygiene",
    difficulty: "Intermediate",
    time: "50 min",
    icon: "🛠",
    type: "practice",
    activities: ["Hygiene Checklist Audit on a Demo Wallet"],
    learnPoints: [
      "New Receive Address Each Time; verify on the device",
      "Labeling Transactions and UTXOs for future spending",
      "Basic Privacy Habits (avoid reuse; payment flow awareness)",
    ],
    theory: ["Privacy best practices", "Address management", "Transaction labeling"],
    practice: ["Hygiene audit", "Activity: Checklist audit"],
    video: "Bitcoin hygiene guide",
    quiz: "5 questions on hygiene",
  },
  {
    id: 11,
    level: 2,
    number: 11,
    title: "Hardware Signers",
    difficulty: "Intermediate",
    time: "75 min",
    icon: "🛠",
    type: "practice",
    activities: ["Dry-Run Recovery (no funds) + sign a testnet PSBT"],
    learnPoints: [
      "Why Hardware (threats it mitigates; hot vs cold)",
      "Setup, Backup, and Test Recovery (seed vs passphrase basics)",
      "Spending Safely with a Hardware Signer (PSBT flow)",
    ],
    theory: ["Hardware wallet security", "Hot vs cold storage", "PSBT basics"],
    practice: ["Hardware setup", "Recovery test", "Activity: PSBT signing"],
    video: "Hardware wallet tutorial",
    quiz: "5 questions on hardware wallets",
  },
  {
    id: 12,
    level: 2,
    number: 12,
    title: "Layer 2 & Sidechains in Daily Life",
    difficulty: "Intermediate",
    time: "70 min",
    icon: "⚡",
    type: "practice",
    activities: ["Live Lightning Payment Demo"],
    learnPoints: [
      "Lightning Basics (fast payments; settlement trade-offs)",
      "Receive and Spend via Lightning (custodial vs non-custodial)",
      "Sidechains Overview (e.g., Liquid — federated trade-offs)",
      "Circular Economies — markets that run on sats",
    ],
    theory: ["Lightning Network", "Layer 2 solutions", "Sidechains"],
    practice: ["Lightning payment", "Activity: Live demo"],
    video: "Lightning explained",
    quiz: "5 questions on Lightning",
  },
  {
    id: 13,
    level: 2,
    number: 13,
    title: "Verify for Yourself — Block Explorers & Nodes",
    difficulty: "Intermediate",
    time: "60 min",
    icon: "🛠",
    type: "practice",
    activities: ["Explorer Scavenger Hunt"],
    learnPoints: [
      "Using a Block Explorer (txids, confirmations, feerates)",
      "Proving Inclusion (Merkle path, high-level)",
      "Why Run a Node (don't trust—verify; mempool view; policy/relay)",
      "First-Time Sync & Costs",
    ],
    theory: ["Block explorers", "Node importance", "Verification methods"],
    practice: ["Explorer usage", "Activity: Scavenger hunt"],
    video: "Nodes and explorers guide",
    quiz: "5 questions on verification",
  },
  {
    id: 14,
    level: 2,
    number: 14,
    title: "Proof of Work and Block Rewards",
    difficulty: "Intermediate",
    time: "55 min",
    icon: "📘",
    type: "theory",
    activities: ["'Proof-of-Work by Hand' classroom game"],
    learnPoints: [
      "Proof of Work (hard to make, easy to verify)",
      "Miners & Block Rewards — current reward 3.125 BTC",
      "Halving Schedule and Monetary Inflation",
      "Subsidy Timeline — 2140 End of New Supply",
    ],
    theory: ["Proof of Work", "Mining rewards", "Halving schedule"],
    practice: ["PoW game", "Activity: Proof-of-Work by hand"],
    video: "Mining explained",
    quiz: "5 questions on PoW",
  },
  {
    id: 15,
    level: 2,
    number: 15,
    title: "Mining in Practice",
    difficulty: "Intermediate",
    time: "60 min",
    icon: "📘",
    type: "theory",
    activities: ["Chart the Impact of Difficulty and Fees on Security"],
    learnPoints: [
      "Difficulty Adjustment (every 2,016 blocks; ~10-min target)",
      "Mining Pools & Centralization Risk",
      "The 'Security Budget': subsidy decline vs fee market",
      "ASIC Supply Chains & Geopolitical Risk",
    ],
    theory: ["Difficulty adjustment", "Mining pools", "Security budget"],
    practice: ["Security analysis", "Activity: Chart impact"],
    video: "Mining in practice",
    quiz: "5 questions on mining",
  },
  // Level III
  {
    id: 16,
    level: 3,
    number: 16,
    title: "Full Node & Opening a Lightning Channel",
    difficulty: "Advanced",
    time: "80 min",
    icon: "🛠",
    type: "practice",
    activities: ["Simulated channel open/close (regtest/testnet)"],
    learnPoints: [
      "Choosing a Node Stack; privacy tips",
      "Open/Close a Channel; routing basics",
      "Backups/watchtowers",
    ],
    theory: ["Node stacks", "Lightning channels", "Routing basics"],
    practice: ["Channel operations", "Activity: Channel simulation"],
    video: "Node and Lightning setup",
    quiz: "5 questions on nodes and channels",
  },
  {
    id: 17,
    level: 3,
    number: 17,
    title: "Multi-Sig (Collaborative Custody)",
    difficulty: "Advanced",
    time: "70 min",
    icon: "🛠",
    type: "practice",
    activities: ["Design a 2-of-3 Family Custody Plan"],
    learnPoints: [
      "Why Multi-Sig (family/orgs/inheritance)",
      "M-of-N Designs; coordinator vs coordinator-less flows",
      "Backup Strategies and Operational Playbooks",
    ],
    theory: ["Multi-sig concepts", "M-of-N designs", "Custody strategies"],
    practice: ["Multi-sig setup", "Activity: Family custody plan"],
    video: "Multi-sig explained",
    quiz: "5 questions on multi-sig",
  },
  {
    id: 18,
    level: 3,
    number: 18,
    title: "Intro to Bitcoin Script (Optional Track)",
    difficulty: "Advanced",
    time: "65 min",
    icon: "📘",
    type: "theory",
    activities: [],
    learnPoints: [
      "Locking & Unlocking Conditions (P2PKH → P2WPKH)",
      "Timelocks & Simple Policies (high-level)",
      "Where Script Appears in Real Wallets",
    ],
    theory: ["Bitcoin Script", "Locking conditions", "Timelocks"],
    practice: ["Script examples", "Policy design"],
    video: "Script basics",
    quiz: "5 questions on Script",
  },
  {
    id: 19,
    level: 3,
    number: 19,
    title: "UTXO Consolidation & Privacy Risks",
    difficulty: "Advanced",
    time: "60 min",
    icon: "🛠",
    type: "practice",
    activities: ["Draft a Consolidation Plan for a Noisy UTXO Set"],
    learnPoints: [
      "When to Consolidate (fee windows; mempool conditions)",
      "Privacy Erosion Risks & Coin-Control Discipline",
      "Spend Plans for Future Fees and Privacy",
    ],
    theory: ["Consolidation strategies", "Privacy risks", "Coin control"],
    practice: ["Consolidation planning", "Activity: Draft plan"],
    video: "Privacy and consolidation",
    quiz: "5 questions on consolidation",
  },
  {
    id: 20,
    level: 3,
    number: 20,
    title: "Why Bitcoin? Philosophy & Adoption",
    difficulty: "Advanced",
    time: "55 min",
    icon: "📘",
    type: "theory",
    activities: ["Debate: 'Do You Trust Code or State?'"],
    learnPoints: [
      "Chartalist vs Metallist vs Platform Money (thinking framework)",
      "Bitcoin vs bitcoin (protocol/network vs unit)",
      "Trust-Minimized Finance & Who Benefits",
    ],
    theory: ["Money philosophy", "Bitcoin vs bitcoin", "Trust minimization"],
    practice: ["Philosophical debate", "Activity: Code vs State debate"],
    video: "Bitcoin philosophy",
    quiz: "5 questions on philosophy",
  },
  {
    id: 21,
    level: 3,
    number: 21,
    title: "Wrap-Up & Resources",
    difficulty: "Advanced",
    time: "40 min",
    icon: "📘",
    type: "theory",
    activities: ["Final Reflection — 'From Failing Fiat to Sovereign Bitcoin'"],
    learnPoints: [
      "Glossary of key terms",
      "Primary Sources & Local-First Tools",
      "Final Reflection on the journey",
    ],
    theory: ["Course summary", "Resources", "Next steps"],
    practice: ["Final reflection", "Activity: Reflection exercise"],
    video: "Course wrap-up",
    quiz: "Final assessment",
  },
];

const comingSoon = [
  "Deep dive into nodes",
  "Self-custody advanced",
  "CBDCs vs Bitcoin",
  "Bitcoin for entrepreneurs",
  "Satoshi-level coding intro",
  "Formally verified assignments",
  "Lightning developer path",
];

export default function ChaptersPage() {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [chapterStatus, setChapterStatus] = useState<Record<number, { isUnlocked: boolean; isCompleted: boolean }>>({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchChapterStatus = async () => {
      if (loading) return;
      
      if (!isAuthenticated || !profile) {
        setLoadingStatus(false);
        return;
      }

      try {
        const response = await fetch('/api/chapters/unlock-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile.email }),
        });

        const data = await response.json();
        if (data.chapters) {
          setChapterStatus(data.chapters);
        }
      } catch (error) {
        console.error('Error fetching chapter status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchChapterStatus();
  }, [isAuthenticated, profile, loading]);

  const isChapterUnlocked = (chapterNumber: number): boolean => {
    if (!isAuthenticated || !profile) return false;
    // Chapter 1 is always unlocked for enrolled students
    if (chapterNumber === 1) return true;
    return chapterStatus[chapterNumber]?.isUnlocked || false;
  };

  const isChapterCompleted = (chapterNumber: number): boolean => {
    if (!isAuthenticated || !profile) return false;
    return chapterStatus[chapterNumber]?.isCompleted || false;
  };

  const handleChapterClick = (chapterNumber: number, chapterTitle: string) => {
    if (!isAuthenticated || !profile) {
      router.push('/apply?redirect=/chapters');
      return;
    }

    if (!isChapterUnlocked(chapterNumber)) {
      // Show message or redirect
      alert(`Please complete Chapter ${chapterNumber - 1} first to unlock this chapter.`);
      return;
    }
  };

  const getLevelChapters = (levelId: number) => {
    return chapters.filter((ch) => ch.level === levelId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-400/30";
      case "Intermediate":
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      case "Advanced":
        return "bg-purple-500/20 text-purple-300 border-purple-400/30";
      default:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-400/30";
    }
  };

  const getChapterIcon = (chapter: typeof chapters[0]) => {
    // Always use Bitcoin "B" icon for all chapters
    return <BitcoinIcon className="w-6 h-6 text-orange-400" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "theory":
        return <BookIcon className="w-4 h-4" />;
      case "practice":
        return <ToolIcon className="w-4 h-4" />;
      case "lightning":
        return <LightningIcon className="w-4 h-4" />;
      default:
        return <BookIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Learning Path<br />
                Bitcoin Foundations → Lightning → Sovereignty
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                Follow the lessons step-by-step or jump to any topic you want to explore.
              </p>
              <p className="mx-auto mt-2 max-w-3xl text-base text-zinc-400">
                Each chapter includes diagrams, real examples, assignments, and a quick quiz.
              </p>
            </div>
          </AnimatedSection>

          {/* Learning Path Progress Bar */}
          <AnimatedSection animation="slideRight">
            <div className="mb-16 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <h2 className="mb-6 text-center text-xl font-semibold text-cyan-200">Learning Path Progress</h2>
            <div className="relative flex items-center justify-between">
              <div className="relative flex flex-1 items-center">
                {/* Level I */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300 transition-all duration-1000" id="level-1-circle">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/0 blur-xl transition-all duration-1000" id="level-1-glow"></div>
                  <span className="relative z-10">I</span>
                </div>
                
                {/* Path 1 (I to II) */}
                <div className="relative flex-1 mx-2 h-0.5 bg-cyan-400/30 overflow-visible">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/0 to-cyan-400/0 transition-all duration-1000 animate-path-glow-1" style={{ height: '2px', top: '-1px' }}></div>
                </div>
                
                {/* Level II */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300 transition-all duration-1000" id="level-2-circle">
                  <div className="absolute inset-0 rounded-full bg-orange-400/0 blur-xl transition-all duration-1000" id="level-2-glow"></div>
                  <span className="relative z-10">II</span>
                </div>
                
                {/* Path 2 (II to III) */}
                <div className="relative flex-1 mx-2 h-0.5 bg-orange-400/30 overflow-visible">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/0 to-orange-400/0 transition-all duration-1000 animate-path-glow-2" style={{ height: '2px', top: '-1px' }}></div>
                </div>
                
                {/* Level III */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300 transition-all duration-1000" id="level-3-circle">
                  <div className="absolute inset-0 rounded-full bg-purple-400/0 blur-xl transition-all duration-1000" id="level-3-glow"></div>
                  <span className="relative z-10">III</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-xs text-zinc-400">
              <span>Genesis</span>
              <span>Difficulty-Adjustment</span>
              <span>Advanced Sovereignty</span>
            </div>
            </div>
            <style jsx>{`
              /* Path glow animations - Forward (1→2→3) and Reverse (3→2→1) */
              @keyframes path-glow-1 {
                /* Forward: 1→2 (0-25%) */
                0% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  filter: blur(0px);
                }
                5% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.7) 10%, rgba(34, 211, 238, 0.9) 15%, rgba(34, 211, 238, 0.7) 20%, transparent 35%);
                  box-shadow: 0 0 15px rgba(34, 211, 238, 0.8), 0 0 30px rgba(34, 211, 238, 0.6);
                  filter: blur(0.5px);
                }
                12.5% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.8) 30%, rgba(34, 211, 238, 1) 40%, rgba(34, 211, 238, 0.8) 50%, transparent 70%);
                  box-shadow: 0 0 25px rgba(34, 211, 238, 0.9), 0 0 50px rgba(34, 211, 238, 0.7), 0 0 75px rgba(34, 211, 238, 0.5);
                  filter: blur(1px);
                }
                20% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.9) 60%, rgba(34, 211, 238, 1) 70%, rgba(34, 211, 238, 0.9) 80%, transparent 95%);
                  box-shadow: 0 0 30px rgba(34, 211, 238, 1), 0 0 60px rgba(34, 211, 238, 0.8), 0 0 90px rgba(34, 211, 238, 0.6);
                  filter: blur(1.5px);
                }
                25% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0) 100%, transparent 100%);
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  filter: blur(0px);
                }
                /* Rest period (25-75%) */
                25.1%, 75% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  filter: blur(0px);
                }
                /* Reverse: 2→1 (75-100%) */
                80% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.9) 60%, rgba(34, 211, 238, 1) 70%, rgba(34, 211, 238, 0.9) 80%, transparent 95%);
                  box-shadow: 0 0 30px rgba(34, 211, 238, 1), 0 0 60px rgba(34, 211, 238, 0.8), 0 0 90px rgba(34, 211, 238, 0.6);
                  filter: blur(1.5px);
                }
                87.5% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.8) 30%, rgba(34, 211, 238, 1) 40%, rgba(34, 211, 238, 0.8) 50%, transparent 70%);
                  box-shadow: 0 0 25px rgba(34, 211, 238, 0.9), 0 0 50px rgba(34, 211, 238, 0.7), 0 0 75px rgba(34, 211, 238, 0.5);
                  filter: blur(1px);
                }
                95% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0.7) 10%, rgba(34, 211, 238, 0.9) 15%, rgba(34, 211, 238, 0.7) 20%, transparent 35%);
                  box-shadow: 0 0 15px rgba(34, 211, 238, 0.8), 0 0 30px rgba(34, 211, 238, 0.6);
                  filter: blur(0.5px);
                }
                100% {
                  background: linear-gradient(to right, transparent 0%, rgba(34, 211, 238, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  filter: blur(0px);
                }
              }
              
              @keyframes path-glow-2 {
                /* Rest period (0-25%) */
                0%, 25% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  filter: blur(0px);
                }
                /* Forward: 2→3 (25-50%) */
                30% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.7) 10%, rgba(249, 115, 22, 0.9) 15%, rgba(249, 115, 22, 0.7) 20%, transparent 35%);
                  box-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.6);
                  filter: blur(0.5px);
                }
                37.5% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.8) 30%, rgba(249, 115, 22, 1) 40%, rgba(249, 115, 22, 0.8) 50%, transparent 70%);
                  box-shadow: 0 0 25px rgba(249, 115, 22, 0.9), 0 0 50px rgba(249, 115, 22, 0.7), 0 0 75px rgba(249, 115, 22, 0.5);
                  filter: blur(1px);
                }
                45% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.9) 60%, rgba(249, 115, 22, 1) 70%, rgba(249, 115, 22, 0.9) 80%, transparent 95%);
                  box-shadow: 0 0 30px rgba(249, 115, 22, 1), 0 0 60px rgba(249, 115, 22, 0.8), 0 0 90px rgba(249, 115, 22, 0.6);
                  filter: blur(1.5px);
                }
                50% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0) 100%, transparent 100%);
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  filter: blur(0px);
                }
                /* Rest period (50-75%) */
                50.1%, 75% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  filter: blur(0px);
                }
                /* Reverse: 3→2 (75-100%) */
                80% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.9) 60%, rgba(249, 115, 22, 1) 70%, rgba(249, 115, 22, 0.9) 80%, transparent 95%);
                  box-shadow: 0 0 30px rgba(249, 115, 22, 1), 0 0 60px rgba(249, 115, 22, 0.8), 0 0 90px rgba(249, 115, 22, 0.6);
                  filter: blur(1.5px);
                }
                87.5% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.8) 30%, rgba(249, 115, 22, 1) 40%, rgba(249, 115, 22, 0.8) 50%, transparent 70%);
                  box-shadow: 0 0 25px rgba(249, 115, 22, 0.9), 0 0 50px rgba(249, 115, 22, 0.7), 0 0 75px rgba(249, 115, 22, 0.5);
                  filter: blur(1px);
                }
                95% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0.7) 10%, rgba(249, 115, 22, 0.9) 15%, rgba(249, 115, 22, 0.7) 20%, transparent 35%);
                  box-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.6);
                  filter: blur(0.5px);
                }
                100% {
                  background: linear-gradient(to right, transparent 0%, rgba(249, 115, 22, 0) 0%, transparent 0%);
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  filter: blur(0px);
                }
              }
              
              /* Circle glow animations - activated when glow reaches them */
              @keyframes level-glow-1 {
                /* Forward: glow reaches level 1 (0-25%) */
                0%, 100% {
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  background-color: rgba(34, 211, 238, 0.2);
                }
                5% {
                  box-shadow: 0 0 30px rgba(34, 211, 238, 1), 0 0 50px rgba(34, 211, 238, 0.6);
                  background-color: rgba(34, 211, 238, 0.6);
                }
                12.5% {
                  box-shadow: 0 0 25px rgba(34, 211, 238, 0.9), 0 0 45px rgba(34, 211, 238, 0.5);
                  background-color: rgba(34, 211, 238, 0.5);
                }
                20% {
                  box-shadow: 0 0 20px rgba(34, 211, 238, 0.7), 0 0 40px rgba(34, 211, 238, 0.4);
                  background-color: rgba(34, 211, 238, 0.4);
                }
                25% {
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  background-color: rgba(34, 211, 238, 0.2);
                }
                /* Rest period (25-75%) */
                25.1%, 75% {
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  background-color: rgba(34, 211, 238, 0.2);
                }
                /* Reverse: glow reaches level 1 again (75-100%) */
                80% {
                  box-shadow: 0 0 20px rgba(34, 211, 238, 0.7), 0 0 40px rgba(34, 211, 238, 0.4);
                  background-color: rgba(34, 211, 238, 0.4);
                }
                87.5% {
                  box-shadow: 0 0 25px rgba(34, 211, 238, 0.9), 0 0 45px rgba(34, 211, 238, 0.5);
                  background-color: rgba(34, 211, 238, 0.5);
                }
                95% {
                  box-shadow: 0 0 30px rgba(34, 211, 238, 1), 0 0 50px rgba(34, 211, 238, 0.6);
                  background-color: rgba(34, 211, 238, 0.6);
                }
              }
              
              @keyframes level-glow-2 {
                /* Rest period (0-25%) */
                0%, 25% {
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  background-color: rgba(249, 115, 22, 0.2);
                }
                /* Forward: glow reaches level 2 (25-50%) */
                30% {
                  box-shadow: 0 0 30px rgba(249, 115, 22, 1), 0 0 50px rgba(249, 115, 22, 0.6);
                  background-color: rgba(249, 115, 22, 0.6);
                }
                37.5% {
                  box-shadow: 0 0 25px rgba(249, 115, 22, 0.9), 0 0 45px rgba(249, 115, 22, 0.5);
                  background-color: rgba(249, 115, 22, 0.5);
                }
                45% {
                  box-shadow: 0 0 20px rgba(249, 115, 22, 0.7), 0 0 40px rgba(249, 115, 22, 0.4);
                  background-color: rgba(249, 115, 22, 0.4);
                }
                50% {
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  background-color: rgba(249, 115, 22, 0.2);
                }
                /* Rest period (50-75%) */
                50.1%, 75% {
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  background-color: rgba(249, 115, 22, 0.2);
                }
                /* Reverse: glow reaches level 2 again (75-100%) */
                80% {
                  box-shadow: 0 0 20px rgba(249, 115, 22, 0.7), 0 0 40px rgba(249, 115, 22, 0.4);
                  background-color: rgba(249, 115, 22, 0.4);
                }
                87.5% {
                  box-shadow: 0 0 25px rgba(249, 115, 22, 0.9), 0 0 45px rgba(249, 115, 22, 0.5);
                  background-color: rgba(249, 115, 22, 0.5);
                }
                95% {
                  box-shadow: 0 0 30px rgba(249, 115, 22, 1), 0 0 50px rgba(249, 115, 22, 0.6);
                  background-color: rgba(249, 115, 22, 0.6);
                }
                100% {
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  background-color: rgba(249, 115, 22, 0.2);
                }
              }
              
              @keyframes level-glow-3 {
                /* Rest period (0-50%) */
                0% {
                  box-shadow: 0 0 0 rgba(168, 85, 247, 0);
                  background-color: rgba(168, 85, 247, 0.2);
                }
                /* Forward: glow reaches level 3 (50%) */
                50% {
                  box-shadow: 0 0 30px rgba(168, 85, 247, 1), 0 0 50px rgba(168, 85, 247, 0.6);
                  background-color: rgba(168, 85, 247, 0.6);
                }
                /* Rest period (50-75%) */
                50.1%, 75% {
                  box-shadow: 0 0 0 rgba(168, 85, 247, 0);
                  background-color: rgba(168, 85, 247, 0.2);
                }
                /* Reverse: glow reaches level 3 again (75-100%) */
                80% {
                  box-shadow: 0 0 20px rgba(168, 85, 247, 0.7), 0 0 40px rgba(168, 85, 247, 0.4);
                  background-color: rgba(168, 85, 247, 0.4);
                }
                87.5% {
                  box-shadow: 0 0 25px rgba(168, 85, 247, 0.9), 0 0 45px rgba(168, 85, 247, 0.5);
                  background-color: rgba(168, 85, 247, 0.5);
                }
                95% {
                  box-shadow: 0 0 30px rgba(168, 85, 247, 1), 0 0 50px rgba(168, 85, 247, 0.6);
                  background-color: rgba(168, 85, 247, 0.6);
                }
                100% {
                  box-shadow: 0 0 0 rgba(168, 85, 247, 0);
                  background-color: rgba(168, 85, 247, 0.2);
                }
              }
              
              /* Glow overlay for circles */
              @keyframes glow-overlay-1 {
                /* Forward: glow reaches level 1 (0-25%) */
                0%, 100% { 
                  opacity: 0; 
                }
                5% { 
                  opacity: 1; 
                }
                12.5% { 
                  opacity: 0.7; 
                }
                20% { 
                  opacity: 0.5; 
                }
                25% { 
                  opacity: 0; 
                }
                /* Rest period (25-75%) */
                25.1%, 75% { 
                  opacity: 0; 
                }
                /* Reverse: glow reaches level 1 again (75-100%) */
                80% { 
                  opacity: 0.5; 
                }
                87.5% { 
                  opacity: 0.7; 
                }
                95% { 
                  opacity: 1; 
                }
              }
              
              @keyframes glow-overlay-2 {
                /* Rest period (0-25%) */
                0%, 25% { 
                  opacity: 0; 
                }
                /* Forward: glow reaches level 2 (25-50%) */
                30% { 
                  opacity: 1; 
                }
                37.5% { 
                  opacity: 0.7; 
                }
                45% { 
                  opacity: 0.5; 
                }
                50% { 
                  opacity: 0; 
                }
                /* Rest period (50-75%) */
                50.1%, 75% { 
                  opacity: 0; 
                }
                /* Reverse: glow reaches level 2 again (75-100%) */
                80% { 
                  opacity: 0.5; 
                }
                87.5% { 
                  opacity: 0.7; 
                }
                95% { 
                  opacity: 1; 
                }
                100% { 
                  opacity: 0; 
                }
              }
              
              @keyframes glow-overlay-3 {
                /* Rest period (0-50%) */
                0% { 
                  opacity: 0; 
                }
                /* Forward: glow reaches level 3 (50%) */
                50% { 
                  opacity: 1; 
                }
                /* Rest period (50-75%) */
                50.1%, 75% { 
                  opacity: 0; 
                }
                /* Reverse: glow reaches level 3 again (75-100%) */
                80% { 
                  opacity: 0.5; 
                }
                87.5% { 
                  opacity: 0.7; 
                }
                95% { 
                  opacity: 1; 
                }
                100% { 
                  opacity: 0; 
                }
              }
              
              .animate-path-glow-1 {
                animation: path-glow-1 20s ease-in-out infinite;
              }
              
              .animate-path-glow-2 {
                animation: path-glow-2 20s ease-in-out infinite;
              }
              
              #level-1-circle {
                animation: level-glow-1 20s ease-in-out infinite;
              }
              
              #level-2-circle {
                animation: level-glow-2 20s ease-in-out infinite;
              }
              
              #level-3-circle {
                animation: level-glow-3 20s ease-in-out infinite;
              }
              
              #level-1-glow {
                animation: glow-overlay-1 20s ease-in-out infinite;
              }
              
              #level-2-glow {
                animation: glow-overlay-2 20s ease-in-out infinite;
              }
              
              #level-3-glow {
                animation: glow-overlay-3 20s ease-in-out infinite;
              }
            `}</style>
          </AnimatedSection>

          {/* Study Materials */}
          <AnimatedSection animation="slideLeft">
            <div className="mb-16">
            <h2 className="mb-3 text-2xl font-semibold text-orange-300 sm:text-3xl">Study Materials</h2>
            <p className="mb-8 text-base text-zinc-300 sm:text-lg">
              Download essential Bitcoin resources and books to deepen your understanding:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Bitcoin White Paper */}
              <a
                href="https://bitcoin.org/bitcoin.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-orange-400/30 bg-black/60 p-6 transition hover:border-orange-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/20 p-3">
                    <FileText className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-300 transition group-hover:text-orange-200">
                      Bitcoin: A Peer-to-Peer Electronic Cash System
                    </h3>
                    <p className="text-sm text-zinc-400">Satoshi Nakamoto (2008)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  The original white paper that started it all. Essential reading for understanding Bitcoin's core design.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
                    PDF
                  </span>
                  <div className="flex items-center gap-2 text-sm text-orange-400">
                    <span>Download</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* The Little Book of Bitcoin */}
              <a
                href="https://www.littlebitcoinbook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-cyan-400/30 bg-black/60 p-6 transition hover:border-cyan-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                      The Little Bitcoin Book
                    </h3>
                    <p className="text-sm text-zinc-400">Bitcoin Collective (2019)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A simple, beginner-friendly introduction to Bitcoin that explains why it matters for financial freedom.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                    Free
                  </span>
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <span>Read Online</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* Mastering Bitcoin */}
              <a
                href="https://github.com/bitcoinbook/bitcoinbook"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-purple-400/30 bg-black/60 p-6 transition hover:border-purple-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-300 transition group-hover:text-purple-200">
                      Mastering Bitcoin
                    </h3>
                    <p className="text-sm text-zinc-400">Andreas M. Antonopoulos</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Comprehensive technical guide to Bitcoin for developers, engineers, and technically-minded individuals.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
                    Free (GitHub)
                  </span>
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <span>Access</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* The Bitcoin Standard */}
              <a
                href="https://saifedean.com/thebitcoinstandard/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-yellow-400/30 bg-black/60 p-6 transition hover:border-yellow-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-300 transition group-hover:text-yellow-200">
                      The Bitcoin Standard
                    </h3>
                    <p className="text-sm text-zinc-400">Saifedean Ammous (2018)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Economic analysis of Bitcoin's origins, monetary properties, and its potential impact on the global economy.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-300">
                    Book
                  </span>
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <span>Learn More</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* Programming Bitcoin */}
              <a
                href="https://github.com/jimmysong/programmingbitcoin"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-green-400/30 bg-black/60 p-6 transition hover:border-green-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-300 transition group-hover:text-green-200">
                      Programming Bitcoin
                    </h3>
                    <p className="text-sm text-zinc-400">Jimmy Song (2019)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Learn Bitcoin by programming it from scratch. Build Bitcoin libraries in Python step by step.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                    Free (GitHub)
                  </span>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span>Access</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* Layered Money */}
              <a
                href="https://www.layeredmoney.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-blue-400/30 bg-black/60 p-6 transition hover:border-blue-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-300 transition group-hover:text-blue-200">
                      Layered Money
                    </h3>
                    <p className="text-sm text-zinc-400">Nik Bhatia (2021)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Explains the evolution of money through different layers and why Bitcoin represents a new monetary layer.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                    Book
                  </span>
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <span>Learn More</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>

              {/* The Little Book of Bitcoin in Tigrigna */}
              <a
                href="https://drive.google.com/file/d/1YcU6OIHZEsp4c6KOwAVDUGI2BfNtxx5T/view?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-teal-400/30 bg-black/60 p-6 transition hover:border-teal-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-teal-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-teal-300 transition group-hover:text-teal-200">
                      The Little Book of Bitcoin in Tigrigna
                    </h3>
                    <p className="text-sm text-zinc-400">ትግርኛ ትርጉም</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A simple, beginner-friendly introduction to Bitcoin translated into Tigrigna, explaining why it matters for financial freedom.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300">
                    PDF (Tigrigna)
                  </span>
                  <div className="flex items-center gap-2 text-sm text-teal-400">
                    <span>Download</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>
            </div>
            </div>
          </AnimatedSection>

          {/* Chapters by Level */}
          {levels.map((level, levelIndex) => {
            const levelChapters = getLevelChapters(level.id);
            // Level I (index 0) slides from left, Level II (index 1) from right, Level III (index 2) from left
            const animationType = levelIndex === 0 ? 'slideLeft' : levelIndex === 1 ? 'slideRight' : 'slideLeft';
            return (
              <AnimatedSection key={level.id} animation={animationType}>
                <div className="mb-16">
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">{level.name}</h2>
                  <p className="mt-2 text-base text-zinc-400">{level.description}</p>
                </div>

                <AnimatedList animation="slideUp" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {levelChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="group relative rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    >
                      {/* Chapter Header */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0">
                            {getChapterIcon(chapter)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-cyan-300">
                                Chapter {chapter.number}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getDifficultyColor(
                                  chapter.difficulty
                                )}`}
                              >
                                {chapter.difficulty}
                              </span>
                            </div>
                            <h3 className="mt-1 text-lg font-semibold text-zinc-50 group-hover:text-cyan-100">
                              {chapter.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Time & Type Badge */}
                      <div className="mb-4 flex items-center gap-2 text-xs text-zinc-400">
                        <span>⏱ {chapter.time}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-cyan-400">{getTypeIcon(chapter.type)}</span> {chapter.type}
                        </span>
                      </div>

                      {/* What You Will Learn */}
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-zinc-400">You will learn:</p>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {chapter.learnPoints.slice(0, 3).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-400">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                          {chapter.learnPoints.length > 3 && (
                            <li className="text-cyan-400">+ {chapter.learnPoints.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      {/* Activities Badge */}
                      {chapter.activities.length > 0 && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                            <ToolIcon className="w-3 h-3" /> {chapter.activities.length} {chapter.activities.length === 1 ? "Activity" : "Activities"}
                          </span>
                        </div>
                      )}

                      {/* What's Inside Toggle */}
                      <button
                        onClick={() =>
                          setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)
                        }
                        className="mb-4 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10"
                      >
                        {expandedChapter === chapter.id ? "Hide" : "Show"} What's Inside ↓
                      </button>

                      {/* What's Inside Content */}
                      {expandedChapter === chapter.id && (
                        <div className="mb-4 space-y-3 rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-4 text-xs">
                          <div>
                            <p className="mb-1 font-medium text-cyan-200">📘 Theory:</p>
                            <ul className="ml-4 list-disc space-y-1 text-zinc-400">
                              {chapter.theory.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-orange-200">🛠 Practice:</p>
                            <ul className="ml-4 list-disc space-y-1 text-zinc-400">
                              {chapter.practice.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-purple-200">🎥 Video:</p>
                            <p className="ml-4 text-zinc-400">{chapter.video}</p>
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-cyan-200">🧪 Quiz:</p>
                            <p className="ml-4 text-zinc-400">{chapter.quiz}</p>
                          </div>
                        </div>
                      )}

                      {/* Chapter Status Badge */}
                      {isAuthenticated && profile && (
                        <div className="mb-3">
                          {isChapterCompleted(chapter.number) ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 px-2 py-1 text-[10px] font-medium text-green-300">
                              ✓ Completed
                            </span>
                          ) : isChapterUnlocked(chapter.number) ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/20 px-2 py-1 text-[10px] font-medium text-orange-300">
                              🔓 Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-500/20 px-2 py-1 text-[10px] font-medium text-zinc-400">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      )}

                      {/* View Chapter Button */}
                      {isAuthenticated && profile && isChapterUnlocked(chapter.number) ? (
                        <Link
                          href={`/chapters/${generateSlug(chapter.title)}`}
                          className="block w-full rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-4 py-2 text-center text-sm font-semibold text-black transition hover:brightness-110"
                        >
                          {isChapterCompleted(chapter.number) ? 'Review Chapter →' : 'View Chapter →'}
                        </Link>
                      ) : isAuthenticated && profile ? (
                        <button
                          onClick={() => handleChapterClick(chapter.number, chapter.title)}
                          className="block w-full rounded-lg bg-zinc-700/50 px-4 py-2 text-center text-sm font-semibold text-zinc-400 cursor-not-allowed"
                          disabled
                        >
                          🔒 Locked
                        </button>
                      ) : (
                        <Link
                          href="/apply?redirect=/chapters"
                          className="block w-full rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-4 py-2 text-center text-sm font-semibold text-black transition hover:brightness-110"
                        >
                          Register to Access →
                        </Link>
                      )}
                    </div>
                  ))}
                </AnimatedList>
                </div>
              </AnimatedSection>
            );
          })}

          {/* Coming Soon Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 rounded-xl border border-purple-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <h2 className="mb-6 text-2xl font-semibold text-purple-200">Coming Soon</h2>
            <p className="mb-4 text-sm text-zinc-300">
              We're constantly expanding our curriculum. Here's what's coming next:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-500/10 px-4 py-2"
                >
                  <span className="text-purple-300">✨</span>
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            </div>
          </AnimatedSection>

          {/* Footer CTA */}
          <AnimatedSection animation="slideRight">
            <div className="rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <h2 className="mb-4 text-2xl font-semibold text-orange-200">Ready to start learning?</h2>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
              >
                🔸 Join Cohort 1
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                🔸 Download the Syllabus
              </Link>
              <a
                href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-green-400/30 bg-green-400/10 px-6 py-3 text-base font-semibold text-green-300 transition hover:bg-green-400/20"
              >
                🔸 Join WhatsApp Community
              </a>
            </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
