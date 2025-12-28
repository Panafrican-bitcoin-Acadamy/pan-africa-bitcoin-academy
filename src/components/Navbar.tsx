'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, lazy, Suspense, useTransition } from "react";
import { Menu, X, User, LogOut, LayoutDashboard, Key, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { SearchBar } from "./SearchBar";

// Lazy load modals - only load when needed (using React.lazy for better code splitting)
const AuthModal = lazy(() => import("./AuthModal").then(mod => ({ default: mod.AuthModal })));
const ChangePasswordModal = lazy(() => import("./ChangePasswordModal").then(mod => ({ default: mod.ChangePasswordModal })));
const ProfileModal = lazy(() => import("./ProfileModal").then(mod => ({ default: mod.ProfileModal })));
const SessionExpiredModal = lazy(() => import("./SessionExpiredModal").then(mod => ({ default: mod.SessionExpiredModal })));

export function Navbar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const tabletDropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, profile, isRegistered, loading, logout, showSessionExpired, setShowSessionExpired } = useAuth();
  const handleLogout = async () => {
    await logout();
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  // Fetch profile data when modal opens
  useEffect(() => {
    if (profileModalOpen && profile?.email) {
      const fetchProfileData = async () => {
        setProfileLoading(true);
        setProfileError(null);
        try {
          const res = await fetch('/api/profile/me');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setProfileData(data.profile);
              setProfileImage(data.profile.photoUrl || null);
            } else {
              setProfileError('Profile not found');
            }
          } else {
            setProfileError('Failed to load profile');
          }
        } catch (err: any) {
          setProfileError(err.message || 'Failed to load profile');
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [profileModalOpen, profile?.email]);

  // Close dropdown when clicking outside (but keep it open when interacting inside)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInDesktop = desktopDropdownRef.current?.contains(target);
      const isInTablet = tabletDropdownRef.current?.contains(target);
      if (isInDesktop || isInTablet) {
        return; // clicks inside dropdown should not close it
      }
        setAccountDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/20 bg-black/70 text-zinc-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
          aria-label="Pan-African Bitcoin Academy - Home"
          title="Pan-African Bitcoin Academy - First Eritrea Based Bitcoin Academy"
        >
          <div className="relative flex h-16 w-16 items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {/* Logo image with SEO optimization - bold and visible */}
            <Image
              src="/images/logo_3.png"
              alt="Pan-African Bitcoin Academy - First Eritrea Based Bitcoin Academy Logo. Learn Bitcoin education in Eritrea, Uganda, and across Africa."
              width={64}
              height={64}
              priority
              loading="eager"
              className="object-contain brightness-110 contrast-125 saturate-120"
              quality={95}
              sizes="(max-width: 768px) 48px, 64px"
              fetchPriority="high"
            />
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
          {!isRegistered && (
          <Link
            href="/apply"
            className="rounded-full px-3 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
          >
            Apply
          </Link>
          )}
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
            <div className="relative" ref={desktopDropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
              >
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="h-7 w-7 rounded-full object-cover border-2 border-orange-400/50"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 text-xs font-bold text-black">
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{profile.name || 'User'}</span>
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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountDropdownOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <Key className="h-4 w-4" />
                      Change Password
                    </button>
                    <div className="my-1 border-t border-zinc-700" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
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
          <SearchBar />
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
          {!isRegistered && (
          <Link
            href="/apply"
            className="rounded-full px-3 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
          >
            Apply
          </Link>
          )}
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
            <div className="relative" ref={tabletDropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 px-3 py-2 text-sm font-medium text-orange-300 transition hover:from-orange-500/30 hover:to-cyan-500/30"
              >
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="h-7 w-7 rounded-full object-cover border-2 border-orange-400/50"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 text-xs font-bold text-black">
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="max-w-[80px] truncate">{profile.name || 'User'}</span>
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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Close dropdown first, then open modal after a tiny delay to ensure dropdown closes
                        setAccountDropdownOpen(false);
                        setTimeout(() => {
                          setProfileModalOpen(true);
                        }, 50);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Close dropdown first, then open modal after a tiny delay to ensure dropdown closes
                        setAccountDropdownOpen(false);
                        setTimeout(() => {
                          setChangePasswordOpen(true);
                        }, 50);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      <Key className="h-4 w-4" />
                      Change Password
                    </button>
                    <div className="my-1 border-t border-zinc-700" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountDropdownOpen(false);
                        // Call logout immediately - don't wait for state update
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
            <div className="mb-4 flex items-center gap-2">
              <SearchBar />
            </div>
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
            {!isRegistered && (
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/10"
            >
              Apply
            </Link>
            )}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMobileMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMobileMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
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

      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            mode={authMode}
          />
        </Suspense>
      )}
      {/* Always render modals if user is authenticated - they handle their own visibility */}
      {isAuthenticated && profile?.email && (
        <>
          {changePasswordOpen && (
            <Suspense fallback={null}>
              <ChangePasswordModal
                isOpen={changePasswordOpen}
                onClose={() => {
                  // Immediate state update for modal visibility
                  setChangePasswordOpen(false);
                }}
                userEmail={profile.email}
              />
            </Suspense>
          )}
          {profileModalOpen && (
            <Suspense fallback={null}>
              <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => {
                  // Immediate update for modal visibility (critical)
                  setProfileModalOpen(false);
                  // Defer non-critical cleanup using startTransition
                  startTransition(() => {
                    setProfileData(null);
                    setProfileError(null);
                    setProfileImage(null);
                  });
                }}
                userEmail={profile.email}
                profileData={profileData}
                profileLoading={profileLoading}
                profileError={profileError}
                profileImage={profileImage}
                onProfileUpdate={async () => {
                  // Refresh auth state after profile update
                  if (profile?.email) {
                    try {
                      const res = await fetch('/api/profile/verify-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: profile.email }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.valid && data.profile) {
                          // Trigger a storage event to update useAuth hook
                          localStorage.setItem('profileEmail', profile.email);
                          window.dispatchEvent(new Event('storage'));
                          // Reload to ensure all components update
                          window.location.reload();
                        }
                      }
                    } catch (err) {
                      console.error('Error refreshing profile:', err);
                      window.location.reload();
                    }
                  } else {
                    window.location.reload();
                  }
                }}
              />
            </Suspense>
          )}
        </>
      )}

      {/* Session Expired Modal */}
      {showSessionExpired && (
        <Suspense fallback={null}>
          <SessionExpiredModal
            isOpen={showSessionExpired}
            onClose={() => {
              // Logout student and redirect to home
              handleLogout();
            }}
            userType="student"
          />
        </Suspense>
      )}
    </header>
  );
}


