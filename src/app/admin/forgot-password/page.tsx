'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'If an account with that email exists, a password reset link has been sent.',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send password reset email',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 sm:p-8">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Reset Password</h1>
          <p className="text-sm text-zinc-400">Enter your email to receive a password reset link.</p>
        </div>

        {message && (
          <div
            className={`rounded border p-3 text-sm ${
              message.type === 'success'
                ? 'border-green-500/40 bg-green-500/10 text-green-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              placeholder="admin@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

