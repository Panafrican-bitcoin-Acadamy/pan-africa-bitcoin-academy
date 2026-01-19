'use client';

import { useState, useEffect } from 'react';

interface SessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    cohort_id: string;
    session_number: number;
    session_date: string;
    topic?: string | null;
    instructor?: string | null;
    duration_minutes?: number | null;
    link?: string | null;
    recording_url?: string | null;
    status: string;
    cohorts?: {
      name: string;
    } | null;
  } | null;
  onUpdate: () => void;
}

export function SessionEditModal({ isOpen, onClose, session, onUpdate }: SessionEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    session_date: '',
    topic: '',
    instructor: '',
    duration_minutes: '90',
    link: '',
    recording_url: '',
    status: 'scheduled',
  });

  useEffect(() => {
    if (session && isOpen) {
      // Format date for date input (YYYY-MM-DD)
      const sessionDate = new Date(session.session_date);
      const year = sessionDate.getFullYear();
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const day = String(sessionDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      setFormData({
        session_date: dateString,
        topic: session.topic || '',
        instructor: session.instructor || '',
        duration_minutes: String(session.duration_minutes || 90),
        link: session.link || '',
        recording_url: session.recording_url || '',
        status: session.status || 'scheduled',
      });
      setError(null);
    }
  }, [session, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      // The session.id is already the actual UUID from the database
      const sessionId = session.id;

      // Validate session ID
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        setError('Invalid session ID');
        setLoading(false);
        return;
      }

      // Validate duration
      const duration = parseInt(formData.duration_minutes);
      if (isNaN(duration) || duration < 1 || duration > 600) {
        setError('Duration must be between 1 and 600 minutes');
        setLoading(false);
        return;
      }

      const updateData: any = {
        session_date: formData.session_date,
        topic: formData.topic.trim() || null,
        instructor: formData.instructor.trim() || null,
        duration_minutes: duration,
        link: formData.link.trim() || null,
        recording_url: formData.recording_url.trim() || null,
        status: formData.status,
      };

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for admin authentication
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !session) return null;

  const cohortName = session.cohorts?.name || 'Cohort';

  return (
    <div 
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/80 p-4 pt-24 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-md rounded-xl border border-cyan-400/30 bg-gradient-to-br from-zinc-900 to-black shadow-[0_0_40px_rgba(34,211,238,0.2)] my-4 max-h-[calc(100vh-8rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-cyan-300">Edit Session</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {cohortName} - Session {session.session_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="session-edit-form">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Session Date</label>
              <input
                type="date"
                required
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Topic (Optional)</label>
              <input
                type="text"
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="e.g., Introduction to Bitcoin"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Instructor (Optional)</label>
              <input
                type="text"
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="Instructor name"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="600"
                required
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Video Call Link (Optional)</label>
              <input
                type="url"
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Recording URL (Optional)</label>
              <input
                type="url"
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="https://..."
                value={formData.recording_url}
                onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Status</label>
              <select
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            <div className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-3 text-xs text-zinc-400">
              <p className="font-medium text-zinc-300 mb-1">Note:</p>
              <p>Session number and cohort cannot be changed. To change these, regenerate sessions for the cohort.</p>
            </div>
          </form>
        </div>

        {/* Footer with Button - Fixed */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-zinc-800">
          <button
            type="submit"
            form="session-edit-form"
            disabled={loading || !formData.session_date || !formData.duration_minutes}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}


