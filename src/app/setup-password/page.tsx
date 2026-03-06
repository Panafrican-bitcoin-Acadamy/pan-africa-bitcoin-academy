'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/PageContainer';

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const applicationId = searchParams.get('applicationId');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  // If they've already set a password (via forgot or setup), don't show the form at all
  useEffect(() => {
    if (!email) {
      setChecking(false);
      setError('Email is required. Please use the link from your approval email.');
      return;
    }

    let cancelled = false;
    fetch(`/api/applications/setup-password?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setChecking(false);
        if (!data.needsSetup) {
          // Already have a password - redirect to sign in, never show the form
          router.replace('/?message=already-have-password');
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [email, router]);

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
      <PageContainer title="Set Up Your Password" subtitle="Loading...">
        <div className="mx-auto max-w-md space-y-4 rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center text-zinc-200">
          Checking...
        </div>
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer title="Password Set Successfully" subtitle="You can now sign in to your account">
        <div className="mx-auto max-w-md space-y-6 rounded-xl border border-green-500/25 bg-black/80 p-6">
          <div className="text-center">
            <div className="mb-4 inline-block rounded-full bg-green-500/20 p-3">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-green-200">Password Set Successfully!</h2>
            <p className="text-zinc-300">You can now sign in to your account.</p>
            <p className="mt-4 text-sm text-zinc-400">Redirecting to dashboard...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Set Up Your Password"
      subtitle="Complete your registration by setting a secure password"
    >
      <div className="mx-auto max-w-md space-y-6 rounded-xl border border-cyan-400/25 bg-black/80 p-6">
        {email ? (
          <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-200">
            Setting up password for: <span className="font-semibold">{email}</span>
          </div>
        ) : null}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
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
                className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 pr-10 text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
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
                className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 pr-10 text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-zinc-400">
            <p className="font-semibold text-orange-300">Password Requirements:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting || !email}
            className={`w-full rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-4 py-2 font-semibold text-black transition ${
              submitting || !email
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:brightness-110'
            }`}
          >
            {submitting ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-zinc-400">
            Already have a password?{' '}
            <a href="/" className="text-cyan-400 hover:text-cyan-300">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="Set Up Your Password" subtitle="Loading...">
          <div className="mx-auto max-w-md space-y-4 rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center text-zinc-200">
            Loading password setup...
          </div>
        </PageContainer>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  );
}




