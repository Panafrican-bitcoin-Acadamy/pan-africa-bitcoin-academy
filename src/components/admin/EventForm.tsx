'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Link as LinkIcon, Video, FileText, Users, GraduationCap, Rocket, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Cohort {
  id: string;
  name: string;
  label: string;
  isForAll?: boolean;
}

interface EventFormData {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  description: string;
  link: string;
  recording_url: string;
  cohort_id: string | null;
  for_all: boolean;
  chapter_number: string;
}

const EVENT_TYPES = [
  { value: 'community', label: 'Community', icon: Users },
  { value: 'live-class', label: 'Live Class', icon: Video },
  { value: 'workshop', label: 'Workshop', icon: GraduationCap },
  { value: 'assignment', label: 'Assignment', icon: FileText },
  { value: 'deadline', label: 'Deadline', icon: Clock },
  { value: 'quiz', label: 'Quiz', icon: FileText },
  { value: 'cohort', label: 'Cohort', icon: Rocket },
];

export default function EventForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: 'community',
    start_time: '',
    end_time: '',
    description: '',
    link: '',
    recording_url: '',
    cohort_id: null,
    for_all: true,
    chapter_number: '',
  });

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch cohorts on mount
  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    setLoadingCohorts(true);
    try {
      const response = await fetch('/api/events/cohorts');
      const data = await response.json();
      
      if (response.ok && data.options) {
        setCohorts(data.options);
      } else {
        console.error('Failed to fetch cohorts:', data);
      }
    } catch (err) {
      console.error('Error fetching cohorts:', err);
    } finally {
      setLoadingCohorts(false);
    }
  };

  const validateURL = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (optional field)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Event name
    if (!formData.name.trim()) {
      errors.name = 'Event name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Event name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      errors.name = 'Event name must be less than 200 characters';
    }

    // Start time
    if (!formData.start_time) {
      errors.start_time = 'Start date and time is required';
    } else {
      const startDate = new Date(formData.start_time);
      if (isNaN(startDate.getTime())) {
        errors.start_time = 'Invalid start date/time';
      }
    }

    // End time validation
    if (formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      if (isNaN(endDate.getTime())) {
        errors.end_time = 'Invalid end date/time';
      } else if (endDate <= startDate) {
        errors.end_time = 'End time must be after start time';
      }
    }

    // Description length
    if (formData.description && formData.description.length > 5000) {
      errors.description = 'Description must be less than 5000 characters';
    }

    // Link validation
    if (formData.link && !validateURL(formData.link)) {
      errors.link = 'Invalid URL format';
    }

    // Recording URL validation
    if (formData.recording_url && !validateURL(formData.recording_url)) {
      errors.recording_url = 'Invalid URL format';
    }

    // Chapter number validation (only for live-class)
    if (formData.type === 'live-class' && formData.chapter_number) {
      const chapterNum = parseInt(formData.chapter_number);
      if (isNaN(chapterNum) || chapterNum < 1) {
        errors.chapter_number = 'Chapter number must be a positive integer';
      }
    }

    // Cohort selection validation
    if (!formData.for_all && !formData.cohort_id) {
      errors.cohort_id = 'Please select a cohort or choose "For Everyone"';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        description: formData.description.trim() || null,
        link: formData.link.trim() || null,
        recording_url: formData.recording_url.trim() || null,
        for_all: formData.for_all,
        cohort_id: formData.for_all ? null : formData.cohort_id,
      };

      // Add chapter_number only for live-class events
      if (formData.type === 'live-class' && formData.chapter_number) {
        payload.chapter_number = parseInt(formData.chapter_number);
      }

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setSuccess(data.message || 'Event created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        type: 'community',
        start_time: '',
        end_time: '',
        description: '',
        link: '',
        recording_url: '',
        cohort_id: null,
        for_all: true,
        chapter_number: '',
      });
      setFieldErrors({});

      // Dispatch refresh event for EventsList
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshEventsList'));
      }

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Format datetime-local value from ISO string
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const selectedType = EVENT_TYPES.find(t => t.value === formData.type) || EVENT_TYPES[0];
  const TypeIcon = selectedType.icon;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">Create New Event</h2>
        <p className="text-sm text-zinc-400">
          Create events that will appear in the "Upcoming Events" section on the homepage. Events marked "For Everyone" will be visible to all users.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-300">Success</p>
            <p className="text-sm text-green-400/80 mt-1">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="event-name" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Name <span className="text-red-400">*</span>
          </label>
          <input
            id="event-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
              fieldErrors.name ? 'border-red-500/50' : 'border-zinc-700'
            }`}
            placeholder="e.g., Bitcoin Basics Workshop"
            maxLength={200}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event-type" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition ${
                    formData.type === type.value
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Visibility <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={formData.for_all}
                onChange={() => handleChange('for_all', true)}
                className="h-4 w-4 text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-sm text-zinc-300">For Everyone</span>
              <span className="text-xs text-zinc-500">(Appears on homepage)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!formData.for_all}
                onChange={() => handleChange('for_all', false)}
                className="h-4 w-4 text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-sm text-zinc-300">Specific Cohort</span>
            </label>
          </div>
        </div>

        {/* Cohort Selector */}
        {!formData.for_all && (
          <div>
            <label htmlFor="cohort" className="block text-sm font-medium text-zinc-300 mb-2">
              Select Cohort <span className="text-red-400">*</span>
            </label>
            <select
              id="cohort"
              value={formData.cohort_id || ''}
              onChange={(e) => handleChange('cohort_id', e.target.value || null)}
              className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.cohort_id ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              disabled={loadingCohorts}
            >
              <option value="">Select a cohort...</option>
              {cohorts
                .filter(c => !c.isForAll)
                .map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.label}
                  </option>
                ))}
            </select>
            {fieldErrors.cohort_id && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.cohort_id}</p>
            )}
          </div>
        )}

        {/* Date/Time Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-zinc-300 mb-2">
              Start Date & Time <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="start-time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  fieldErrors.start_time ? 'border-red-500/50' : 'border-zinc-700'
                }`}
              />
            </div>
            {fieldErrors.start_time && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.start_time}</p>
            )}
          </div>

          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-zinc-300 mb-2">
              End Date & Time <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="end-time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  fieldErrors.end_time ? 'border-red-500/50' : 'border-zinc-700'
                }`}
              />
            </div>
            {fieldErrors.end_time && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.end_time}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none ${
              fieldErrors.description ? 'border-red-500/50' : 'border-zinc-700'
            }`}
            placeholder="Describe the event..."
            maxLength={5000}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {formData.description.length}/5000 characters
          </p>
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
          )}
        </div>

        {/* Link */}
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Link <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.link ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="https://..."
            />
          </div>
          {fieldErrors.link && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.link}</p>
          )}
        </div>

        {/* Recording URL */}
        <div>
          <label htmlFor="recording-url" className="block text-sm font-medium text-zinc-300 mb-2">
            Recording URL <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              id="recording-url"
              type="url"
              value={formData.recording_url}
              onChange={(e) => handleChange('recording_url', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.recording_url ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="https://..."
            />
          </div>
          {fieldErrors.recording_url && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.recording_url}</p>
          )}
        </div>

        {/* Chapter Number (only for live-class) */}
        {formData.type === 'live-class' && (
          <div>
            <label htmlFor="chapter-number" className="block text-sm font-medium text-zinc-300 mb-2">
              Chapter Number <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <input
              id="chapter-number"
              type="number"
              min="1"
              value={formData.chapter_number}
              onChange={(e) => handleChange('chapter_number', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.chapter_number ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="e.g., 1, 2, 3..."
            />
            {fieldErrors.chapter_number && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.chapter_number}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

