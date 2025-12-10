'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, profile, loading, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    if (accountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountDropdownOpen]);
  
  return (
    <header className="border-b border-cyan-400/20 bg-black/70 text-zinc-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
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
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Pan-African
            </span>
            <span className="text-sm font-medium text-zinc-100">Bitcoin Academy</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 xl:flex">
          <Link
            href="/chapters"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Chapters
          </Link>
          <Link
            href="/blog"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Blog
          </Link>
          <Link
            href="/developer-hub"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Developer Hub
          </Link>
          <Link
            href="/apply"
            className="rounded-full px-3 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
          >
            Apply
          </Link>
          <Link
            href="/mentorship"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Mentorship
          </Link>
          <Link
            href="/impact"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Impact
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            About
          </Link>
          <Link
            href="/donate"
            className="rounded-full bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
          >
            Donate
          </Link>
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-800" />
          ) : isAuthenticated && profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
              >
                <span className="max-w-[120px] truncate">{profile.name || 'Account'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {accountDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-cyan-400/20 bg-zinc-900/95 backdrop-blur-xl shadow-xl">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700 mb-1">
                      {profile.email}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className="rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Tablet Navigation (shows fewer items) */}
        <nav className="hidden items-center gap-1 lg:flex xl:hidden">
          <Link
            href="/chapters"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Chapters
          </Link>
          <Link
            href="/developer-hub"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Dev Hub
          </Link>
          <Link
            href="/apply"
            className="rounded-full px-3 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
          >
            Apply
          </Link>
          <Link
            href="/impact"
            className="rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            Impact
          </Link>
          <Link
            href="/donate"
            className="rounded-full bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
          >
            Donate
          </Link>
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-800" />
          ) : isAuthenticated && profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
              >
                <span className="max-w-[100px] truncate">{profile.name || 'Account'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {accountDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-cyan-400/20 bg-zinc-900/95 backdrop-blur-xl shadow-xl">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700 mb-1">
                      {profile.email}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className="rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-300 transition hover:bg-cyan-400/10 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-cyan-400/20 bg-black/95 lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Home
            </Link>
            <Link
              href="/chapters"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Chapters
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Blog
            </Link>
            <Link
              href="/developer-hub"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Developer Hub
            </Link>
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
            >
              Apply
            </Link>
            <Link
              href="/mentorship"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Mentorship
            </Link>
            <Link
              href="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              Impact
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              About
            </Link>
            <Link
              href="/donate"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg bg-gradient-to-r from-orange-400/20 to-cyan-400/20 px-4 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-400/30 hover:to-cyan-400/30"
            >
              Donate
            </Link>
            {loading ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800" />
            ) : isAuthenticated && profile ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm text-zinc-400 border-b border-zinc-700">
                  {profile.name}
                  <div className="text-xs text-zinc-500 mt-1">{profile.email}</div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-4 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-4 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30 text-left"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </header>
  );
}


