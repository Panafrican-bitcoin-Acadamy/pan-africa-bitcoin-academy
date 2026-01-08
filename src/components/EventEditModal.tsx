'use client';

import { useState, useEffect } from 'react';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    type: string;
    date: Date;
    time?: string;
    link?: string;
    description?: string;
    cohortId?: string | null;
  } | null;
  cohorts: Array<{ id: string; name: string }>;
  onUpdate: () => void;
}

export function EventEditModal({ isOpen, onClose, event, cohorts, onUpdate }: EventEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'live-class',
    start_time: '',
    end_time: '',
    description: '',
    link: '',
    cohort_id: 'for_all',
    chapter_number: '',
  });

  useEffect(() => {
    if (event && isOpen) {
      // Parse the date and time from the event
      const eventDate = new Date(event.date);
      const startDateTime = new Date(eventDate);
      
      // Parse time if available (format: "07:00 PM")
      if (event.time) {
        const [time, period] = event.time.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        startDateTime.setHours(hour24, parseInt(minutes), 0, 0);
      }

      // Format datetime-local format (YYYY-MM-DDTHH:mm)
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        name: event.title || '',
        type: event.type || 'live-class',
        start_time: formatDateTime(startDateTime),
        end_time: '', // We don't have end_time in the event object
        description: event.description || '',
        link: event.link || '',
        cohort_id: event.cohortId || 'for_all',
        chapter_number: '',
      });
      setError(null);
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      // Convert datetime-local string to ISO for API
      const toIsoString = (value: string) => (value ? new Date(value).toISOString() : null);

      const updateData: any = {
        name: formData.name.trim(),
        type: formData.type,
        start_time: toIsoString(formData.start_time),
        end_time: toIsoString(formData.end_time),
        description: formData.description?.trim() || null,
        link: formData.link?.trim() || null,
        cohort_id: formData.cohort_id === 'for_all' ? null : formData.cohort_id,
      };

      if (formData.type === 'live-class' && formData.chapter_number && !isNaN(parseInt(formData.chapter_number))) {
        updateData.chapter_number = parseInt(formData.chapter_number);
      }

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

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
          <h2 className="text-xl font-semibold text-cyan-300">Edit Event</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl leading-none"
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

          <form onSubmit={handleSubmit} className="space-y-4" id="event-edit-form">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Event Name</label>
            <input
              type="text"
              required
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Type</label>
            <select
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="live-class">Live Class</option>
              <option value="assignment">Assignment</option>
              <option value="community">Community</option>
              <option value="workshop">Workshop</option>
              <option value="deadline">Deadline</option>
              <option value="quiz">Quiz</option>
              <option value="cohort">Cohort</option>
            </select>
          </div>

          {formData.type === 'live-class' && (
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Chapter Number (Optional)</label>
              <input
                type="number"
                min="1"
                max="20"
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="1-20"
                value={formData.chapter_number}
                onChange={(e) => setFormData({ ...formData, chapter_number: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Start Time</label>
            <input
              type="datetime-local"
              required
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">End Time (Optional)</label>
            <input
              type="datetime-local"
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Link (Optional)</label>
            <input
              type="url"
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Description (Optional)</label>
            <textarea
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Cohort</label>
            <select
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
              value={formData.cohort_id}
              onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
            >
              <option value="for_all">For everyone</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          </form>
        </div>

        {/* Footer with Buttons - Fixed */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <button
              type="submit"
              form="event-edit-form"
              disabled={loading || !formData.name || !formData.start_time}
              className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

