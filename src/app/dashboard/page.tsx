'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { AdminModeBadge } from '@/components/AdminModeBadge';

// Lazy load heavy dashboard components
const StudentDashboard = dynamic(() => import("@/components/StudentDashboard").then(mod => ({ default: mod.StudentDashboard })), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-zinc-400">Loading dashboard...</div>
    </div>
  ),
});

const SessionExpiredModal = dynamic(() => import('@/components/SessionExpiredModal').then(mod => ({ default: mod.SessionExpiredModal })), {
  ssr: false,
  loading: () => null,
});

export default function DashboardPage() {
  const router = useRouter();
  const { logout, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  // Redirect if not authenticated (after auth check completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Don't proceed if not authenticated
    if (!isAuthenticated || authLoading) {
      return;
    }

    // Check if user is authenticated and get user data
    const checkAuth = async () => {
      try {
        let storedEmail = localStorage.getItem('profileEmail');

        // If no stored email, try to fetch the current profile (session cookie)
        if (!storedEmail) {
          const meRes = await fetch('/api/profile/me', { credentials: 'include' });
          if (meRes.ok) {
            const meData = await meRes.json();
            const email = meData.profile?.email;
            if (email) {
              storedEmail = email;
              localStorage.setItem('profileEmail', email);
            }
          }
        }

        if (!storedEmail) {
          router.push('/');
          return;
        }

        // Get comprehensive user data (profile, student status, cohort)
        const res = await fetch('/api/profile/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: storedEmail }),
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Session expired - show modal
            setShowSessionExpired(true);
            localStorage.removeItem('profileEmail');
            return;
          }
          localStorage.removeItem('profileEmail');
          router.push('/');
          return;
        }

        const data = await res.json();
        if (!data.profile) {
          localStorage.removeItem('profileEmail');
          router.push('/');
          return;
        }

        // Store user data for dashboard
        setUserData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('profileEmail');
        router.push('/');
      }
    };

    checkAuth();
  }, [router, isAuthenticated, authLoading]);

  // Show loading while checking authentication or fetching user data
  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-400 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminModeBadge />
      <StudentDashboard userData={userData} />
      <SessionExpiredModal
        isOpen={showSessionExpired}
        onClose={async () => {
          setShowSessionExpired(false);
          await logout();
          router.push('/');
        }}
        userType="student"
      />
    </>
  );
}
