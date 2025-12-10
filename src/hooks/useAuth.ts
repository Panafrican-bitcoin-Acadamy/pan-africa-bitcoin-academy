'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  photoUrl?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('profileEmail');
        if (storedEmail) {
          // Verify the profile exists
          const res = await fetch('/api/profile/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: storedEmail }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.found && data.profile) {
              setIsAuthenticated(true);
              setProfile(data.profile);
            } else {
              // Profile not found, clear storage
              localStorage.removeItem('profileEmail');
              setIsAuthenticated(false);
              setProfile(null);
            }
          } else {
            localStorage.removeItem('profileEmail');
            setIsAuthenticated(false);
            setProfile(null);
          }
        } else {
          setIsAuthenticated(false);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., when user signs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileEmail') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('profileEmail');
    setIsAuthenticated(false);
    setProfile(null);
    window.location.href = '/';
  };

  return { isAuthenticated, profile, loading, logout };
}

