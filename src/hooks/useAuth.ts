'use client';

import { useState, useEffect, useRef } from 'react';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';

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
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const logoutInProgressRef = useRef(false);

  // Session inactivity config (30 minutes)
  const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
  const ACTIVITY_KEY = 'lastActivityAt';

  useEffect(() => {
    const markActivity = () => {
      try {
        localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }
    };

    const hasExpired = () => {
      try {
        const last = localStorage.getItem(ACTIVITY_KEY);
        if (!last) return false;
        const lastTs = Number(last);
        if (Number.isNaN(lastTs)) return false;
        return Date.now() - lastTs > INACTIVITY_LIMIT_MS;
      } catch (e) {
        return false;
      }
    };

    const forceLogoutForInactivity = () => {
      if (logoutInProgressRef.current) return;
      logoutInProgressRef.current = true;
      try {
        localStorage.removeItem('profileEmail');
        localStorage.setItem('sessionExpired', 'true');
      } catch (e) {
        // Ignore storage errors
      }
      setIsAuthenticated(false);
      setProfile(null);
      setLoading(false);
      window.dispatchEvent(new CustomEvent('userLogout'));
      // Show session expired modal instead of alert
      setShowSessionExpired(true);
    };

    const checkAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('profileEmail');
        if (storedEmail) {
          // Initialize activity timestamp if missing
          if (!localStorage.getItem(ACTIVITY_KEY)) {
            markActivity();
          }

          // If already expired, logout immediately
          if (hasExpired()) {
            forceLogoutForInactivity();
            return;
          }

          // Verify the session (profile exists) without requiring password
          const res = await fetch('/api/profile/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: storedEmail }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.profile) {
              markActivity();
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
          } else if (res.status === 401 || res.status === 403) {
            // Session expired or unauthorized
            localStorage.removeItem('profileEmail');
            setIsAuthenticated(false);
            setProfile(null);
            setShowSessionExpired(true);
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

    // Activity listeners to refresh last activity timestamp
    const activityEvents: (keyof DocumentEventMap)[] = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => document.addEventListener(evt, markActivity, { passive: true }));

    // Inactivity interval check
    const intervalId = window.setInterval(() => {
      if (!isAuthenticated || logoutInProgressRef.current) return;
      if (hasExpired()) {
        forceLogoutForInactivity();
      }
    }, 60 * 1000);

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
      activityEvents.forEach((evt) => document.removeEventListener(evt, markActivity));
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

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

  const SessionExpiredPopup = () => (
    <SessionExpiredModal
      isOpen={showSessionExpired}
      onClose={() => {
        setShowSessionExpired(false);
        window.location.replace('/');
      }}
      userType="student"
    />
  );

  return { isAuthenticated, profile, loading, logout, SessionExpiredPopup };
}

