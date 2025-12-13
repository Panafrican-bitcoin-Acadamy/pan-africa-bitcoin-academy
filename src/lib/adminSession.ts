import { NextRequest, NextResponse } from 'next/server';
// Re-export from unified session management for backward compatibility
export {
  requireAdmin,
  setAdminCookie,
  clearAdminCookie,
} from './session';
import { attachSessionRefresh } from './session';

// Export attachRefresh as an alias for attachSessionRefresh (for backward compatibility)
export function attachRefresh(res: NextResponse, session: { adminId: string; email: string; role: string | null; issuedAt: number; lastActive: number }) {
  attachSessionRefresh(res, {
    userId: session.adminId,
    email: session.email,
    role: session.role,
    userType: 'admin',
    issuedAt: session.issuedAt,
    lastActive: session.lastActive,
  });
}

// Legacy type for backward compatibility
export interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: string | null;
  issuedAt: number;
  lastActive: number;
}
