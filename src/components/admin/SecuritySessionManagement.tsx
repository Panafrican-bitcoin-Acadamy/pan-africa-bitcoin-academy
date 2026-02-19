'use client';

import { useState, useEffect } from 'react';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Session {
  id: string;
  device: string;
  ipAddress: string;
  lastActive: string;
  expiresAt: string;
  isCurrent: boolean;
}

// Custom hook for data fetching
function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError('An error occurred while fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { sessions, loading, error, refetch: fetchSessions };
}

// Custom hook for session actions
function useSessionActions() {
  const revokeSession = async (sessionId: string, onSuccess: () => void) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(data.message);
        onSuccess();
      } else {
        alert(data.error || 'Failed to revoke session');
      }
    } catch (error) {
      alert('Failed to revoke session');
    }
  };

  const revokeAllSessions = async (onSuccess: () => void) => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in.')) return;
    
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(data.message);
        onSuccess();
      } else {
        alert(data.error || 'Failed to revoke sessions');
      }
    } catch (error) {
      alert('Failed to revoke sessions');
    }
  };

  return { revokeSession, revokeAllSessions };
}

// UI Component
export function SecuritySessionManagement() {
  const { sessions, loading, error, refetch } = useSessions();
  const { revokeSession, revokeAllSessions } = useSessionActions();

  const handleRevoke = (sessionId: string) => {
    revokeSession(sessionId, refetch);
  };

  const handleRevokeAll = () => {
    revokeAllSessions(refetch);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <LogOut className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-50">Session Management</h2>
            <p className="text-xs text-zinc-400 mt-0.5">View and manage active admin sessions</p>
          </div>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAll}
            className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:from-red-600 hover:to-rose-600 transition shadow-lg shadow-red-500/20"
          >
            Revoke All Other Sessions
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-zinc-400">Loading active sessions...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
            <LogOut className="h-8 w-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-medium">No active sessions</p>
          <p className="text-xs text-zinc-500 mt-1">No admin sessions are currently active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-xl border p-5 transition ${
                session.isCurrent
                  ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 shadow-lg shadow-cyan-500/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${
                      session.isCurrent
                        ? 'bg-cyan-500/20 border-cyan-500/30'
                        : 'bg-zinc-800/50 border-zinc-700/50'
                    }`}>
                      <LogOut className={`h-5 w-5 ${session.isCurrent ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-200">{session.device || 'Unknown Device'}</p>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-xs font-medium text-cyan-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">Session ID: {session.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="ml-13 space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">IP Address:</span>
                      <span className="font-mono text-zinc-300">{session.ipAddress}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">Last active:</span>
                      <span className="text-zinc-300">{new Date(session.lastActive).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">Expires:</span>
                      <span className="text-zinc-300">{new Date(session.expiresAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="flex-shrink-0 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-600 hover:to-rose-600 transition shadow-lg shadow-red-500/20"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

