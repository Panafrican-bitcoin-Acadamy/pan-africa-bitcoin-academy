/**
 * Client-side session management utilities
 * Handles cross-tab activity tracking and session expiration
 */

export const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
export const ACTIVITY_KEY = 'sessionLastActivityAt';
export const ACTIVITY_CHANNEL = 'session-activity';

export type UserType = 'admin' | 'student';

// BroadcastChannel for cross-tab communication (more reliable than storage events)
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(ACTIVITY_CHANNEL);
  } catch (e) {
    // BroadcastChannel not supported, fallback to storage events
  }
}

/**
 * Mark activity timestamp (current tab + broadcast to other tabs)
 */
export function markActivity(userType: UserType) {
  try {
    const now = Date.now().toString();
    localStorage.setItem(ACTIVITY_KEY, now);
    localStorage.setItem(`${ACTIVITY_KEY}_${userType}`, now);
    
    // Broadcast activity to other tabs using BroadcastChannel (preferred) or storage event
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'activity', userType, timestamp: now });
    } else {
      // Fallback to storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: `${ACTIVITY_KEY}_${userType}`,
        newValue: now,
        storageArea: localStorage,
      }));
    }
  } catch (e) {
    // Ignore storage errors (private browsing, etc.)
  }
}

/**
 * Check if session has expired (checks both current tab and cross-tab activity)
 */
export function hasExpired(userType: UserType): boolean {
  try {
    // Check current tab activity
    const currentTabActivity = localStorage.getItem(`${ACTIVITY_KEY}_${userType}`);
    if (currentTabActivity) {
      const lastTs = Number(currentTabActivity);
      if (!Number.isNaN(lastTs) && Date.now() - lastTs <= INACTIVITY_LIMIT_MS) {
        return false; // Current tab is active
      }
    }

    // Check shared activity (any tab)
    const sharedActivity = localStorage.getItem(ACTIVITY_KEY);
    if (sharedActivity) {
      const lastTs = Number(sharedActivity);
      if (!Number.isNaN(lastTs) && Date.now() - lastTs <= INACTIVITY_LIMIT_MS) {
        return false; // Some tab is active
      }
    }

    // No recent activity in any tab
    return true;
  } catch (e) {
    return false; // On error, don't expire
  }
}

/**
 * Clear activity tracking
 */
export function clearActivity(userType: UserType) {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.removeItem(`${ACTIVITY_KEY}_${userType}`);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Setup cross-tab activity listeners
 * When any tab marks activity, update this tab's activity too
 */
export function setupCrossTabActivityListener(
  userType: UserType,
  onActivityDetected?: () => void
): () => void {
  const handleActivity = (timestamp: string) => {
    try {
      localStorage.setItem(`${ACTIVITY_KEY}_${userType}`, timestamp);
      localStorage.setItem(ACTIVITY_KEY, timestamp);
      if (onActivityDetected) {
        onActivityDetected();
      }
    } catch (e) {
      // Ignore
    }
  };

  // Listen via BroadcastChannel (preferred)
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data?.type === 'activity' && e.data?.userType === userType && e.data?.timestamp) {
      handleActivity(e.data.timestamp);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Fallback: Listen via storage events
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `${ACTIVITY_KEY}_${userType}` || e.key === ACTIVITY_KEY) {
      if (e.newValue) {
        handleActivity(e.newValue);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageChange);
  };
}

