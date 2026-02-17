'use client';

import { useState } from 'react';
import { User, Briefcase, Tag, FileText, Image as ImageIcon, Github, Twitter, BookOpen, CheckCircle2, AlertCircle, X, Mail, MapPin, Phone } from 'lucide-react';

interface MentorFormData {
  name: string;
  email: string;
  country: string;
  whatsapp: string;
  role: string;
  hours: string;
  experience: string;
  teachingExperience: string;
  motivation: string;
  comments: string;
  type: 'Mentor' | 'Volunteer' | 'Guest Lecturer';
  description: string;
  image_url: string;
  github: string;
  twitter: string;
  bio: string;
  is_active: boolean;
}

export default function MentorRegistrationForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [formData, setFormData] = useState<MentorFormData>({
    name: '',
    email: '',
    country: '',
    whatsapp: '',
    role: '',
    hours: '',
    experience: '',
    teachingExperience: '',
    motivation: '',
    comments: '',
    type: 'Mentor',
    description: '',
    image_url: '',
    github: '',
    twitter: '',
    bio: '',
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateURL = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (optional field)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation (optional, but if provided, must be valid)
    if (formData.name.trim() && formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    // Email validation (optional, but if provided, must be valid)
    if (formData.email.trim() && !validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // URL validations
    if (formData.image_url && !validateURL(formData.image_url)) {
      errors.image_url = 'Invalid URL format';
    }
    if (formData.github && !validateURL(formData.github)) {
      errors.github = 'Invalid URL format';
    }
    if (formData.twitter && !validateURL(formData.twitter)) {
      errors.twitter = 'Invalid URL format';
    }

    // Bio validation
    if (formData.bio && formData.bio.length > 2000) {
      errors.bio = 'Bio must be less than 2000 characters';
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
      // Map role to type (default to Mentor if not provided)
      const roleToType: Record<string, 'Mentor' | 'Volunteer' | 'Guest Lecturer'> = {
        'mentor': 'Mentor',
        'lecturer': 'Guest Lecturer',
        'volunteer': 'Volunteer',
      };
      const mentorType = formData.role ? (roleToType[formData.role] || 'Mentor') : 'Mentor';

      // Prepare payload - all fields are optional
      const description = formData.description.trim() || null;
      const role = formData.role 
        ? (formData.role === 'mentor' ? 'Mentor' : formData.role === 'lecturer' ? 'Guest Lecturer' : 'Volunteer')
        : 'Mentor'; // Default role

      const payload: any = {
        name: formData.name.trim() || null,
        role: role,
        type: mentorType,
        description: description,
        image_url: formData.image_url.trim() || null,
        github: formData.github.trim() || null,
        twitter: formData.twitter.trim() || null,
        bio: formData.bio.trim() || null,
        is_active: formData.is_active,
      };

      const response = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register mentor');
      }

      setSuccess('Mentor registered successfully! They will appear on the mentorship page.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        country: '',
        whatsapp: '',
        role: '',
        hours: '',
        experience: '',
        teachingExperience: '',
        motivation: '',
        comments: '',
        type: 'Mentor',
        description: '',
        image_url: '',
        github: '',
        twitter: '',
        bio: '',
        is_active: true,
      });
      setFieldErrors({});

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error registering mentor:', err);
      setError(err.message || 'Failed to register mentor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof MentorFormData, value: any) => {
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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">Register New Mentor</h2>
          <p className="text-sm text-zinc-400">
            Add a new mentor to the database. They will appear on the mentorship page if marked as active.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-300 transition"
            title="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
        {/* Personal Information Section */}
        <div className="rounded-xl border border-cyan-400/25 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <span className="text-xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-cyan-200">Personal Information</h3>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full rounded-lg border border-cyan-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition ${
                    fieldErrors.name ? 'border-red-500/50' : ''
                  }`}
                  placeholder="John Doe"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full rounded-lg border border-cyan-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition ${
                    fieldErrors.email ? 'border-red-500/50' : ''
                  }`}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className={`w-full rounded-lg border border-cyan-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition ${
                    fieldErrors.country ? 'border-red-500/50' : ''
                  }`}
                  placeholder="e.g., Nigeria, Kenya, Ghana"
                />
                {fieldErrors.country && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.country}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  WhatsApp / X / Nostr
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  autoComplete="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                  placeholder="Phone number or @username"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection Section */}
        <div className="rounded-xl border border-orange-400/25 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-orange-200">Role Selection</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Which role are you applying for?
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  handleChange('role', e.target.value);
                  // Map role to type
                  const roleToType: Record<string, 'Mentor' | 'Volunteer' | 'Guest Lecturer'> = {
                    'mentor': 'Mentor',
                    'lecturer': 'Guest Lecturer',
                    'volunteer': 'Volunteer',
                  };
                  handleChange('type', roleToType[e.target.value] || 'Mentor');
                }}
                className={`w-full rounded-lg border border-orange-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition ${
                  fieldErrors.role ? 'border-red-500/50' : ''
                }`}
              >
                <option value="">Select a role (optional)</option>
                <option value="mentor">Mentor - 1–3 hours/month</option>
                <option value="lecturer">Guest Lecturer - Per invitation</option>
                <option value="volunteer">Volunteer - Flexible</option>
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.role}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                How many hours per month can you contribute?
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => handleChange('hours', e.target.value)}
                className={`w-full rounded-lg border border-orange-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition ${
                  fieldErrors.hours ? 'border-red-500/50' : ''
                }`}
                placeholder="e.g., 8-12 hours"
              />
              {fieldErrors.hours && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.hours}</p>
              )}
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="rounded-xl border border-purple-400/25 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <span className="text-xl">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-purple-200">Experience & Background</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                What experience do you have with Bitcoin / Lightning?
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                rows={4}
                className={`w-full rounded-lg border border-purple-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition resize-none ${
                  fieldErrors.experience ? 'border-red-500/50' : ''
                }`}
                placeholder="Describe your experience with Bitcoin, Lightning, nodes, mining, development, etc."
              />
              {fieldErrors.experience && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.experience}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Have you taught or mentored before?
              </label>
              <textarea
                value={formData.teachingExperience}
                onChange={(e) => handleChange('teachingExperience', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-purple-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition resize-none"
                placeholder="Any teaching, mentoring, or community leadership experience?"
              />
            </div>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="rounded-xl border border-green-400/25 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <span className="text-xl">💚</span>
            </div>
            <h3 className="text-lg font-semibold text-green-200">Motivation & Vision</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Why do you want to support this academy?
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => handleChange('motivation', e.target.value)}
                rows={4}
                className={`w-full rounded-lg border border-green-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition resize-none ${
                  fieldErrors.motivation ? 'border-red-500/50' : ''
                }`}
                placeholder="Share your motivation, vision, and what drives you to contribute..."
              />
              {fieldErrors.motivation && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.motivation}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Additional comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-green-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition resize-none"
                placeholder="Anything else you'd like to share?"
              />
            </div>
          </div>
        </div>

        {/* Additional Fields Section */}
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/20">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">Additional Information</h3>
          </div>
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Description <span className="text-zinc-500 text-xs">(Optional - shown on mentorship page)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className={`w-full rounded-lg border border-zinc-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition resize-none ${
                  fieldErrors.description ? 'border-red-500/50' : ''
                }`}
                placeholder="Short quote or description shown on mentorship page"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {formData.description.length}/500 characters
              </p>
              {fieldErrors.description && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Image URL <span className="text-zinc-500 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                className={`w-full rounded-lg border border-zinc-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition ${
                  fieldErrors.image_url ? 'border-red-500/50' : ''
                }`}
                placeholder="https://example.com/image.jpg"
              />
              {fieldErrors.image_url && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.image_url}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* GitHub URL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  GitHub URL <span className="text-zinc-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => handleChange('github', e.target.value)}
                  className={`w-full rounded-lg border border-zinc-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition ${
                    fieldErrors.github ? 'border-red-500/50' : ''
                  }`}
                  placeholder="https://github.com/username"
                />
                {fieldErrors.github && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.github}</p>
                )}
              </div>

              {/* Twitter URL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Twitter/X URL <span className="text-zinc-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  className={`w-full rounded-lg border border-zinc-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition ${
                    fieldErrors.twitter ? 'border-red-500/50' : ''
                  }`}
                  placeholder="https://twitter.com/username"
                />
                {fieldErrors.twitter && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.twitter}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Bio <span className="text-zinc-500 text-xs">(Optional - internal use only)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className={`w-full rounded-lg border border-zinc-400/20 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition resize-none ${
                  fieldErrors.bio ? 'border-red-500/50' : ''
                }`}
                placeholder="Extended bio for internal use only (not shown on public page)"
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {formData.bio.length}/2000 characters
              </p>
              {fieldErrors.bio && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg border border-zinc-700 bg-zinc-900/50">
          <input
            id="mentor-active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-cyan-400 focus:ring-cyan-400"
          />
          <label htmlFor="mentor-active" className="text-sm text-zinc-300 cursor-pointer">
            Active - Show on mentorship page
          </label>
          <p className="text-xs text-zinc-500 ml-auto">
            If unchecked, mentor will not appear on the mentorship page
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-6 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-900"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
                Registering Mentor...
              </span>
            ) : (
              'Register Mentor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
