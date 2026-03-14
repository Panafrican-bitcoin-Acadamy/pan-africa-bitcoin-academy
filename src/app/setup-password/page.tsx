'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

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
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm">
          Checking...
        </div>
      </div>
    );
  }

  if (linkExpired) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg overflow-hidden rounded-xl bg-white shadow-md">
          <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-5 text-center">
            <h1 className="text-xl font-bold text-white">Link expired</h1>
          </div>
          <div className="bg-gray-50 px-6 py-8">
            <p className="text-center text-gray-700">
              This link has expired. Please ask your admin to send a new password setup link.
            </p>
            <p className="mt-4 text-center">
              <a href="/" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Back to sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyHasPassword) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg overflow-hidden rounded-xl bg-white shadow-md">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5 text-center">
            <h1 className="text-xl font-bold text-white">Password Already Set</h1>
            <p className="text-sm text-green-100 mt-1">ፓስዎርድኻ ተቀይሩ ኢዩ</p>
          </div>
          <div className="bg-gray-50 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">You have already set your password</h2>
              <p className="text-sm text-gray-700 mt-1">ፓስዎርድኻ ቀይርካዮ ኢኻ</p>
              <p className="mt-3 text-gray-600">Your account is ready. Please sign in to access your dashboard.</p>
              <p className="text-sm text-gray-500 mt-1">ኣካውንትኻ ድልው ኢዩ ፣ ዳሽቦርድኻ ንምኽፋት ኢመይልካን ፓስዎርድኻን የእቱ።</p>
              <a
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 font-semibold text-white shadow-sm transition hover:opacity-95"
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
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg overflow-hidden rounded-xl bg-white shadow-md">
          <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-5 text-center">
            <h1 className="text-xl font-bold text-white">Welcome to Pan-Africa Bitcoin Academy</h1>
          </div>
          <div className="bg-gray-50 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Password set successfully!</h2>
              <p className="mt-1 text-gray-600">You can now sign in to your account.</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg overflow-hidden rounded-xl bg-white shadow-md">
        {/* Gradient header - matches approval email */}
        <div className="bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-6 text-center">
          <h1 className="text-xl font-bold text-white">Welcome to Pan-Africa Bitcoin Academy</h1>
        </div>

        <div className="bg-gray-50 px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-gray-900 font-medium">
            Hi {studentName ? `${studentName},` : 'there,'}
          </p>
          <p className="mt-2 text-gray-700">
            Great news! Your application to the Pan-Africa Bitcoin Academy has been approved! 🎉
          </p>

          {/* What's Next - teal left border */}
          <div className="mt-6 rounded-lg bg-gray-100 py-4 pl-5 pr-4 border-l-4 border-cyan-500">
            <h2 className="font-semibold text-gray-900">What&apos;s Next?</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700 text-sm">
              <li>Start earning sats as you progress</li>
              <li>Complete assignments and chapters</li>
              <li>Join live sessions and community discussions</li>
              <li>Build your Bitcoin knowledge step by step</li>
            </ul>
          </div>

          {/* Cohort - orange left border */}
          {cohortName && (
            <div className="mt-4 rounded-lg bg-gray-100 py-3 pl-5 pr-4 border-l-4 border-orange-500">
              <p className="text-gray-900 text-sm"><strong>Cohort:</strong> {cohortName}</p>
            </div>
          )}

          {/* Set up your password - form */}
          <div className="mt-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Set up your password</h2>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">At least 8 characters with uppercase, lowercase, number, and special character</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Setting password…' : 'Set up your password'}
              </button>
            </form>
          </div>

          <p className="mt-6 border-t border-gray-200 pt-5 text-sm text-gray-500">
            We&apos;re excited to have you join us on this Bitcoin journey!
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Already have a password?{' '}
            <a href="/" className="text-cyan-600 hover:text-cyan-700 font-medium">
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
        <div className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm">
            Loading password setup...
          </div>
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  );
}




