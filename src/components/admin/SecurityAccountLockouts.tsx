'use client';

import { useState, useEffect } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface LockedAccount {
  id: string;
  email: string;
  failedLoginAttempts: number;
  minutesRemaining: number;
  lockedUntil: string;
}

// Custom hook for data fetching
function useLockedAccounts() {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLockedAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/account-management/locked-accounts');
      const data = await res.json();
      
      if (res.ok && data.success) {
        setLockedAccounts(data.accounts || []);
      } else {
        setError(data.error || 'Failed to fetch locked accounts');
      }
    } catch (err: any) {
      console.error('Error fetching locked accounts:', err);
      setError('An error occurred while fetching locked accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockedAccounts();
  }, []);

  return { lockedAccounts, loading, error, refetch: fetchLockedAccounts };
}

// Custom hook for account actions
function useAccountActions() {
  const unlockAccount = async (adminId: string, onSuccess: () => void) => {
    if (!confirm('Are you sure you want to unlock this account?')) return;
    
    try {
      const res = await fetch('/api/admin/account-management/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(data.message);
        onSuccess();
      } else {
        alert(data.error || 'Failed to unlock account');
      }
    } catch (error) {
      alert('Failed to unlock account');
    }
  };

  return { unlockAccount };
}

// UI Component
export function SecurityAccountLockouts() {
  const { lockedAccounts, loading, error, refetch } = useLockedAccounts();
  const { unlockAccount } = useAccountActions();

  const handleUnlock = (adminId: string) => {
    unlockAccount(adminId, refetch);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20">
          <Lock className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-50">Account Lockouts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage locked admin accounts</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Locked Accounts List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-zinc-400">Loading locked accounts...</span>
        </div>
      ) : lockedAccounts.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </div>
          <p className="text-zinc-400 font-medium">No locked accounts</p>
          <p className="text-xs text-zinc-500 mt-1">All admin accounts are active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lockedAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-500/10 p-5 hover:border-red-500/50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30">
                      <Lock className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">{account.email}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Account ID: {account.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="ml-13 space-y-1.5">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">Failed attempts:</span>
                      <span className="font-semibold text-red-400">{account.failedLoginAttempts}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">Time remaining:</span>
                      <span className="font-semibold text-yellow-400">{account.minutesRemaining} minutes</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">Locked until:</span>
                      <span className="text-zinc-300">{new Date(account.lockedUntil).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnlock(account.id)}
                  className="flex-shrink-0 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-green-600 hover:to-emerald-600 transition shadow-lg shadow-green-500/20"
                >
                  Unlock Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

