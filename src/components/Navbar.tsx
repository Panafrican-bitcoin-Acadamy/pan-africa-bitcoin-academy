'use client';

import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  return (
    <header className="border-b border-cyan-400/20 bg-black/70 text-zinc-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-12 w-12 items-center justify-center">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-orange-400/10 blur-2xl" />
            
            {/* Geometric border */}
            <div className="absolute inset-0 rounded-xl border-2 border-orange-400/50 rotate-45" />
            <div className="absolute inset-[2px] rounded-xl border border-orange-300/30 -rotate-45" />
            
            {/* Main logo container */}
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.8)] transition group-hover:shadow-[0_0_40px_rgba(249,115,22,1)]">
              <span className="text-2xl font-black text-black tracking-tight">B</span>
            </div>
            
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-orange-400/60 blur-sm" />
            <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-orange-400/60 blur-sm" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Pan-African
            </span>
            <span className="text-sm font-medium text-zinc-100">Bitcoin Academy</span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-300 sm:gap-4 sm:text-xs">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Home
          </Link>
          <Link
            href="/chapters"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Chapters
          </Link>
          <Link
            href="/blog"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Blog
          </Link>
          <Link
            href="/apply"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Apply
          </Link>
          <Link
            href="/mentorship"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Mentorship
          </Link>
          <Link
            href="/impact"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Impact
          </Link>
          <Link
            href="/donate"
            className="rounded-full bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-3 py-1.5 text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
          >
            Donate
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            About
          </Link>
          <button
            onClick={() => {
              setAuthMode('signin');
              setAuthModalOpen(true);
            }}
            className="rounded-full bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-3 py-1.5 text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
          >
            Sign In
          </button>
        </nav>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </header>
  );
}


