'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DoneChapterButtonProps {
  chapterNumber: number;
  chapterSlug: string;
}

export function DoneChapterButton({ chapterNumber, chapterSlug }: DoneChapterButtonProps) {
  const router = useRouter();
  const { isAuthenticated, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleDone = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isAuthenticated && profile?.email) {
        await fetch('/api/chapters/mark-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            chapterNumber,
            chapterSlug,
          }),
        });
      }
    } catch (error) {
      console.error('Error marking chapter done:', error);
    } finally {
      router.push('/chapters');
    }
  };

  return (
    <button
      type="button"
      onClick={handleDone}
      disabled={submitting}
      className="inline-flex items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {submitting ? 'Saving...' : 'Done'}
    </button>
  );
}

