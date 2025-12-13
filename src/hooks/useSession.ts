'use client';

import { useState, useEffect, useRef } from 'react';
import { markActivity, hasExpired, clearActivity, setupCrossTabActivityListener, INACTIVITY_LIMIT_MS, UserType } from '@/lib/sessionClient';

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

  // Check session from server
  const checkSession = async () => {
    try {
      setLoading(true);
      const endpoint = userType === 'admin' ? '/api/admin/me' : '/api/profile/me';
      const res = await fetch(endpoint);
      
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
      
      return false;
    } catch (err: any) {
      console.error('Session check error:', err);
      setIsAuthenticated(false);
      setEmail(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
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
  };

  // Force logout for inactivity
  const forceLogoutForInactivity = async () => {
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
  };

  // Initial session check
  useEffect(() => {
    checkSession();
  }, []);

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
    };
  }, [isAuthenticated, userType, checkInterval]);

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
