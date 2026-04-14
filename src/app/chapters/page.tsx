'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BitcoinIcon, WalletIcon, LightningIcon, BookIcon, ToolIcon, BlockchainIcon, KeysIcon, UTXOIcon, TransactionIcon, MiningIcon } from "@/components/BitcoinIcons";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "@/hooks/useSession";
import { Download, FileText, BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';
import { AnimatedSection } from "@/components/AnimatedSection";
import { AnimatedHeading } from "@/components/AnimatedHeading";
import { AnimatedList } from "@/components/AnimatedList";
import { SyllabusModal } from "@/components/SyllabusModal";
import SplitText from "@/components/SplitText";
import { chaptersList as chapters } from "@/content/chaptersListContent";
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
  {
    id: 1,
    roman: "I",
    theme: "Genesis",
    name: "Level I — Genesis",
    description:
      "Why money breaks down today, what Bitcoin changes, and your first concrete steps—wallets, keys, and using the network with confidence.",
    color: "cyan",
  },
  {
    id: 2,
    roman: "II",
    theme: "Difficulty Adjustment",
    name: "Level II — Difficulty Adjustment",
    description:
      "How mining and the difficulty adjustment secure the chain, plus security habits and practical skills you can apply in real situations.",
    color: "orange",
  },
  {
    id: 3,
    roman: "III",
    theme: "Advanced Sovereignty",
    name: "Level III — Advanced Sovereignty",
    description:
      "Deep verification, custody models, and collaborative setups—full control of your rules without having to go it alone.",
    color: "purple",
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
  const [expandedStudyMaterial, setExpandedStudyMaterial] = useState<string | null>(null);
  const [chapterStatus, setChapterStatus] = useState<Record<number, { isUnlocked: boolean; isCompleted: boolean }>>({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const { isAuthenticated, profile, loading } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const router = useRouter();

  useEffect(() => {
    const fetchChapterStatus = async () => {
      if (loading || adminLoading) return;
      
      // If admin is logged in, use admin email; otherwise use profile email if authenticated
      const emailToUse = isAdminAuth && adminEmail ? adminEmail : (isAuthenticated && profile ? profile.email : null);
      
      if (!emailToUse) {
        setLoadingStatus(false);
        return;
      }

      try {
        const response = await fetch('/api/chapters/unlock-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse }),
        });

        const data = await response.json();
        if (data.isAdmin) {
          setIsAdmin(true);
        }
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
  }, [isAuthenticated, profile, loading, isAdminAuth, adminEmail, adminLoading]);

  const isChapterUnlocked = (chapterNumber: number): boolean => {
    // Admins have access to all chapters
    if (isAdmin || isAdminAuth) return true;
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
    // Admins can always access, so if admin is logged in and chapter is unlocked, navigate directly
    if (isAdminAuth && isChapterUnlocked(chapterNumber)) {
      router.push(`/chapters/${generateSlug(chapterTitle)}`);
      return;
    }

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
    <>
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <AnimatedHeading
                as="h1"
                className="text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl leading-[1.15] pb-1"
              >
                <SplitText
                  text="Learning Path"
                  tag="span"
                  className="inline-block align-top"
                  delay={50}
                  duration={1.25}
                  ease="bounce.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                />
              </AnimatedHeading>
              <div className="mx-auto mt-8 max-w-4xl">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xl sm:text-2xl lg:text-3xl font-semibold">
                  <div className="flex items-center gap-3 text-cyan-300">
                    <span>Bitcoin Foundations</span>
                  </div>
                  <span className="text-orange-400 text-2xl sm:text-3xl">→</span>
                  <div className="flex items-center gap-3 text-orange-300">
                    <span>Lightning</span>
                  </div>
                  <span className="text-purple-400 text-2xl sm:text-3xl">→</span>
                  <div className="flex items-center gap-3 text-purple-300">
                    <span>Sovereignty</span>
                  </div>
                </div>
              </div>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                Follow the lessons in order—complete each chapter to unlock the next.
              </p>
              <p className="mx-auto mt-2 max-w-3xl text-base text-zinc-400">
                Each chapter includes diagrams, real examples, assignments, and a quick quiz.
              </p>
            </div>
          </AnimatedSection>

          {/* Learning Path Progress Bar */}
          <AnimatedSection animation="slideRight">
            <div className="mb-16 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <AnimatedHeading as="h2" className="mb-6 text-center text-xl font-semibold text-cyan-200">
              Your Progress Through the Levels
            </AnimatedHeading>
            {/* Aligned grid-cols-3: circles + paths share the same columns as Level + theme below */}
            <div className="w-full space-y-4 px-0 sm:px-1">
              <div className="grid w-full grid-cols-3">
                {levels.map((level, index) => {
                  const circleClass =
                    level.color === "cyan"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : level.color === "orange"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-purple-500/20 text-purple-300";
                  const glowClass =
                    level.color === "cyan"
                      ? "bg-cyan-400/0"
                      : level.color === "orange"
                        ? "bg-orange-400/0"
                        : "bg-purple-400/0";
                  const pathLeft =
                    index === 0 ? null : index === 1 ? (
                      <div
                        className="relative h-0.5 min-h-[2px] w-full min-w-0 overflow-hidden rounded-full bg-cyan-400/25"
                        aria-hidden
                      >
                        <div className="path-glow-flow path-glow-flow-cyan animate-path-glow-1 absolute inset-0 rounded-full" />
                </div>
                    ) : (
                      <div
                        className="relative h-0.5 min-h-[2px] w-full min-w-0 overflow-hidden rounded-full bg-orange-400/25"
                        aria-hidden
                      >
                        <div className="path-glow-flow path-glow-flow-orange animate-path-glow-2 absolute inset-0 rounded-full" />
                </div>
                    );
                  const pathRight =
                    index >= 2 ? null : index === 0 ? (
                      <div
                        className="relative h-0.5 min-h-[2px] w-full min-w-0 overflow-hidden rounded-full bg-cyan-400/25"
                        aria-hidden
                      >
                        <div className="path-glow-flow path-glow-flow-cyan animate-path-glow-1 absolute inset-0 rounded-full" />
                </div>
                    ) : (
                      <div
                        className="relative h-0.5 min-h-[2px] w-full min-w-0 overflow-hidden rounded-full bg-orange-400/25"
                        aria-hidden
                      >
                        <div className="path-glow-flow path-glow-flow-orange animate-path-glow-2 absolute inset-0 rounded-full" />
                </div>
                    );
                  return (
                    <div
                      key={`row-circle-${level.id}`}
                      className="flex min-w-0 flex-col items-stretch justify-center px-1 sm:px-2"
                    >
                      <div className="flex w-full min-h-[3.5rem] items-center sm:min-h-[4rem]">
                        <div className="flex h-0.5 min-h-[2px] flex-1 items-center self-center">
                          {pathLeft ?? <span className="block min-w-0 flex-1" aria-hidden />}
                </div>
                        <div className="relative z-10 flex shrink-0 justify-center px-0.5">
                          <div
                            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all duration-1000 sm:h-14 sm:w-14 sm:text-lg ${circleClass}`}
                            id={`level-${level.id}-circle`}
                          >
                            <div
                              className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${glowClass}`}
                              id={`level-${level.id}-glow`}
                            />
                            <span className="relative z-10">{level.roman}</span>
              </div>
            </div>
                        <div className="flex h-0.5 min-h-[2px] flex-1 items-center self-center">
                          {pathRight ?? <span className="block min-w-0 flex-1" aria-hidden />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid w-full grid-cols-3 divide-x divide-zinc-700/50">
                {levels.map((level) => {
                  const themeClass =
                    level.color === "cyan"
                      ? "text-cyan-200"
                      : level.color === "orange"
                        ? "text-orange-200"
                        : "text-purple-200";
                  return (
                    <div
                      key={`row-label-${level.id}`}
                      className="flex min-w-0 flex-col items-center gap-2 px-2 py-1 text-center sm:px-4"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
                        Level {level.roman}
                      </div>
                      <div className={`text-xs font-semibold leading-snug sm:text-sm ${themeClass}`}>
                        {level.theme}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
            <style jsx>{`
              /*
               * One sequential journey per loop: I → line → II → line → III → rest (16s).
               * Path “water flow”: fixed soft gradient + background-position sweep (linear) —
               * no swapping gradient keyframes, so the line reads as continuous fluid motion.
               */
              .path-glow-flow {
                background-repeat: no-repeat;
                background-size: 280% 100%;
                will-change: background-position, opacity, filter;
              }

              .path-glow-flow-cyan {
                background-image: linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(34, 211, 238, 0) 6%,
                  rgba(34, 211, 238, 0.04) 11%,
                  rgba(34, 211, 238, 0.14) 18%,
                  rgba(34, 211, 238, 0.38) 28%,
                  rgba(34, 211, 238, 0.72) 38%,
                  rgba(34, 211, 238, 0.95) 45%,
                  rgba(34, 211, 238, 1) 50%,
                  rgba(34, 211, 238, 0.95) 55%,
                  rgba(34, 211, 238, 0.72) 62%,
                  rgba(34, 211, 238, 0.38) 72%,
                  rgba(34, 211, 238, 0.14) 82%,
                  rgba(34, 211, 238, 0.04) 89%,
                  rgba(34, 211, 238, 0) 94%,
                  transparent 100%
                );
                box-shadow: 0 0 14px rgba(34, 211, 238, 0.15), inset 0 0 12px rgba(34, 211, 238, 0.08);
              }

              .path-glow-flow-orange {
                background-image: linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(249, 115, 22, 0) 6%,
                  rgba(249, 115, 22, 0.04) 11%,
                  rgba(249, 115, 22, 0.14) 18%,
                  rgba(249, 115, 22, 0.38) 28%,
                  rgba(249, 115, 22, 0.72) 38%,
                  rgba(249, 115, 22, 0.95) 45%,
                  rgba(249, 115, 22, 1) 50%,
                  rgba(249, 115, 22, 0.95) 55%,
                  rgba(249, 115, 22, 0.72) 62%,
                  rgba(249, 115, 22, 0.38) 72%,
                  rgba(249, 115, 22, 0.14) 82%,
                  rgba(249, 115, 22, 0.04) 89%,
                  rgba(249, 115, 22, 0) 94%,
                  transparent 100%
                );
                box-shadow: 0 0 14px rgba(249, 115, 22, 0.15), inset 0 0 12px rgba(249, 115, 22, 0.08);
              }

              @keyframes path-glow-1 {
                0%,
                11%,
                32%,
                100% {
                  opacity: 0;
                  background-position: 100% 0;
                  filter: blur(0);
                }
                11.5% {
                  opacity: 0;
                  background-position: 100% 0;
                  filter: blur(0.4px);
                }
                12% {
                  opacity: 0.35;
                  background-position: 100% 0;
                  filter: blur(0.5px);
                }
                12.5% {
                  opacity: 1;
                  background-position: 100% 0;
                  filter: blur(0.55px);
                }
                30% {
                  opacity: 1;
                  background-position: -35% 0;
                  filter: blur(0.55px);
                }
                31% {
                  opacity: 0;
                  background-position: -35% 0;
                  filter: blur(0);
                }
              }
              
              @keyframes path-glow-2 {
                0%,
                35%,
                54%,
                100% {
                  opacity: 0;
                  background-position: 100% 0;
                  filter: blur(0);
                }
                35.5% {
                  opacity: 0;
                  background-position: 100% 0;
                  filter: blur(0.4px);
                }
                36% {
                  opacity: 0.35;
                  background-position: 100% 0;
                  filter: blur(0.5px);
                }
                36.5% {
                  opacity: 1;
                  background-position: 100% 0;
                  filter: blur(0.55px);
                }
                52% {
                  opacity: 1;
                  background-position: -35% 0;
                  filter: blur(0.55px);
                }
                53% {
                  opacity: 0;
                  background-position: -35% 0;
                  filter: blur(0);
                }
              }

              @keyframes level-glow-1 {
                0%,
                18%,
                64%,
                100% {
                  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                  background-color: rgba(34, 211, 238, 0.2);
                  transform: scale(1);
                }
                2% {
                  box-shadow: 0 0 10px rgba(34, 211, 238, 0.45);
                  background-color: rgba(34, 211, 238, 0.38);
                  transform: scale(1.02);
                }
                6% {
                  box-shadow: 0 0 28px rgba(34, 211, 238, 0.95), 0 0 52px rgba(34, 211, 238, 0.45);
                  background-color: rgba(34, 211, 238, 0.58);
                  transform: scale(1.05);
                }
                10% {
                  box-shadow: 0 0 32px rgba(34, 211, 238, 1), 0 0 56px rgba(34, 211, 238, 0.5);
                  background-color: rgba(34, 211, 238, 0.55);
                  transform: scale(1.055);
                }
                14% {
                  box-shadow: 0 0 18px rgba(34, 211, 238, 0.65);
                  background-color: rgba(34, 211, 238, 0.42);
                  transform: scale(1.03);
                }
              }
              
              @keyframes level-glow-2 {
                0%,
                22%,
                42%,
                64%,
                100% {
                  box-shadow: 0 0 0 rgba(249, 115, 22, 0);
                  background-color: rgba(249, 115, 22, 0.2);
                  transform: scale(1);
                }
                24% {
                  box-shadow: 0 0 10px rgba(249, 115, 22, 0.45);
                  background-color: rgba(249, 115, 22, 0.38);
                  transform: scale(1.02);
                }
                28% {
                  box-shadow: 0 0 28px rgba(249, 115, 22, 0.95), 0 0 52px rgba(249, 115, 22, 0.42);
                  background-color: rgba(249, 115, 22, 0.58);
                  transform: scale(1.05);
                }
                32% {
                  box-shadow: 0 0 32px rgba(249, 115, 22, 1), 0 0 56px rgba(249, 115, 22, 0.48);
                  background-color: rgba(249, 115, 22, 0.55);
                  transform: scale(1.055);
                }
                36% {
                  box-shadow: 0 0 18px rgba(249, 115, 22, 0.65);
                  background-color: rgba(249, 115, 22, 0.42);
                  transform: scale(1.03);
                }
              }
              
              @keyframes level-glow-3 {
                0%,
                44%,
                66%,
                100% {
                  box-shadow: 0 0 0 rgba(168, 85, 247, 0);
                  background-color: rgba(168, 85, 247, 0.2);
                  transform: scale(1);
                }
                46% {
                  box-shadow: 0 0 10px rgba(168, 85, 247, 0.45);
                  background-color: rgba(168, 85, 247, 0.38);
                  transform: scale(1.02);
                }
                50% {
                  box-shadow: 0 0 28px rgba(168, 85, 247, 0.95), 0 0 52px rgba(168, 85, 247, 0.42);
                  background-color: rgba(168, 85, 247, 0.58);
                  transform: scale(1.05);
                }
                54% {
                  box-shadow: 0 0 34px rgba(168, 85, 247, 1), 0 0 58px rgba(168, 85, 247, 0.5);
                  background-color: rgba(168, 85, 247, 0.56);
                  transform: scale(1.06);
                }
                58% {
                  box-shadow: 0 0 22px rgba(168, 85, 247, 0.72);
                  background-color: rgba(168, 85, 247, 0.45);
                  transform: scale(1.04);
                }
                62% {
                  box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
                  background-color: rgba(168, 85, 247, 0.32);
                  transform: scale(1.02);
                }
              }

              @keyframes glow-overlay-1 {
                0%,
                18%,
                64%,
                100% {
                  opacity: 0; 
                  transform: scale(0.92);
                }
                2% {
                  opacity: 0.35;
                  transform: scale(0.98);
                }
                6% {
                  opacity: 1; 
                  transform: scale(1.06);
                }
                10% {
                  opacity: 0.92;
                  transform: scale(1.05);
                }
                14% {
                  opacity: 0.45;
                  transform: scale(1);
                }
              }
              
              @keyframes glow-overlay-2 {
                0%,
                22%,
                42%,
                64%,
                100% {
                  opacity: 0; 
                  transform: scale(0.92);
                }
                24% {
                  opacity: 0.35;
                  transform: scale(0.98);
                }
                28% {
                  opacity: 1; 
                  transform: scale(1.06);
                }
                32% {
                  opacity: 0.92;
                  transform: scale(1.05);
                }
                36% {
                  opacity: 0.45;
                  transform: scale(1);
                }
              }
              
              @keyframes glow-overlay-3 {
                0%,
                44%,
                66%,
                100% {
                  opacity: 0; 
                  transform: scale(0.92);
                }
                46% {
                  opacity: 0.35;
                  transform: scale(0.98);
                }
                50% { 
                  opacity: 1; 
                  transform: scale(1.07);
                }
                54% {
                  opacity: 0.95;
                  transform: scale(1.06);
                }
                58% {
                  opacity: 0.65;
                  transform: scale(1.03);
                }
                62% {
                  opacity: 0.25;
                  transform: scale(1);
                }
              }
              
              .animate-path-glow-1 {
                animation: path-glow-1 16s linear infinite;
              }
              
              .animate-path-glow-2 {
                animation: path-glow-2 16s linear infinite;
              }
              
              #level-1-circle {
                animation: level-glow-1 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
                will-change: box-shadow, transform;
              }
              
              #level-2-circle {
                animation: level-glow-2 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
                will-change: box-shadow, transform;
              }
              
              #level-3-circle {
                animation: level-glow-3 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
                will-change: box-shadow, transform;
              }
              
              #level-1-glow {
                animation: glow-overlay-1 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
              }
              
              #level-2-glow {
                animation: glow-overlay-2 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
              }
              
              #level-3-glow {
                animation: glow-overlay-3 16s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
              }

              @media (prefers-reduced-motion: reduce) {
                .path-glow-flow,
                .animate-path-glow-1,
                .animate-path-glow-2,
                #level-1-circle,
                #level-2-circle,
                #level-3-circle,
                #level-1-glow,
                #level-2-glow,
                #level-3-glow {
                  animation: none !important;
                }
              }
            `}</style>
          </AnimatedSection>

          {/* Study Materials */}
          <div className="mb-16">
            <AnimatedSection animation="slideUp">
              <AnimatedHeading as="h2" className="mb-3 text-2xl font-semibold text-orange-300 sm:text-3xl">Study Materials</AnimatedHeading>
              <p className="mb-8 text-base text-zinc-300 sm:text-lg">
                Download essential Bitcoin resources and books to deepen your understanding:
              </p>
            </AnimatedSection>
            <div className="hidden mb-6 space-y-2">
              {[
                { id: 'whitepaper', title: 'Bitcoin: A Peer-to-Peer Electronic Cash System (English)', author: 'Satoshi Nakamoto (2008)', description: "The original white paper that started it all. Essential reading for understanding Bitcoin's core design.", href: 'https://bitcoin.org/bitcoin.pdf', action: 'Download', external: true },
                { id: 'whitepaper-ti', title: 'ቢትኮይን፡ ስርዓት ናይ መዘና-ናብ-መዘና ኤሌክትሮኒካዊ ገንዘብ', author: 'ትግርኛ ትርጉም (Pan-African Bitcoin Academy)', description: 'Tigrigna translation of the Bitcoin whitepaper for Eritrean learners and native Tigrigna readers.', href: '/doc_files/Bitcoin%20white%20paper%20Tigrigna.pdf', action: 'Download PDF', external: false },
                { id: 'little-book', title: 'The Little Bitcoin Book', author: 'Bitcoin Collective (2019)', description: 'A simple, beginner-friendly introduction to Bitcoin that explains why it matters for sovereignty and self-custody.', href: 'https://www.littlebitcoinbook.com/', action: 'Read Online', external: true },
                { id: 'mastering', title: 'Mastering Bitcoin', author: 'Andreas M. Antonopoulos', description: 'Comprehensive technical guide to Bitcoin for developers, engineers, and technically-minded individuals.', href: 'https://github.com/bitcoinbook/bitcoinbook', action: 'Access', external: true },
                { id: 'bitcoin-standard', title: 'The Bitcoin Standard', author: 'Saifedean Ammous (2018)', description: "Economic analysis of Bitcoin's origins, monetary properties, and its potential impact on the global economy.", href: 'https://saifedean.com/thebitcoinstandard/', action: 'Learn More', external: true },
                { id: 'africa-guide', title: 'Bitcoin Africa: Guide to Freedom Money', author: 'African Bitcoiners (2nd Edition)', description: 'A practical Africa-focused Bitcoin guide covering financial freedom, self-custody, and real-world use.', href: 'https://bitcoiners.africa/wp-content/uploads/2026/03/BITCOIN_Africa-Guide-to-Freedom-Money_by-African-Bitcoiners-2ND-EDITION.pdf', action: 'Download PDF', external: true },
                { id: 'programming', title: 'Programming Bitcoin', author: 'Jimmy Song (2019)', description: 'Learn Bitcoin by programming it from scratch. Build Bitcoin libraries in Python step by step.', href: 'https://github.com/jimmysong/programmingbitcoin', action: 'Access', external: true },
                { id: 'layered-money', title: 'Layered Money', author: 'Nik Bhatia (2021)', description: 'Explains the evolution of money through different layers and why Bitcoin represents a new monetary layer.', href: 'https://www.layeredmoney.com/', action: 'Learn More', external: true },
                { id: 'tigrigna', title: 'The Little Book of Bitcoin in Tigrigna', author: 'ትግርኛ ትርጉም', description: 'A simple, beginner-friendly introduction to Bitcoin translated into Tigrigna, explaining why it matters for sovereignty and self-custody.', href: 'https://drive.google.com/file/d/1YcU6OIHZEsp4c6KOwAVDUGI2BfNtxx5T/view?usp=drive_link', action: 'Download', external: true },
                { id: 'dev-philosophy', title: 'Bitcoin Development Philosophy', author: 'Kalle Rosenbaum & Linnéa Rosenbaum', description: "A guide for Bitcoin developers covering decentralization, trustlessness, privacy, scaling, and the philosophy behind Bitcoin's design trade-offs.", href: 'https://bitcointeaching.dev/', action: 'Read Online', external: true },
                { id: 'scams', title: 'Understanding Bitcoin Scams', author: 'Pan-Africa Bitcoin Academy', description: 'Learn to recognize and avoid investment scams, impersonation, phishing, and malware. Essential reading to protect yourself.', href: '/scam', action: 'Read', external: false },
                { id: 'exonumia', title: 'Exonumia Africa', author: 'Localized African Bitcoin learning resources', description: 'Explore Bitcoin education resources in multiple African languages and countries.', href: 'https://exonumia.africa/', action: 'Visit', external: true },
              ].map((material, idx) => {
                const isOpen = expandedStudyMaterial === material.id;
                return (
                  <AnimatedSection animation="slideUp" delay={idx * 60} key={material.id}>
                    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-black/60">
                      <button
                        type="button"
                        onClick={() => setExpandedStudyMaterial((prev) => (prev === material.id ? null : material.id))}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-900/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100">{material.title}</p>
                          <p className="text-xs text-zinc-400">{material.author}</p>
                        </div>
                        <span className={`text-lg leading-none text-zinc-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                          ⌄
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-zinc-800/80 px-4 py-3">
                          <p className="mb-3 text-sm text-zinc-300">{material.description}</p>
                          {material.external ? (
                            <a
                              href={material.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/22"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {material.action}
                            </a>
                          ) : (
                            <Link
                              href={material.href}
                              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/22"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {material.action}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Bitcoin White Paper (English) */}
              <AnimatedSection animation="slideUp" delay={0}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-orange-300 transition group-hover:text-orange-200">
                      Bitcoin: A Peer-to-Peer Electronic Cash System (English)
                    </AnimatedHeading>
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
              </AnimatedSection>

              {/* Bitcoin White Paper (Tigrigna) */}
              <AnimatedSection animation="slideUp" delay={40}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push('/white_paper')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push('/white_paper');
                  }
                }}
                className="group flex flex-col rounded-xl border border-cyan-400/30 bg-black/60 p-6 transition hover:border-cyan-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/20 p-3">
                    <FileText className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                      ቢትኮይን፡ ስርዓት ናይ መዘና-ናብ-መዘና ኤሌክትሮኒካዊ ገንዘብ
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">ትግርኛ ትርጉም (Pan-African Bitcoin Academy)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Tigrigna translation of the Bitcoin whitepaper for Eritrean learners and native Tigrigna readers.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                    PDF (Tigrigna)
                  </span>
                  <a
                    href="/doc_files/Bitcoin%20white%20paper%20Tigrigna.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    <span>Open PDF</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              </AnimatedSection>

              {/* The Little Book of Bitcoin */}
              <AnimatedSection animation="slideUp" delay={80}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                      The Little Bitcoin Book
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">Bitcoin Collective (2019)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A simple, beginner-friendly introduction to Bitcoin that explains why it matters for sovereignty and self-custody.
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
              </AnimatedSection>

              {/* Mastering Bitcoin */}
              <AnimatedSection animation="slideUp" delay={160}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-purple-300 transition group-hover:text-purple-200">
                      Mastering Bitcoin
                    </AnimatedHeading>
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
              </AnimatedSection>

              {/* The Bitcoin Standard */}
              <AnimatedSection animation="slideUp" delay={240}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-yellow-300 transition group-hover:text-yellow-200">
                      The Bitcoin Standard
                    </AnimatedHeading>
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
              </AnimatedSection>

              {/* Bitcoin Africa Guide to Freedom Money */}
              <AnimatedSection animation="slideUp" delay={280}>
              <a
                href="https://bitcoiners.africa/wp-content/uploads/2026/03/BITCOIN_Africa-Guide-to-Freedom-Money_by-African-Bitcoiners-2ND-EDITION.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-emerald-400/30 bg-black/60 p-6 transition hover:border-emerald-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-emerald-300 transition group-hover:text-emerald-200">
                      Bitcoin Africa: Guide to Freedom Money
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">African Bitcoiners (2nd Edition)</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A practical Africa-focused Bitcoin guide covering financial freedom, self-custody, and real-world use.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    Free PDF
                  </span>
                  <div className="flex items-center gap-2 text-emerald-300 transition group-hover:text-emerald-200">
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download PDF</span>
                  </div>
                </div>
              </a>
              </AnimatedSection>

              {/* Programming Bitcoin */}
              <AnimatedSection animation="slideUp" delay={320}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-green-300 transition group-hover:text-green-200">
                      Programming Bitcoin
                    </AnimatedHeading>
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
              </AnimatedSection>

              {/* Layered Money */}
              <AnimatedSection animation="slideUp" delay={400}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-blue-300 transition group-hover:text-blue-200">
                      Layered Money
                    </AnimatedHeading>
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
              </AnimatedSection>

              {/* The Little Book of Bitcoin in Tigrigna */}
              <AnimatedSection animation="slideUp" delay={480}>
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
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-teal-300 transition group-hover:text-teal-200">
                      The Little Book of Bitcoin in Tigrigna
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">ትግርኛ ትርጉም</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A simple, beginner-friendly introduction to Bitcoin translated into Tigrigna, explaining why it matters for sovereignty and self-custody.
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
              </AnimatedSection>

              {/* Bitcoin Development Philosophy */}
              <AnimatedSection animation="slideUp" delay={560}>
              <a
                href="http://bitcoindevphilosophy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-rose-400/30 bg-black/60 p-6 transition hover:border-rose-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-rose-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-rose-300 transition group-hover:text-rose-200">
                      Bitcoin Development Philosophy
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">Kalle Rosenbaum & Linnéa Rosenbaum</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  A guide for Bitcoin developers covering decentralization, trustlessness, privacy, scaling, and the philosophy behind Bitcoin's design trade-offs.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300">
                    Free (Online)
                  </span>
                  <div className="flex items-center gap-2 text-sm text-rose-400">
                    <span>Read Online</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>
              </AnimatedSection>

              {/* Understanding Bitcoin Scams */}
              <AnimatedSection animation="slideUp" delay={640}>
              <Link
                href="/scam"
                className="group flex flex-col rounded-xl border border-amber-400/30 bg-black/60 p-6 transition hover:border-amber-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-3">
                    <AlertTriangle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-amber-300 transition group-hover:text-amber-200">
                      Understanding Bitcoin Scams
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">Pan-Africa Bitcoin Academy</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Learn to recognize and avoid investment scams, impersonation, phishing, and malware. Essential reading to protect yourself.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                    Guide
                  </span>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <span>Read</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </Link>
              </AnimatedSection>

              {/* Exonumia Africa */}
              <AnimatedSection animation="slideUp" delay={720}>
              <a
                href="https://exonumia.africa/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-indigo-400/30 bg-black/60 p-6 transition hover:border-indigo-400/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/20 p-3">
                    <BookOpen className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-indigo-300 transition group-hover:text-indigo-200">
                      Exonumia Africa
                    </AnimatedHeading>
                    <p className="text-sm text-zinc-400">Localized African Bitcoin learning resources</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-zinc-300">
                  Explore Bitcoin education resources in multiple African languages and countries.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                    Free (Online)
                  </span>
                  <div className="flex items-center gap-2 text-sm text-indigo-400">
                    <span>Visit</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </a>
              </AnimatedSection>
            </div>
          </div>

          {/* Chapters by Level */}
          {levels.map((level, levelIndex) => {
            const levelChapters = getLevelChapters(level.id);
            // Level I (index 0) slides from left, Level II (index 1) from right, Level III (index 2) from left
            const animationType = levelIndex === 0 ? 'slideLeft' : levelIndex === 1 ? 'slideRight' : 'slideLeft';
            const levelHeadingAccent =
              level.color === "cyan"
                ? "text-cyan-300"
                : level.color === "orange"
                  ? "text-orange-300"
                  : "text-purple-300";
            const levelIntroBar =
              level.color === "cyan"
                ? "from-cyan-500/40"
                : level.color === "orange"
                  ? "from-orange-500/40"
                  : "from-purple-500/40";

            return (
              <AnimatedSection key={level.id} animation={animationType}>
                <div className="mb-16">
                <div className="mb-8 max-w-3xl border-b border-zinc-800/80 pb-8">
                  <AnimatedHeading
                    as="h2"
                    className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl"
                  >
                    <span className="text-zinc-400">Level {level.roman}</span>
                    <span className="mx-2 text-zinc-600 sm:mx-3" aria-hidden>
                      —
                    </span>
                    <span className={levelHeadingAccent}>{level.theme}</span>
                  </AnimatedHeading>
                  <div
                    className={`mt-4 h-px w-16 rounded-full bg-gradient-to-r ${levelIntroBar} to-transparent`}
                    aria-hidden
                  />
                  <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
                    {level.description}
                  </p>
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
                            <AnimatedHeading as="h3" className="mt-1 text-lg font-semibold text-zinc-50 group-hover:text-cyan-100">
                              {chapter.title}
                            </AnimatedHeading>
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
                            <p className="mb-1 font-medium text-purple-200">🎥 Live Session:</p>
                            <p className="ml-4 text-zinc-400">{chapter.LiveSession}</p>
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-cyan-200">Quiz:</p>
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
                      {((isAuthenticated && profile && isChapterUnlocked(chapter.number)) || (isAdminAuth && isChapterUnlocked(chapter.number))) ? (
                        <Link
                          href={`/chapters/${generateSlug(chapter.title)}`}
                          className="block w-full rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-4 py-2 text-center text-sm font-semibold text-black transition hover:brightness-110"
                        >
                          {isChapterCompleted(chapter.number) ? 'Review Chapter →' : 'View Chapter →'}
                        </Link>
                      ) : (isAuthenticated && profile) ? (
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
            <AnimatedHeading as="h2" className="mb-6 text-2xl font-semibold text-purple-200">Coming Soon</AnimatedHeading>
            <p className="mb-4 text-sm text-zinc-300">
              We're constantly expanding our curriculum. Here's what's coming next:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-500/10 px-4 py-2"
                >
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            </div>
          </AnimatedSection>

          {/* Footer CTA */}
          <AnimatedSection animation="slideRight">
            <div className="rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <AnimatedHeading as="h2" className="mb-4 text-2xl font-semibold text-orange-200">Ready to start learning?</AnimatedHeading>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
              >
                🔸 Join our course
              </Link>
              <button
                onClick={() => setIsSyllabusOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                🔸 Download the Syllabus
              </button>
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
      
      {/* Syllabus Modal */}
      <SyllabusModal
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
        chapters={chapters}
        levels={levels}
      />
    </div>
    </>
  );
}
