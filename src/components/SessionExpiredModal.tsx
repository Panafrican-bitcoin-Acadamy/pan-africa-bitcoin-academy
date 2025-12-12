'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'student' | 'admin';
}

export function SessionExpiredModal({ isOpen, onClose, userType = 'student' }: SessionExpiredModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRedirect = () => {
    if (userType === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-orange-500/30 bg-zinc-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
            <AlertCircle className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">Session Expired</h2>
            <p className="text-sm text-zinc-400">
              {userType === 'admin' ? 'Admin' : 'Your'} session has expired due to inactivity
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-zinc-300">
          <p>
            {userType === 'admin'
              ? 'Your admin session has expired. Please log in again to continue.'
              : 'Your session has expired due to inactivity. Please sign in again to continue.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRedirect}
            className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            {userType === 'admin' ? 'Go to Login' : 'Go to Sign In'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

