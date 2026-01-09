'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const emailParam = searchParams.get('email');

      if (!token || !emailParam) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      setEmail(emailParam);

      try {
        const res = await fetch(`/api/profile/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.alreadyVerified) {
            setStatus('success');
            setMessage('Your email is already verified! You can now log in to your account.');
          } else {
            setStatus('success');
            setMessage('Email verified successfully! You can now log in to your account.');
          }
        } else {
          if (data.error?.includes('expired')) {
            setStatus('expired');
            setMessage(data.error || 'Verification token has expired.');
          } else {
            setStatus('error');
            setMessage(data.error || 'Failed to verify email. Please try again.');
          }
        }
      } catch (error: any) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    try {
      const res = await fetch('/api/profile/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setStatus('loading');
        // Reset to show success message
        setTimeout(() => {
          setStatus('success');
          setMessage('Verification email sent! Please check your inbox and click the verification link.');
        }, 100);
      } else {
        setMessage(data.error || 'Failed to resend verification email. Please try again.');
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      setMessage('An error occurred while resending the verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <div className="relative z-10 w-full">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-3xl sm:mx-auto lg:px-8 lg:py-20">
          <AnimatedSection animation="slideUp">
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 sm:p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              <div className="text-center mb-8">
                {status === 'loading' && (
                  <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mx-auto mb-4" />
                )}
                {status === 'success' && (
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                )}
                {(status === 'error' || status === 'expired') && (
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                )}
                {status === 'loading' && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">
                    Verifying Your Email
                  </h1>
                )}
                {status === 'success' && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
                    Email Verified!
                  </h1>
                )}
                {(status === 'error' || status === 'expired') && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">
                    Verification Failed
                  </h1>
                )}
              </div>

              <div className="space-y-6">
                <div className={`rounded-lg border p-4 ${
                  status === 'success' 
                    ? 'border-green-500/30 bg-green-500/10' 
                    : status === 'error' || status === 'expired'
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-cyan-500/30 bg-cyan-500/10'
                }`}>
                  <p className={`text-sm sm:text-base ${
                    status === 'success' 
                      ? 'text-green-200' 
                      : status === 'error' || status === 'expired'
                      ? 'text-red-200'
                      : 'text-cyan-200'
                  }`}>
                    {message || 'Please wait while we verify your email...'}
                  </p>
                </div>

                {status === 'success' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => router.push('/')}
                        className="text-sm text-zinc-400 hover:text-cyan-400 transition"
                      >
                        Return to Home
                      </button>
                    </div>
                  </div>
                )}

                {(status === 'error' || status === 'expired') && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                      <p className="text-sm text-orange-200">
                        <strong>Need help?</strong> If you didn't receive the verification email, check your spam folder or request a new verification email.
                      </p>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={handleResend}
                        disabled={resending || !email}
                        className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Verification Email
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => router.push('/')}
                        className="text-sm text-zinc-400 hover:text-cyan-400 transition"
                      >
                        Return to Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
        <div className="relative z-10 w-full">
          <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-3xl sm:mx-auto lg:px-8 lg:py-20">
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 sm:p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              <div className="text-center">
                <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mx-auto mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-2">
                  Loading...
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

