'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { validatePassword, getPasswordRequirements } from '@/lib/passwordValidation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(mode === 'signin');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    needsVerification: false,
    userEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [emailForForgotPassword, setEmailForForgotPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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

  // Countdown timer for resend verification
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Don't return null if forgot password modal is open, even if auth modal is closed
  if ((!isOpen && !forgotPasswordOpen) || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    setServerError(null);

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation for signup
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isSignIn) {
      // Strong password validation for signup only
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0] || 'Password does not meet requirements';
      }
    }

    if (isSignIn) {
      // Sign in logic
      if (Object.keys(newErrors).length === 0) {
        try {
          setLoading(true);
          const res = await fetch('/api/profile/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email,
              password: formData.password 
            }),
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            // Check if user needs to set up password
            if (data.needsPasswordSetup && data.setupPasswordUrl) {
              onClose();
              window.location.href = data.setupPasswordUrl;
              return;
            }
            // Check if user needs to verify email
            if (data.needsEmailVerification) {
              // Use the message from API which already indicates if email was sent
              const verificationMsg = data.message || 'Please verify your email address before logging in.';
              setServerError(verificationMsg);
              // Store email for resend action
              setFormData(prev => ({ 
                ...prev, 
                needsVerification: true, 
                userEmail: formData.email 
              }));
              return;
            }
            // Handle specific error messages from API
            const errorMsg = data.error || `Sign in failed (${res.status})`;
            setServerError(errorMsg);
            return;
          }
          
          if (data.found && data.success) {
            try {
              localStorage.setItem('profileEmail', formData.email);
              // Trigger storage event to update auth state in other components
              window.dispatchEvent(new Event('storage'));
            } catch {
              // ignore
            }
            onClose();
            // Redirect to dashboard after successful sign-in
            window.location.href = '/dashboard';
          } else {
            setServerError(data.error || 'Invalid credentials. Please try again.');
          }
        } catch (err: any) {
          console.error('Login error:', err);
          setServerError(err.message || 'Sign in failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Sign up logic
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }

      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(newErrors).length === 0) {
        try {
          setLoading(true);
          const res = await fetch('/api/profile/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              password: formData.password,
            }),
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            const errorMsg = data.details || data.error || `Sign up failed (${res.status})`;
            throw new Error(errorMsg);
          }
          
          // Success - profile was created
          if (data.success) {
            try {
              localStorage.setItem('profileEmail', formData.email);
              // Trigger storage event to update auth state in other components
              window.dispatchEvent(new Event('storage'));
            } catch {
              // ignore
            }
            onClose();
            // Show success message about email verification
            alert('Account created successfully! Please check your email to verify your address before logging in.');
            // Reload page to update navbar with new auth state
            window.location.reload();
          } else {
            throw new Error(data.error || 'Sign up failed');
          }
        } catch (err: any) {
          console.error('Registration error:', err);
          setServerError(err.message || 'Sign up failed. Please try again.');
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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      needsVerification: false,
      userEmail: '',
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {!isSignIn && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                placeholder={isSignIn ? "••••••••" : "Enter strong password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {!isSignIn && (
              <p className="mt-1 text-xs text-zinc-500">
                {getPasswordRequirements()}
              </p>
            )}
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
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
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
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Store email before closing modal
                  const currentEmail = formData.email;
                  console.log('🔓 Forgot password clicked, email:', currentEmail);
                  setEmailForForgotPassword(currentEmail);
                  // Open forgot password modal FIRST, then close auth modal
                  setForgotPasswordOpen(true);
                  // Small delay to ensure forgot password modal opens, then close auth modal
                  setTimeout(() => {
                    onClose();
                    console.log('🔓 AuthModal closed, ForgotPasswordModal should be visible');
                  }, 100);
                }}
                className="text-sm text-orange-400 hover:text-orange-300 transition cursor-pointer underline"
              >
                Forgot password?
              </button>
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
          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {serverError}
            </div>
            {formData.needsVerification && formData.userEmail && (
              <button
                type="button"
                onClick={async () => {
                  setResendingVerification(true);
                  try {
                    const res = await fetch('/api/profile/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: formData.userEmail }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      setServerError('Verification email sent! Please check your inbox and click the verification link.');
                      setFormData(prev => ({ ...prev, needsVerification: false }));
                      // Start 60 second countdown
                      setResendCountdown(60);
                    } else {
                      setServerError(data.error || 'Failed to send verification email. Please try again.');
                    }
                  } catch (error: any) {
                    setServerError('Failed to send verification email. Please try again.');
                  } finally {
                    setResendingVerification(false);
                  }
                }}
                disabled={resendingVerification || resendCountdown > 0}
                className="w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingVerification 
                  ? 'Sending...' 
                  : resendCountdown > 0 
                    ? `Resend Verification Email (${resendCountdown}s)`
                    : 'Resend Verification Email'}
              </button>
            )}
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

  return (
    <>
      {/* Only render auth modal content if isOpen is true */}
      {isOpen && createPortal(modalContent, document.body)}
      {/* ForgotPasswordModal is rendered independently and can be open even when AuthModal is closed */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false);
          setEmailForForgotPassword('');
        }}
        initialEmail={emailForForgotPassword}
      />
    </>
  );
}


