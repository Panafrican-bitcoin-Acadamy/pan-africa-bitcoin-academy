'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSignUp?: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onSignUp }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount check for client-side rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update email when initialEmail changes
  useEffect(() => {
    if (isOpen && initialEmail) {
      setEmail(initialEmail);
    } else if (!isOpen) {
      // Reset form when modal closes
      setEmail('');
      setError(null);
      setSuccess(false);
      setEmailNotFound(false);
    }
  }, [isOpen, initialEmail]);

  // Prevent body scroll when modal is open
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
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/profile/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      // Check if email was found
      if (data.success && data.emailFound) {
        // Email found - password reset email sent
        console.log('✅ Password reset request successful');
        if (process.env.NODE_ENV === 'development' && data.resetLink) {
          console.log('📧 Reset link (DEV ONLY):', data.resetLink);
        }
        setSuccess(true);
        setEmailNotFound(false);
        setEmail('');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 3000);
      } else if (data.success === false && data.emailFound === false) {
        // Email not found - show sign up prompt
        console.log('⚠️ Email not found in database');
        setEmailNotFound(true);
        setSuccess(false);
        setError(null);
      } else {
        // Error case
        console.error('❌ Password reset request failed:', data.error || 'Unknown error');
        setError(data.error || 'An error occurred. Please try again.');
        setEmailNotFound(false);
      }
    } catch (err: any) {
      console.error('❌ Error in forgot password request:', err);
      setError('An error occurred. Please try again.');
      setSuccess(false);
      setEmailNotFound(false);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-zinc-50">Reset Password</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-400" />
            <p className="mb-2 text-sm font-medium text-green-200">
              Password reset email sent!
            </p>
            <p className="text-xs text-green-300/80">
              Please check your inbox and click the link to reset your password.
            </p>
          </div>
        ) : emailNotFound ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <AlertCircle className="mx-auto mb-2 h-12 w-12 text-orange-400" />
              <p className="mb-2 text-sm font-medium text-orange-200">
                Account not found
              </p>
              <p className="text-xs text-orange-300/80">
                No account exists with this email address.
              </p>
            </div>
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4">
              <p className="mb-3 text-sm text-cyan-200">
                Would you like to create an account?
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onSignUp) {
                    onClose();
                    onSignUp();
                  }
                }}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Sign Up
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <p className="text-sm text-zinc-400">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="your@email.com"
                disabled={loading}
              />
              {error && (
                <p className="mt-1 text-sm text-red-400">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-300 transition hover:bg-zinc-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}



