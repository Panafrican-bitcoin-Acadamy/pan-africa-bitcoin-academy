'use client';

import { useState, useEffect } from 'react';
import { Users, RefreshCw, Loader2 } from 'lucide-react';

export interface EventRegistrationRow {
  id: string;
  event_id: string;
  event_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  additional_data: Record<string, unknown> | null;
  created_at: string;
}

export default function EventRegistrationsList() {
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events/registrations', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch registrations');
      setRegistrations(data.registrations || []);
    } catch (err: unknown) {
      setRegistrations([]);
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const eventNames = Array.from(new Set(registrations.map((r) => r.event_name))).sort();
  const filtered =
    eventFilter === 'all'
      ? registrations
      : registrations.filter((r) => r.event_name === eventFilter);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xl font-semibold text-zinc-50">Event Registrations</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            People who registered for events (non-cohort events with registration enabled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="all">All events</option>
            {eventNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchRegistrations}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-500/10 py-4 text-center text-sm text-red-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-zinc-400">
          {registrations.length === 0
            ? 'No event registrations yet.'
            : 'No registrations match the selected event.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/80">
                <th className="px-4 py-3 text-left font-semibold text-zinc-300">Event</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-300">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-300">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-300">Registered</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800/80 hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">{r.event_name}</td>
                  <td className="px-4 py-3">{r.full_name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.phone || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
