'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  photoUrl?: string;
  phone?: string;
  country?: string;
  city?: string;
  status?: string;
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
          // Verify the session (profile exists) without requiring password
          const res = await fetch('/api/profile/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: storedEmail }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.profile) {
              setIsAuthenticated(true);
              setProfile({
                id: data.profile.id,
                name: data.profile.name,
                email: data.profile.email,
                photoUrl: data.profile.photoUrl,
                phone: data.profile.phone,
                country: data.profile.country,
                city: data.profile.city,
                status: data.profile.status,
              });
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
    const handleStorageChange = (e: StorageEvent | Event) => {
      // Check if profileEmail was removed (logout)
      const currentEmail = localStorage.getItem('profileEmail');
      if (!currentEmail) {
        // Email was removed - user logged out
        setIsAuthenticated(false);
        setProfile(null);
        setLoading(false);
      } else if (e instanceof StorageEvent && e.key === 'profileEmail') {
        // Email changed - re-check auth
        checkAuth();
      } else if (e.type === 'storage' && currentEmail) {
        // Generic storage event with email present - re-check
        checkAuth();
      }
    };

    // Listen for custom logout event
    const handleLogout = () => {
      setIsAuthenticated(false);
      setProfile(null);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleLogout);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  const logout = () => {
    try {
      // Clear localStorage immediately
      localStorage.removeItem('profileEmail');
      
      // Update state immediately - this is critical
      setIsAuthenticated(false);
      setProfile(null);
      setLoading(false);
      
      // Dispatch custom logout event for other components
      window.dispatchEvent(new CustomEvent('userLogout'));
      
      // Force immediate redirect - don't wait
      // Using replace to prevent back button issues
      window.location.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: clear everything and force redirect
      try {
        localStorage.removeItem('profileEmail');
      } catch (e) {
        // Ignore localStorage errors
      }
      window.location.replace('/');
    }
  };

  return { isAuthenticated, profile, loading, logout };
}

