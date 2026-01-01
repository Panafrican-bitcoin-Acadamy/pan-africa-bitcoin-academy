'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ChapterCompletionTrackerProps {
  chapterNumber: number;
  chapterSlug: string;
}

export function ChapterCompletionTracker({ chapterNumber, chapterSlug }: ChapterCompletionTrackerProps) {
  const { isAuthenticated, profile } = useAuth();

  useEffect(() => {
    // Track chapter view/completion after a delay (user has read the chapter)
    const trackCompletion = async () => {
      if (!isAuthenticated || !profile) return;

      // Wait 4 minutes before marking as completed (user has had time to read)
      const timer = setTimeout(async () => {
        try {
          await fetch('/api/chapters/mark-completed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profile.email,
              chapterNumber,
              chapterSlug,
            }),
          });
        } catch (error) {
          console.error('Error tracking chapter completion:', error);
        }
      }, 240000); // 4 minutes (240000ms)

      return () => clearTimeout(timer);
    };

    trackCompletion();
  }, [isAuthenticated, profile, chapterNumber, chapterSlug]);

  return null; // This component doesn't render anything
}




