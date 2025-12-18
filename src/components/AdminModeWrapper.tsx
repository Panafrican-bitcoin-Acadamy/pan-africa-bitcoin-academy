'use client';

import { AdminModeBadge } from './AdminModeBadge';

export function AdminModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminModeBadge />
      {children}
    </>
  );
}
