"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Shield, Lock, UserX, Code2, Bug, CheckCircle2, X } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";
import {
  investmentScams,
  socialScams,
  technicalScams,
  malwareScams,
} from "./scamData";

function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={
        "rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center text-amber-200/80 text-sm font-medium " +
        className
      }
    >
      {label}
    </div>
  );
}

export default function ScamPage() {
  const [fullViewImage, setFullViewImage] = useState<string | null>(null);

  const closeFullView = useCallback(() => setFullViewImage(null), []);

  useEffect(() => {
    if (!fullViewImage) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullView();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [fullViewImage, closeFullView]);

  return (
    <div className="relative min-h-screen w-full bg-black text-zinc-50">
      {/* Full-view image modal */}
      {fullViewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeFullView}
          role="dialog"
          aria-modal="true"
          aria-label="Full size image view"
        >
          <button
            type="button"
            onClick={closeFullView}
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition z-10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullViewImage}
            alt="Full size view"
            className="max-h-[90vh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
      {/* Full-width layout: no max-width constraint */}
      <main className="relative z-10 w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-16">
        {/* Sticky nav */}
        <nav
          aria-label="Page sections"
          className="sticky top-0 z-20 -mx-4 mb-8 flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
        >
          <a href="#hero" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Intro
          </a>
          <a href="#section-1" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Investment
          </a>
          <a href="#section-2" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Impersonation
          </a>
          <a href="#section-3" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Phishing
          </a>
          <a href="#section-4" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Malware
          </a>
          <a href="#section-pattern" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Pattern
          </a>
          <a href="#section-5" className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-cyan-200 transition">
            Protect
          </a>
          <Link href="/" className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300">
            Back to site
          </Link>
        </nav>

        <div className="space-y-24 sm:space-y-32">
          {/* ——— Hero ——— */}
          <AnimatedSection animation="slideUp" delay={0}>
            <section id="hero" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 sm:p-10 lg:p-12">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl xl:text-5xl max-w-4xl">
                  Understanding Bitcoin Scams – From General to High-Risk Scams
                </h1>
                <p className="mt-5 max-w-3xl text-zinc-300 leading-relaxed text-base sm:text-lg">
                  Scams in Bitcoin and crypto often exploit <strong className="text-zinc-100">human psychology</strong>,{" "}
                  <strong className="text-zinc-100">technical confusion</strong>, and{" "}
                  <strong className="text-zinc-100">financial greed</strong>. This page helps you{" "}
                  <strong className="text-cyan-200">recognize and avoid</strong> these scams.
                </p>
                <div className="mt-8 grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7 flex items-center justify-center min-h-[180px] rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-amber-500/5 to-rose-500/10 p-8 sm:p-10">
                    <p className="text-center font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-rose-300 drop-shadow-sm">
                      “If something sounds too good to be true, it probably is.”
                    </p>
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <video
                        src="/images/scams/ether.mp4"
                        controls
                        className="w-full aspect-video min-h-[200px] rounded-xl border border-zinc-700/80 bg-black"
                        preload="metadata"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                  </div>
                </div>
                <div role="alert" className="mt-8 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-400 mt-0.5" />
                  <p className="text-sm font-medium text-amber-200">
                    If something promises guaranteed profits, it is almost certainly a scam.
                  </p>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Section 1: Investment & Trading ——— */}
          <AnimatedSection animation="slideUp" delay={80}>
            <section id="section-1" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="grid lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-6 w-6 text-cyan-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Section 1</span>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl lg:text-3xl">
                      Investment & Trading Scams
                    </h2>
                    <p className="mt-2 text-cyan-200/90 font-medium text-lg">
                      The Illusion of Easy Profit
                    </p>
                    <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed">
                      <p>
                        Investment scams are the most common form of fraud in the Bitcoin and cryptocurrency ecosystem. They target a very simple human instinct: the desire to grow money quickly. Scammers exploit this by presenting opportunities that appear highly profitable, low-risk, and time-sensitive.
                      </p>
                      <p>
                        In traditional finance, investment opportunities are usually regulated, audited, and transparent. In contrast, many cryptocurrency platforms operate globally and online, making it easier for scammers to create convincing but fraudulent investment schemes. A scammer can build a professional-looking website, create fake trading dashboards, fabricate profit charts, and even simulate withdrawal histories to convince victims that the investment is legitimate.
                      </p>
                      <p>
                        Many of these scams operate by attracting new investors and using their funds to pay earlier participants. This creates the illusion that the platform is profitable. However, once enough money has been collected, the operators disappear with the funds, leaving investors with nothing.
                      </p>
                      <p>
                        These scams often rely on persuasive marketing techniques such as social media advertising, influencer endorsements, or private messaging groups. Victims are often encouraged to act quickly to avoid “missing the opportunity.”
                      </p>
                      <p className="text-amber-200/90 font-medium">
                        Students should understand that legitimate investments never guarantee profits, especially in volatile markets like cryptocurrency. Any system promising fixed or guaranteed returns is a strong indicator of fraud.
                      </p>
                    </div>
                    <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
                        Scam website example (for analysis only)
                      </p>
                      <a
                        href="https://phemex.com/blogs/bitcoin-scam-websites"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-cyan-200 hover:text-cyan-100 underline underline-offset-2 transition"
                      >
                        Bitcoin Scam Websites: What To Look Out For
                      </a>
                      <p className="mt-1 text-xs text-zinc-400">
                        Breakdown of how scam websites operate, with examples like My Big Coin, BitClub, clipboard hijackers, and how to avoid
                        falling for these patterns. Do <span className="font-semibold text-amber-200">not</span> treat sites like this as trusted
                        services.
                      </p>
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-8 flex items-center justify-center bg-zinc-800/30 border-t lg:border-t-0 lg:border-l border-zinc-700/80">
                    <button
                      type="button"
                      onClick={() => setFullViewImage("/images/scams/fake.jpeg")}
                      className="w-full max-w-xl rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      aria-label="View full size"
                    >
                      <img
                        src="/images/scams/fake.jpeg"
                        alt="Investment and trading scams — diagram or example"
                        className="w-full h-auto max-h-[min(560px,65vh)] object-contain bg-zinc-800/30"
                      />
                    </button>
                  </div>
                </div>
                <div className="p-8 sm:p-10 lg:p-12 border-t border-zinc-700/80">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Scams in this category</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {investmentScams.map((card, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 hover:border-cyan-500/30 transition-colors">
                        <p className="font-medium text-zinc-100 text-sm">{card.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{card.explanation}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Fake / scam example 1</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/fakebi.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/fakebi.jpeg"
                          alt="Scam example — fake"
                          className="w-full h-auto max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Fake / scam example 2</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/fakebi2.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/fakebi2.jpeg"
                          alt="Scam example — fake 2"
                          className="w-full h-auto max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col max-w-xl">
                    <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Real / legitimate example</p>
                    <button
                      type="button"
                      onClick={() => setFullViewImage("/images/scams/realbi.jpeg")}
                      className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                      aria-label="View full size"
                    >
                      <img
                        src="/images/scams/realbi.jpeg"
                        alt="Legitimate example — real"
                        className="w-full h-auto max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                      />
                    </button>
                  </div>
                  <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Scam Diagram</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/faceinvest.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/faceinvest.jpeg"
                          alt="Scam diagram — investment and trading scams"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <Placeholder label="Example Screenshot" className="aspect-video" />
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Educational Video</p>
                      <video
                        src="/images/scams/rugpull.mp4"
                        controls
                        className="w-full aspect-video rounded-xl border border-zinc-700/80 bg-black"
                        preload="metadata"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Section 2: Impersonation & Social ——— */}
          <AnimatedSection animation="slideUp" delay={80}>
            <section id="section-2" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="grid lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-5 order-2 lg:order-1 p-6 sm:p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-r border-zinc-700/80">
                    <button
                      type="button"
                      onClick={() => setFullViewImage("/images/scams/elon.jpeg")}
                      className="w-full max-w-xl rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      aria-label="View full size"
                    >
                      <img
                        src="/images/scams/elon.jpeg"
                        alt="Impersonation and social engineering scams — example"
                        className="w-full h-auto max-h-[min(400px,50vh)] object-contain bg-zinc-800/30"
                      />
                    </button>
                  </div>
                  <div className="lg:col-span-7 order-1 lg:order-2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <UserX className="h-6 w-6 text-cyan-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Section 2</span>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl lg:text-3xl">
                      Impersonation, Social Engineering & Psychological Scams
                    </h2>
                    <p className="mt-2 text-cyan-200/90 font-medium text-lg">
                      Manipulating Trust Instead of Technology
                    </p>
                    <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed">
                      <p>
                        Many scams succeed not because of advanced technology but because attackers manipulate human psychology. These attacks are known as social engineering, a technique where scammers trick individuals into voluntarily giving away money or sensitive information.
                      </p>
                      <p>
                        Instead of hacking systems, the attacker pretends to be someone trustworthy. This could be a celebrity, a company representative, a government official, a romantic partner, or even a technical support agent. The goal is to build trust or create urgency so the victim acts without carefully verifying the situation.
                      </p>
                      <p>
                        Social media platforms have significantly amplified these scams. Scammers can create fake profiles, impersonate public figures, and distribute fraudulent messages to thousands of people simultaneously. Some scams even use deepfake videos or AI-generated voices to make impersonation appear convincing.
                      </p>
                      <p>
                        These scams often rely on emotional triggers such as excitement, fear, sympathy, or urgency. For example, a victim might believe they are speaking with a famous entrepreneur offering a giveaway, a charity asking for emergency donations, or a support agent trying to help recover lost funds.
                      </p>
                      <p>
                        Because Bitcoin transactions are irreversible, once a victim sends funds to the scammer’s address, the money cannot be recovered through traditional financial systems.
                      </p>
                      <p className="text-amber-200/90 font-medium">
                        Learning to verify identities and recognize manipulation tactics is one of the most important skills for protecting against these scams.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 sm:p-10 lg:p-12 border-t border-zinc-700/80">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Scams in this category</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {socialScams.map((card, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 hover:border-cyan-500/30 transition-colors">
                        <p className="font-medium text-zinc-100 text-sm">{card.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{card.scenario}</p>
                      </div>
                    ))}
                  </div>

                  {/* Case Study: Celebrity Romance Scam */}
                  <div className="mt-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-amber-200 sm:text-xl">
                      Case Study: Celebrity Romance Scam
                    </h3>
                    <div className="mt-6 grid gap-6 lg:grid-cols-12">
                      <div className="lg:col-span-4 flex flex-col items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setFullViewImage("/images/scams/brad.jpeg")}
                          className="w-full max-w-xs rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                          aria-label="View full size"
                        >
                          <img
                            src="/images/scams/brad.jpeg"
                            alt="Case study: celebrity romance scam — impersonation and emotional manipulation"
                            className="w-full h-auto max-h-[min(400px,50vh)] object-contain bg-zinc-800/30"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFullViewImage("/images/scams/bradpi.jpeg")}
                          className="w-full max-w-xs rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                          aria-label="View full size"
                        >
                          <img
                            src="/images/scams/bradpi.jpeg"
                            alt="Case study: celebrity romance scam — example image"
                            className="w-full h-auto max-h-[min(400px,50vh)] object-contain bg-zinc-800/30"
                          />
                        </button>
                      </div>
                      <div className="lg:col-span-8 space-y-4 text-zinc-300 leading-relaxed text-sm sm:text-base">
                        <p>
                          A French woman was scammed out of over $800,000 by criminals pretending to be the actor Brad Pitt.
                        </p>
                        <p>
                          The scam began when someone claiming to be Pitt’s mother contacted her online and later introduced her to a fake account posing as the actor. Over time, the scammer built an emotional relationship with her through frequent messages.
                        </p>
                        <p>
                          The impersonator later claimed he was seriously ill and unable to access his bank accounts, asking her for financial help. To make the story believable, the scammers sent AI-generated images of Brad Pitt in a hospital bed.
                        </p>
                        <p>
                          Believing the relationship was real, the woman transferred nearly her entire divorce settlement of about $800,000. She eventually realized the truth after learning the real actor was publicly in another relationship and reported the case to police.
                        </p>
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 mt-4">
                          <p className="text-sm font-semibold text-amber-200">Lesson</p>
                          <p className="mt-1 text-sm text-amber-100/90">
                            This scam used impersonation and emotional manipulation, showing how attackers build trust before asking victims for money.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Social Media Scam Screenshot</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/scam7.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/scam7.jpeg"
                          alt="Social media scam screenshot example"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Deepfake Example Video</p>
                      <video
                        src="/images/scams/scam2.mp4"
                        controls
                        className="w-full aspect-video rounded-xl border border-zinc-700/80 bg-black"
                        preload="metadata"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Scam Conversation Example</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/scam3.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/scam3.jpeg"
                          alt="Scam conversation example"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Section 3: Phishing & Technical ——— */}
          <AnimatedSection animation="slideUp" delay={80}>
            <section id="section-3" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="grid lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Code2 className="h-6 w-6 text-cyan-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Section 3</span>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl lg:text-3xl">
                      Phishing, Wallet & Technical Exploitation
                    </h2>
                    <p className="mt-2 text-cyan-200/90 font-medium text-lg">
                      Stealing Access Instead of Asking for Money
                    </p>
                    <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed">
                      <p>
                        Unlike investment or impersonation scams, technical attacks focus on stealing credentials and wallet access. These scams exploit weaknesses in software, communication channels, and user behavior to gain control over digital assets.
                      </p>
                      <p>
                        In the Bitcoin ecosystem, ownership of funds is controlled by private keys. Whoever controls the private keys controls the Bitcoin. Because of this, attackers frequently attempt to trick users into revealing their wallet recovery phrases, passwords, or login credentials.
                      </p>
                      <p>
                        Phishing is one of the most common techniques used in these attacks. Victims are directed to fake websites that look identical to legitimate exchanges or wallet services. When users enter their login information, the attacker captures the credentials and gains access to the account.
                      </p>
                      <p>
                        Other technical attacks involve malicious applications, browser extensions, or QR codes that redirect transactions to the attacker’s wallet address. Some attackers also manipulate mobile phone networks through SIM-swap attacks, allowing them to bypass security measures such as SMS authentication.
                      </p>
                      <p>
                        These attacks are particularly dangerous because victims may not immediately realize their wallets or accounts have been compromised. By the time the theft is discovered, the Bitcoin has often been moved through multiple addresses to obscure its trail.
                      </p>
                      <p className="text-amber-200/90 font-medium">
                        Understanding wallet security, verifying software sources, and protecting private keys are essential defenses against these types of attacks.
                      </p>
                    </div>
                  </div>
                  <div className="lg:col-span-6 p-6 sm:p-8 flex items-center justify-center bg-zinc-800/30 border-t lg:border-t-0 lg:border-l border-zinc-700/80">
                    <button
                      type="button"
                      onClick={() => setFullViewImage("/images/scams/scam15.jpeg")}
                      className="w-full max-w-xl rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      aria-label="View full size"
                    >
                      <img
                        src="/images/scams/scam15.jpeg"
                        alt="Phishing / wallet attack diagram"
                        className="w-full h-auto max-h-[min(560px,65vh)] object-contain bg-zinc-800/30"
                      />
                    </button>
                  </div>
                </div>
                <div className="p-8 sm:p-10 lg:p-12 border-t border-zinc-700/80">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Scams in this category</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {technicalScams.map((card, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 hover:border-cyan-500/30 transition-colors">
                        <p className="font-medium text-zinc-100 text-sm">{card.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{card.technicalExplanation}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Phishing Email Example</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/email.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/email.jpeg"
                          alt="Phishing email example"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Wallet Attack Diagram</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/poisen.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/poisen.jpeg"
                          alt="Wallet attack diagram — address poisoning and related attacks"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Security Demo Video</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/scam13.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/scam13.jpeg"
                          alt="Security demonstration — wallet and phishing safety"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Section 4: Malware & Extortion ——— */}
          <AnimatedSection animation="slideUp" delay={80}>
            <section id="section-4" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="grid lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-5 order-2 lg:order-1 p-6 sm:p-8 flex items-center justify-center bg-zinc-800/30 border-t lg:border-t-0 lg:border-r border-zinc-700/80">
                    <button
                      type="button"
                      onClick={() => setFullViewImage("/images/scams/ransomware.jpeg")}
                      className="w-full max-w-sm rounded-xl border border-zinc-700/80 overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      aria-label="View full size"
                    >
                      <img
                        src="/images/scams/ransomware.jpeg"
                        alt="Section 4 — Malware / Ransomware"
                        className="w-full h-auto aspect-[4/5] object-contain bg-zinc-800/30"
                      />
                    </button>
                  </div>
                  <div className="lg:col-span-7 order-1 lg:order-2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Bug className="h-6 w-6 text-cyan-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Section 4</span>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl lg:text-3xl">
                      Malware, Extortion & Criminal Coercion
                    </h2>
                    <p className="mt-2 text-cyan-200/90 font-medium text-lg">
                      Forcing Payment Through Fear or System Compromise
                    </p>
                    <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed">
                      <p>
                        Some attacks go beyond deception and involve direct digital intrusion or intimidation. These scams use malicious software or threats to pressure victims into sending Bitcoin payments.
                      </p>
                      <p>
                        Malware attacks typically involve software that secretly infects a victim’s device. Once installed, the malware may monitor activity, steal passwords, redirect Bitcoin transactions, or lock the user out of their own system. In ransomware attacks, the victim’s files are encrypted, and the attacker demands payment in Bitcoin in exchange for a decryption key.
                      </p>
                      <p>
                        Extortion-based scams rely on psychological pressure. Victims may receive threatening emails claiming their personal data, browsing history, or private images have been obtained. The attacker demands payment in Bitcoin to prevent the release of the information.
                      </p>
                      <p>
                        Bitcoin is commonly used in these situations because it allows attackers to receive payments quickly without relying on traditional banking systems. While Bitcoin transactions are recorded on a public blockchain, identifying the individuals behind the addresses can be difficult without extensive investigation.
                      </p>
                      <p className="text-amber-200/90 font-medium">
                        The best defense against these threats is maintaining strong cybersecurity practices, including updated software, secure backups, and caution when downloading files or opening suspicious links.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 sm:p-10 lg:p-12 border-t border-zinc-700/80">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Scams in this category</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {malwareScams.map((card, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 hover:border-cyan-500/30 transition-colors">
                        <p className="font-medium text-zinc-100 text-sm">{card.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{card.howAttackWorks}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Malware Attack Diagram</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/faceinvest.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/faceinvest.jpeg"
                          alt="Malware attack diagram"
                          className="w-full h-auto max-w-full max-h-[320px] sm:max-h-[400px] object-contain rounded-xl border border-zinc-700/80 bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Ransomware Screenshot</p>
                      <button
                        type="button"
                        onClick={() => setFullViewImage("/images/scams/rans.jpeg")}
                        className="w-full rounded-xl border border-zinc-700/80 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-left"
                        aria-label="View full size"
                      >
                        <img
                          src="/images/scams/rans.jpeg"
                          alt="Ransomware screenshot example"
                          className="w-full h-auto aspect-video object-contain bg-zinc-800/30"
                        />
                      </button>
                    </div>
                    <div className="rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-4 sm:p-5 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cybercrime documentary (external)</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      A documentary on how cybercrime and online scams work, including real-world cases and what to watch out for.
                    </p>
                    <a
                      href="https://www.youtube.com/watch?v=r-lGWG7vHNE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20 transition w-fit"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Pattern: three weaknesses ——— */}
          <AnimatedSection animation="fadeIn" delay={0}>
            <section id="section-pattern" className="scroll-mt-24">
              <div className="rounded-2xl border border-cyan-800/50 bg-cyan-500/5 p-8 sm:p-10 lg:p-12">
                <h2 className="text-lg font-bold text-cyan-200 sm:text-xl">A pattern across all four categories</h2>
                <p className="mt-4 text-zinc-300 leading-relaxed max-w-4xl">
                  Every scam ultimately exploits one of three weaknesses:
                </p>
                <ul className="mt-4 space-y-2 text-zinc-200 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" /> human psychology
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" /> information asymmetry
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" /> technical ignorance
                  </li>
                </ul>
                <p className="mt-6 text-zinc-400 leading-relaxed max-w-4xl italic">
                  The technology changes—today it might be deepfakes or wallet drainers—but the underlying structure of deception remains remarkably constant. Once students learn to recognize the structure, spotting new scams becomes much easier than memorizing hundreds of specific examples.
                </p>
              </div>
            </section>
          </AnimatedSection>

          {/* ——— Protect Yourself ——— */}
          <AnimatedSection animation="slideUp" delay={80}>
            <section id="section-5" className="scroll-mt-24">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 sm:p-10 lg:p-12">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-green-400">How to stay safe</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl">
                  How Students Can Protect Themselves
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <Lock className="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Never share your seed phrase with anyone.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Verify websites and wallet apps (official sources only).</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Avoid guaranteed profit promises — they are scams.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <Shield className="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Use hardware wallets for larger amounts.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Double-check addresses before sending Bitcoin.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <span className="text-zinc-200 text-sm">Be cautious of social media offers and DMs.</span>
                  </li>
                </ul>
                <div className="mt-10 grid gap-6 sm:grid-cols-3">
                  <Placeholder label="Checklist Graphic" className="aspect-video" />
                  <Placeholder label="Security Tips Infographic" className="aspect-video" />
                  <Placeholder label="Final Educational Video" className="aspect-video" />
                </div>
              </div>
            </section>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
}
