'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { markActivity, hasExpired, clearActivity, setupCrossTabActivityListener, ACTIVITY_KEY, UserType } from '@/lib/sessionClient';

interface UseSessionOptions {
  checkInterval?: number; // How often to check for expiration (default: 1 minute)
}

/**
 * Unified session management hook for both admin and student
 * Handles inactivity tracking, cross-tab communication, and session expiration
 */
export function useSession(userType: UserType, options: UseSessionOptions = {}) {
  const { checkInterval = 60 * 1000 } = options; // Default: check every minute
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const logoutInProgressRef = useRef(false);

  // Logout function
  const logout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    
    try {
      const endpoint = userType === 'admin' ? '/api/admin/logout' : '/api/profile/logout';
      await fetch(endpoint, { method: 'POST' });
    } catch (e) {
      // Ignore errors
    }
    
    clearActivity(userType);
    setIsAuthenticated(false);
    setEmail(null);
    setRole(null);
    setShowSessionExpired(false);
    logoutInProgressRef.current = false;
  }, [userType]);

  // Force logout for inactivity
  const forceLogoutForInactivity = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    
    try {
      await logout();
      setShowSessionExpired(true);
    } catch (e) {
      // Ignore errors
      setIsAuthenticated(false);
      setEmail(null);
      setRole(null);
      setShowSessionExpired(true);
    } finally {
      logoutInProgressRef.current = false;
    }
  }, [logout]);

  // Check session from server
  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = userType === 'admin' ? '/api/admin/me' : '/api/profile/me';
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(endpoint, {
        signal: controller.signal,
        cache: 'no-store', // Prevent caching
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        const userEmail = userType === 'admin' ? data.admin?.email : data.profile?.email;
        const userRole = userType === 'admin' ? data.admin?.role : null;
        
        if (userEmail) {
          setIsAuthenticated(true);
          setEmail(userEmail);
          setRole(userRole || null);
          setShowSessionExpired(false);
          
          // Initialize activity tracking
          markActivity(userType);
          
          setLoading(false);
          return true;
        }
      } else if (res.status === 401) {
        // Session expired on server
        const hadActiveSession = localStorage.getItem(`sessionLastActivityAt_${userType}`) !== null;
        clearActivity(userType);
        setIsAuthenticated(false);
        setEmail(null);
        setRole(null);
        
        // Only show modal if user was previously logged in
        if (hadActiveSession) {
          setShowSessionExpired(true);
        }
      } else {
        setIsAuthenticated(false);
        setEmail(null);
        setRole(null);
      }
      
      setLoading(false);
      return false;
    } catch (err: any) {
      // Don't log timeout errors as they're expected
      if (err.name !== 'AbortError') {
      console.error('Session check error:', err);
      }
      setIsAuthenticated(false);
      setEmail(null);
      setRole(null);
      setLoading(false);
      return false;
    }
  }, [userType]);

  // Initial session check - run immediately
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Listen for storage events (e.g., when user logs in via AuthModal)
  useEffect(() => {
    const handleStorageEvent = (e: Event) => {
      // Check if this is a StorageEvent (from other tabs) or custom event (from AuthModal)
      const isStorageEvent = 'key' in e && 'newValue' in e;
      
      if (userType === 'student' && !isAuthenticated) {
        let shouldCheck = false;
        
        if (isStorageEvent) {
          // Actual StorageEvent from another tab
          const storageEvent = e as StorageEvent;
          if (storageEvent.key === 'profileEmail' && storageEvent.newValue) {
            shouldCheck = true;
          }
        } else {
          // Custom event from AuthModal in same tab - check localStorage directly
          const profileEmail = localStorage.getItem('profileEmail');
          if (profileEmail) {
            shouldCheck = true;
          }
        }
        
        if (shouldCheck) {
          // Small delay to ensure session cookie is set
          setTimeout(() => {
            checkSession();
          }, 200);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [checkSession, userType, isAuthenticated]);

  // Activity listeners and inactivity checking
  useEffect(() => {
    if (!isAuthenticated) return;

    // Mark activity on user interactions
    const activityEvents: (keyof DocumentEventMap)[] = [
      'click',
      'keydown',
      'mousemove',
      'touchstart',
      'scroll',
    ];

    const handleActivity = () => {
      markActivity(userType);
    };

    // Add activity listeners
    activityEvents.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });

    // Setup cross-tab activity listener
    const cleanupCrossTab = setupCrossTabActivityListener(userType, () => {
      // Activity detected in another tab - session is still active
    });
    
    // Listen for logout events from other tabs
    let logoutCleanup: (() => void) | null = null;
    if (typeof window !== 'undefined') {
      const logoutChannel = new BroadcastChannel('session-activity');
      const handleLogoutMessage = (e: MessageEvent) => {
        if (e.data?.type === 'logout' && e.data?.userType === userType) {
          // Another tab logged out - logout this tab too
          logout();
        }
      };
      
      logoutChannel.addEventListener('message', handleLogoutMessage);
      
      // Also listen for storage-based logout events
      const handleLogoutStorage = (e: StorageEvent) => {
        if (e.key === `${ACTIVITY_KEY}_${userType}_logout` && e.newValue === null) {
          logout();
        }
      };
      window.addEventListener('storage', handleLogoutStorage);
      
      logoutCleanup = () => {
        logoutChannel.removeEventListener('message', handleLogoutMessage);
        window.removeEventListener('storage', handleLogoutStorage);
      };
    }

    // Periodic inactivity check
    const intervalId = window.setInterval(() => {
      if (!isAuthenticated) return;
      
      // Check if expired (in ALL tabs)
      if (hasExpired(userType)) {
        forceLogoutForInactivity();
      }
    }, checkInterval);

    // Cleanup
    return () => {
      activityEvents.forEach((evt) => {
        document.removeEventListener(evt, handleActivity);
      });
      cleanupCrossTab();
      window.clearInterval(intervalId);
      if (logoutCleanup) {
        logoutCleanup();
      }
    };
  }, [isAuthenticated, userType, checkInterval, forceLogoutForInactivity]);

  return {
    isAuthenticated,
    email,
    role,
    loading,
    showSessionExpired,
    setShowSessionExpired,
    logout,
    checkSession,
  };
}
