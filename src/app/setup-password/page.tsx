'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, Circle } from 'lucide-react';
import { getPasswordRequirementStatuses, validatePassword, PASSWORD_REQUIREMENTS_HEADING, PASSWORD_REQUIREMENTS_HEADING_TIGRINYA } from '@/lib/passwordValidation';

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const applicationId = searchParams.get('applicationId');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [cohortName, setCohortName] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [alreadyHasPassword, setAlreadyHasPassword] = useState(false);

  // Check if link is valid and if user still needs to set password (token required for 72h link)
  useEffect(() => {
    if (!email) {
      setChecking(false);
      setError('Email is required. Please use the link from your approval email.');
      return;
    }

    let cancelled = false;
    const url = new URL('/api/applications/setup-password', window.location.origin);
    url.searchParams.set('email', email);
    if (token) url.searchParams.set('token', token);
    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setChecking(false);
        if (data.linkExpired) {
          setLinkExpired(true);
          return;
        }
        if (!data.needsSetup) {
          setAlreadyHasPassword(true);
          return;
        }
        if (data.studentName) setStudentName(data.studentName);
        if (data.cohortName) setCohortName(data.cohortName);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [email, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0] || 'Password does not meet requirements');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/applications/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          token: token || null,
          applicationId: applicationId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to set password. Please try again.');
      }
    } catch (error: any) {
      console.error('Error setting password:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900 p-10 text-center shadow-[0_0_60px_rgba(34,211,238,0.15)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-400" />
          <p className="text-zinc-400">Checking...</p>
        </div>
      </div>
    );
  }

  if (linkExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/50 shadow-[0_0_60px_rgba(249,115,22,0.15)]">
          <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-6 text-center">
            <h1 className="text-xl font-bold text-white">Link Expired</h1>
          </div>
          <div className="bg-zinc-900 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <svg className="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">This link has expired</h2>
              <p className="mt-3 text-zinc-400">Please ask your admin to send a new password setup link.</p>
              <a
                href="/"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 px-10 py-3 font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition hover:brightness-110 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyHasPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/50 shadow-[0_0_60px_rgba(34,211,238,0.15),0_0_30px_rgba(249,115,22,0.1)]">
          <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-6 text-center">
            <h1 className="text-xl font-bold text-white">Password Already Set</h1>
            <p className="text-sm text-white/80 mt-1">ፓስዎርድኻ ተቀይሩ ኢዩ</p>
          </div>
          <div className="bg-zinc-900 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">You have already set your password</h2>
              <p className="text-sm text-cyan-300/80 mt-1">ፓስዎርድኻ ቀይርካዮ ኢኻ</p>
              <p className="mt-4 text-zinc-400">Your account is ready. Please sign in to access your dashboard.</p>
              <p className="text-sm text-zinc-500 mt-1">ኣካውንትኻ ድልው ኢዩ ፣ ዳሽቦርድኻ ንምኽፋት ኢመይልካን ፓስዎርድኻን የእቱ።</p>
              <a
                href="/"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 px-10 py-3 font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition hover:brightness-110 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
              >
                OK
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/50 shadow-[0_0_60px_rgba(34,211,238,0.15),0_0_30px_rgba(249,115,22,0.1)]">
          <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-6 text-center">
            <h1 className="text-xl font-bold text-white">Welcome to Pan-African ₿itcoin Academy</h1>
          </div>
          <div className="bg-zinc-900 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">Password set successfully!</h2>
              <p className="mt-3 text-zinc-400">You can now sign in to your account.</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-cyan-300/80">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
                Redirecting to dashboard...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/90 flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700/50 shadow-[0_0_60px_rgba(34,211,238,0.1),0_0_30px_rgba(249,115,22,0.08)]">
        <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-7 text-center">
          <h1 className="text-xl font-bold text-white">Welcome to Pan-African ₿itcoin Academy</h1>
        </div>

        <div className="bg-zinc-900 px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-zinc-100 font-medium">
            Hi {studentName ? `${studentName},` : 'there,'}
          </p>
          <p className="mt-2 text-zinc-400">
            Great news! Your application has been approved! 🎉
          </p>

          <div className="mt-6 rounded-xl bg-zinc-800/60 py-4 pl-5 pr-4 border-l-4 border-cyan-500">
            <h2 className="font-semibold text-zinc-100">What&apos;s Next?</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400 text-sm">
              <li>Start earning sats as you progress</li>
              <li>Complete assignments and chapters</li>
              <li>Join live sessions and community discussions</li>
              <li>Build your Bitcoin knowledge step by step</li>
            </ul>
          </div>

          {cohortName && (
            <div className="mt-4 rounded-xl bg-zinc-800/60 py-3 pl-5 pr-4 border-l-4 border-orange-500">
              <p className="text-zinc-200 text-sm"><strong className="text-orange-400">Cohort:</strong> {cohortName}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-base font-semibold text-zinc-100 mb-3">Set up your password</h2>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2">
                  <p className="mb-1.5 text-xs font-medium text-zinc-400">
                    {PASSWORD_REQUIREMENTS_HEADING} / {PASSWORD_REQUIREMENTS_HEADING_TIGRINYA}
                  </p>
                  <div className="space-y-1.5">
                    {getPasswordRequirementStatuses(password).map((req) => (
                      <div
                        key={req.id}
                        className={req.met ? 'text-green-400' : 'text-zinc-500'}
                        style={{ transition: 'color 0.2s ease' }}
                      >
                        <span className="inline-flex items-start gap-2 text-xs">
                          {req.met ? (
                            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-400" aria-hidden />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-500" aria-hidden />
                          )}
                          <span className={req.met ? 'text-green-400/90' : 'text-zinc-500'}>
                            {req.label} / {req.labelTigrinya}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] transition hover:brightness-110 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Setting password…' : 'Set up your password'}
              </button>
            </form>
          </div>

          <p className="mt-6 border-t border-zinc-800 pt-5 text-sm text-zinc-500">
            We&apos;re excited to have you join us on this Bitcoin journey!
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Already have a password?{' '}
            <a href="/" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black/90 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700/50 bg-zinc-900 p-10 text-center shadow-[0_0_60px_rgba(34,211,238,0.15)]">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-400" />
            <p className="text-zinc-400">Loading password setup...</p>
          </div>
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  );
}




