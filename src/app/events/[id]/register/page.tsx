'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/PageContainer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { validateAndNormalizeEmail, sanitizeName, isValidPhone } from '@/lib/validation';
import { sortedCountries, getPhoneRule, type Country } from '@/lib/countries';

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  location: string | null;
  event_date: string | null;
  is_registration_enabled: boolean;
  cohort_id: string | null;
  form_config: any;
  max_registrations: number | null;
  registration_deadline: string | null;
}

interface FormField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    additional_data: {} as Record<string, any>,
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<FormField[]>([]);

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Event not found');
          } else {
            setError('Failed to load event details');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        const eventData = data.event;

        // Check if event is cohort-based
        if (eventData.cohort_id) {
          setError('This event is for cohort members only. Registration is not available.');
          setLoading(false);
          return;
        }

        // Check if registration is enabled
        if (!eventData.is_registration_enabled) {
          setError('Registration is not enabled for this event.');
          setLoading(false);
          return;
        }

        // Check registration deadline
        if (eventData.registration_deadline) {
          const deadline = new Date(eventData.registration_deadline);
          if (new Date() > deadline) {
            setError('Registration deadline has passed.');
            setLoading(false);
            return;
          }
        }

        setEvent(eventData);

        // Parse custom form fields from form_config
        if (eventData.form_config && eventData.form_config.fields) {
          setCustomFields(eventData.form_config.fields);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const country = sortedCountries.find(c => c.code === code);
    setSelectedCountry(country || null);
    setWhatsappError(null);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, spaces, hyphens, and parentheses
    const cleanedValue = value.replace(/[^\d\s\-\(\)]/g, '');
    
    setFormData((prev) => ({
      ...prev,
      whatsapp: cleanedValue,
    }));

    // Clear errors
    setWhatsappError(null);
    if (formErrors.whatsapp) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.whatsapp;
        return newErrors;
      });
    }

    // Validate length if country is selected
    if (selectedCountry && cleanedValue) {
      const digitsOnly = cleanedValue.replace(/\D/g, '');
      const { min, max } = getPhoneRule(selectedCountry.name);
      if (digitsOnly.length < min || digitsOnly.length > max) {
        setWhatsappError(`Needs ${min}${min !== max ? `-${max}` : ''} digits for ${selectedCountry.name} (excluding country code).`);
      }
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      additional_data: {
        ...prev.additional_data,
        [fieldName]: value,
      },
    }));
    // Clear error for this field
    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate full name
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else {
      const sanitized = sanitizeName(formData.full_name, 100);
      if (sanitized.length < 2) {
        errors.full_name = 'Full name must be at least 2 characters';
      }
    }

    // Validate email
    const emailValidation = validateAndNormalizeEmail(formData.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error || 'Invalid email';
    }

    // Validate WhatsApp (optional)
    if (formData.whatsapp) {
      if (!selectedCountryCode) {
        errors.whatsapp = 'Please select a country code';
      } else if (selectedCountry) {
        const digitsOnly = formData.whatsapp.replace(/\D/g, '');
        const { min, max } = getPhoneRule(selectedCountry.name);
        if (digitsOnly.length < min || digitsOnly.length > max) {
          errors.whatsapp = `WhatsApp number should have ${min}${min !== max ? `-${max}` : ''} digits for ${selectedCountry.name}.`;
        }
      } else if (!isValidPhone(formData.whatsapp)) {
        errors.whatsapp = 'Invalid WhatsApp number';
      }
    }

    // Validate custom fields
    customFields.forEach((field) => {
      if (field.required) {
        const value = formData.additional_data[field.name];
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: sanitizeName(formData.full_name, 100),
          email: validateAndNormalizeEmail(formData.email).normalized,
          phone: formData.whatsapp && selectedCountryCode 
            ? `${selectedCountryCode} ${formData.whatsapp}`.trim() 
            : null,
          additional_data: Object.keys(formData.additional_data).length > 0 ? formData.additional_data : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (error && !event) {
    return (
      <PageContainer title="Registration Error">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-orange-500/20 px-6 py-3 text-base font-semibold text-orange-300 transition hover:bg-orange-500/30"
          >
            Return to Homepage
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer title="Registration Successful!">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="text-2xl font-semibold text-green-300 mb-4">
            You're Registered!
          </h2>
          <p className="text-zinc-300 mb-6">
            Thank you for registering for <strong>{event?.name}</strong>. We'll send you a confirmation email shortly.
          </p>
          <p className="text-sm text-zinc-400 mb-6">
            Redirecting to homepage...
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-green-500/20 px-6 py-3 text-base font-semibold text-green-300 transition hover:bg-green-500/30"
          >
            Return to Homepage
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <PageContainer
      title={`Register for ${event.name}`}
      subtitle={event.description || undefined}
    >
      <div className="max-w-2xl mx-auto">
        {/* Event Info Card */}
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 mb-6">
          <div className="space-y-2">
            {event.location && (
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500">📍</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.start_time && (
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500">📅</span>
                <span>{new Date(event.start_time).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
              </div>
            )}
            {event.max_registrations && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <span>👥</span>
                <span>Limited to {event.max_registrations} registrations</span>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300 mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="Enter your full name"
              required
            />
            {formErrors.full_name && (
              <p className="mt-1 text-sm text-red-400">{formErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="your.email@example.com"
              required
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-zinc-300 mb-2">
              WhatsApp Number <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <label htmlFor="countryCode" className="sr-only">
                Country Code
              </label>
              <select
                id="countryCode"
                name="countryCode"
                autoComplete="tel-country-code"
                value={selectedCountryCode}
                onChange={handleCountryCodeChange}
                aria-label="Country code"
                className="flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-3 text-sm text-zinc-50 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
                style={{ minWidth: '100px', maxWidth: '120px' }}
                title={selectedCountryCode ? sortedCountries.find(c => c.code === selectedCountryCode)?.name : "Select country code"}
              >
                <option value="" className="bg-zinc-950 text-zinc-400">Code</option>
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.code} className="bg-zinc-950 text-zinc-50">
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              
              {/* WhatsApp Number Input */}
              <div className="flex-1">
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  autoComplete="tel-national"
                  value={formData.whatsapp}
                  onChange={handleWhatsappChange}
                  className={`w-full rounded-lg border bg-zinc-900/50 px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                    formErrors.whatsapp || whatsappError ? 'border-red-500/50' : 'border-zinc-700'
                  }`}
                  placeholder={selectedCountry 
                    ? `Enter ${selectedCountry.name} number` 
                    : "Select country code first"}
                  maxLength={selectedCountry ? getPhoneRule(selectedCountry.name).max + 5 : 15}
                  disabled={!selectedCountryCode}
                />
                {(formErrors.whatsapp || whatsappError) && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.whatsapp || whatsappError}</p>
                )}
                {selectedCountry && !whatsappError && !formErrors.whatsapp && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {getPhoneRule(selectedCountry.name).min}{getPhoneRule(selectedCountry.name).min !== getPhoneRule(selectedCountry.name).max ? `-${getPhoneRule(selectedCountry.name).max}` : ''} digits (excluding country code)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-zinc-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400"> *</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  value={formData.additional_data[field.name] || ''}
                  onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-50 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  value={formData.additional_data[field.name] || ''}
                  onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder={field.placeholder}
                  rows={4}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : 'text'}
                  id={field.name}
                  value={formData.additional_data[field.name] || ''}
                  onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              {formErrors[field.name] && (
                <p className="mt-1 text-sm text-red-400">{formErrors[field.name]}</p>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Register for Event'}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-base font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

