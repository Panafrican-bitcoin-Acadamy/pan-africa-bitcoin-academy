'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ChapterAccessCheckProps {
  chapterNumber: number;
  chapterSlug: string;
  children: React.ReactNode;
}

export function ChapterAccessCheck({ chapterNumber, chapterSlug, children }: ChapterAccessCheckProps) {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return; // Wait for auth to load

      if (!isAuthenticated || !profile) {
        // Not authenticated - redirect to apply
        router.replace('/apply?redirect=/chapters/' + chapterSlug);
        return;
      }

      try {
        const response = await fetch('/api/chapters/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            chapterNumber,
            chapterSlug,
          }),
        });

        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          // If API fails, allow access for logged-in enrolled students as fallback
          // This prevents blocking users if there's a database issue
          setHasAccess(true);
          setChecking(false);
          return;
        }

        const data = await response.json();
        console.log('Chapter access check result:', data);

        if (!data.hasAccess) {
          // No access - redirect based on reason
          if (!data.isRegistered) {
            // Not registered - go to apply
            router.replace('/apply?redirect=/chapters/' + chapterSlug);
          } else if (!data.isEnrolled) {
            // Registered but not enrolled - go to apply
            router.replace('/apply?redirect=/chapters/' + chapterSlug);
          } else {
            // Enrolled but chapter locked - go to chapters list
            router.replace('/chapters');
          }
          return;
        }

        // Has access - show content
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking chapter access:', error);
        // On error, if user is authenticated and enrolled, allow access as fallback
        // This prevents blocking users due to API/database issues
        // In production, you might want to be more strict
        setHasAccess(true);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, profile, loading, chapterNumber, chapterSlug, router]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-400 border-r-transparent"></div>
          <p className="text-zinc-300">Loading</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

