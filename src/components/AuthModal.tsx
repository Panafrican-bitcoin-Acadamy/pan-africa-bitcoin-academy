'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(mode === 'signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    setServerError(null);

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // We do not verify password against Notion (not stored there)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (isSignIn) {
      // Sign in logic
      if (Object.keys(newErrors).length === 0) {
        try {
          setLoading(true);
          const res = await fetch('/api/notion/profile/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email }),
          });
          if (!res.ok) throw new Error(`Login failed (${res.status})`);
          const data = await res.json();
          if (data.found) {
            try {
              localStorage.setItem('profileEmail', formData.email);
            } catch {
              // ignore
            }
            onClose();
            // navigate to dashboard
            window.location.href = '/dashboard';
          } else {
            setServerError('Invalid credentials. User not found.');
          }
        } catch (err: any) {
          setServerError(err.message || 'Sign in failed.');
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Sign up logic
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(newErrors).length === 0) {
        try {
          setLoading(true);
          const [firstName = '', lastName = ''] = formData.name.split(' ');
          const res = await fetch('/api/notion/profile/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: firstName || formData.name,
              lastName: lastName || '',
              email: formData.email,
            }),
          });
          if (!res.ok) throw new Error(`Sign up failed (${res.status})`);
          await res.json();
          try {
            localStorage.setItem('profileEmail', formData.email);
          } catch {
            // ignore
          }
          onClose();
        } catch (err: any) {
          setServerError(err.message || 'Sign up failed.');
        } finally {
          setLoading(false);
        }
      }
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const switchMode = () => {
    setIsSignIn(!isSignIn);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999,
        minHeight: '100vh'
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          margin: 'auto',
          zIndex: 100000
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl" />
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600">
                <span className="text-2xl font-black text-black">B</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            {isSignIn ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isSignIn
              ? 'Sign in to continue your Bitcoin journey'
              : 'Join the Pan-Africa Bitcoin Academy'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {!isSignIn && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {isSignIn && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 rounded border-zinc-700 bg-zinc-900/50 text-orange-400 focus:ring-orange-400/20"
                />
                <span className="text-sm text-zinc-400">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 font-semibold text-white transition hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Working...' : isSignIn ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {serverError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {serverError}
          </div>
        )}

        {/* Switch mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400">
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              className="font-semibold text-orange-400 hover:text-orange-300"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


