'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentDashboard } from "@/components/StudentDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('profileEmail');
        if (!storedEmail) {
          // Not authenticated, redirect to home
          router.push('/');
          return;
        }

        // Verify the profile exists
        const res = await fetch('/api/profile/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: storedEmail }),
        });

        if (!res.ok) {
          localStorage.removeItem('profileEmail');
          router.push('/');
          return;
        }

        const data = await res.json();
        if (!data.found || !data.profile) {
          localStorage.removeItem('profileEmail');
          router.push('/');
          return;
        }

        // User is authenticated
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

  return <StudentDashboard />;
}
