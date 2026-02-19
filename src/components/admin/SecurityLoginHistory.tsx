'use client';

import { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  device: string;
  success: boolean;
  failureReason?: string;
  requestId: string;
  createdAt: string;
}

interface LoginHistoryFilters {
  email: string;
  ip: string;
  success: string;
  startDate: string;
  endDate: string;
}

// Custom hook for data fetching
function useLoginHistory(filters: LoginHistoryFilters) {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoginHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.ip) params.append('ip', filters.ip);
      if (filters.success) params.append('success', filters.success);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/admin/login-history?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAttempts(data.attempts || []);
      } else {
        setError(data.error || 'Failed to fetch login history');
      }
    } catch (err: any) {
      console.error('Error fetching login history:', err);
      setError('An error occurred while fetching login history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { attempts, loading, error, refetch: fetchLoginHistory };
}

// UI Component
export function SecurityLoginHistory() {
  const [filters, setFilters] = useState<LoginHistoryFilters>({
    email: '',
    ip: '',
    success: '',
    startDate: '',
    endDate: '',
  });

  const { attempts, loading, error, refetch } = useLoginHistory(filters);

  const handleApplyFilters = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <History className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-50">Login History</h2>
          <p className="text-xs text-zinc-400 mt-0.5">View and filter all admin login attempts</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Email Address</label>
            <input
              type="text"
              placeholder="admin@example.com"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">IP Address</label>
            <input
              type="text"
              placeholder="192.168.1.1"
              value={filters.ip}
              onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Status</label>
            <select
              value={filters.success}
              onChange={(e) => setFilters({ ...filters, success: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            >
              <option value="">All attempts</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-600 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-zinc-400">Loading login history...</span>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
              <History className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 font-medium">No login attempts found</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/60 border-b border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Device</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Request ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      <div className="flex flex-col">
                        <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-zinc-500">{new Date(attempt.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-200 font-medium">{attempt.email}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400 font-mono">{attempt.ipAddress}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{attempt.device || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      {attempt.success ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-300">
                          <XCircle className="h-3 w-3" />
                          {attempt.failureReason || 'Failed'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{attempt.requestId?.substring(0, 8) || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

