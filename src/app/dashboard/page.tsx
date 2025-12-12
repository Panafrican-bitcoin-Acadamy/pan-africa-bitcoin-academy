'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentDashboard } from "@/components/StudentDashboard";
import { SessionExpiredModal } from '@/components/SessionExpiredModal';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and get user data
    const checkAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('profileEmail');
        if (!storedEmail) {
          // Not authenticated, redirect to home
          router.push('/');
          return;
        }

        // Get comprehensive user data (profile, student status, cohort)
        const res = await fetch('/api/profile/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
  }, [router]);

  if (loading) {
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
      <StudentDashboard userData={userData} />
      <SessionExpiredModal
        isOpen={showSessionExpired}
        onClose={() => {
          setShowSessionExpired(false);
          router.push('/');
        }}
        userType="student"
      />
    </>
  );
}
