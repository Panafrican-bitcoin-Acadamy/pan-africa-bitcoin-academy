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

  if (!showBadge) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-orange-500/20 border border-orange-500/50 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-orange-400 text-sm font-semibold">👑 Admin Mode</p>
      <p className="text-orange-300/70 text-xs">Testing Access</p>
    </div>
  );
}
