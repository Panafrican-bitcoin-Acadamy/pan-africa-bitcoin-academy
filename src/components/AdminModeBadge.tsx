'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';

export function AdminModeBadge() {
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading } = useSession('admin');
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!loading && isAdminAuth && adminEmail) {
      setShowBadge(true);
    } else {
      setShowBadge(false);
    }
  }, [isAdminAuth, adminEmail, loading]);

  // Always render the badge container to check if it's working
  // The badge will be visible when admin is logged in
  if (!showBadge) return null;

  return (
    <div className="fixed top-[3.6rem] left-4 z-[9998] bg-orange-500/20 border border-orange-500/50 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm pointer-events-none select-none">
      <p className="text-orange-400 text-xs sm:text-sm font-semibold">Admin Mode</p>
    </div>
  );
}
