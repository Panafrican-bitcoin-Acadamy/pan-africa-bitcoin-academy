'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import SplitText from '@/components/SplitText';
import { DatePicker } from '@/components/ui/DatePicker';
import { sortedCountries, getPhoneRule, type Country } from '@/lib/countries';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { inputStyles, labelStyles, formStyles, buttonStyles, cardStyles, alertStyles, cn } from '@/lib/styles';
import { FormGrid } from '@/components/ui';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Cohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  sessions: number;
  level: string;
  seats: number;
  available: number;
  enrolled: number;
}


export default function ApplyPage() {
  const router = useRouter();
  const { isAuthenticated, profile, isRegistered, loading: authLoading } = useAuth();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [cohortsError, setCohortsError] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Show loading spinner overlay when submitting
  useEffect(() => {
    if (submitting) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [submitting]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (codeDropdownRef.current && !codeDropdownRef.current.contains(e.target as Node)) {
        setCodeDropdownOpen(false);
        setCodeSearch("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate carousel transform value accounting for gaps
  // Container has padding (px-2 sm:px-4), so cards fit within padded area
  const getCarouselTransform = () => {
    if (itemsPerView === 1) {
      // For single item: card is 100% width, move by card width
      return `translateX(calc(-${carouselIndex} * 100%))`;
    }
    // For multiple items:
    // Card widths: 100% for mobile, calc(50% - 0.5rem) for sm, calc(33.333% - 0.67rem) for lg
    // Move distance per step = cardWidth + gap
    // For 2 items: (50% - 0.5rem) + 1rem = 50% + 0.5rem, but we need to account for the percentage
    // Since gap is 1rem and we're working in percentages, we use: (100% + gap) / itemsPerView
    // But gap is fixed (1rem), so we approximate: cardWidth + gap ≈ (100% + gap) / itemsPerView
    return `translateX(calc(-${carouselIndex} * ((100% + 1rem) / ${itemsPerView})))`;
  };

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3);
      } else if (window.innerWidth >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Reset carousel index when items per view or cohorts change
  useEffect(() => {
    const maxIndex = Math.max(0, cohorts.length - itemsPerView);
    if (carouselIndex > maxIndex) {
      setCarouselIndex(Math.max(0, maxIndex));
    }
  }, [itemsPerView, cohorts.length, carouselIndex]);

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const maxIndex = Math.max(0, cohorts.length - itemsPerView);
      setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
    }
    
    if (isRightSwipe) {
      setCarouselIndex((prev) => Math.max(0, prev - 1));
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Redirect enrolled students away from the apply flow
  useEffect(() => {
    if (!authLoading && isAuthenticated && isRegistered) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, isRegistered, router]);

  // Mouse drag handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setTouchEnd(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const maxIndex = Math.max(0, cohorts.length - itemsPerView);
      setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
    }
    
    if (isRightSwipe) {
      setCarouselIndex((prev) => Math.max(0, prev - 1));
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const codeDropdownRef = useRef<HTMLDivElement>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    experienceLevel: "",
    preferredCohort: "",
    birthDate: "",
    preferredLanguage: "",
  });

  // Pre-fill form data from profile if user is logged in (only once when profile loads)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // Only pre-fill if user is authenticated and profile exists
    if (!isAuthenticated || !profile) return;
    
    // Check if form is already filled (avoid re-filling if user has started typing)
    const isFormEmpty = !formData.firstName && !formData.lastName && !formData.email;
    if (!isFormEmpty) return; // Don't overwrite user input
    
    console.log('Pre-filling form with profile data:', profile);
    
    // Split name into first and last name
    const nameParts = profile.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Determine country from phone or use profile country
    let countryToSet = profile.country || '';
    let countryCodeToSet = '';
    let phoneNumberToSet = '';
    
    // Pre-fill phone if exists
    if (profile.phone) {
      // Extract country code and number from phone (format: "+234 1234567890")
      const phoneParts = profile.phone.split(' ');
      if (phoneParts.length >= 2) {
        const code = phoneParts[0];
        const number = phoneParts.slice(1).join(' ');
        countryCodeToSet = code;
        phoneNumberToSet = number;
        // Try to find country from code
        const country = sortedCountries.find(c => c.code === code);
        if (country) {
          countryToSet = country.name;
        }
      } else {
        phoneNumberToSet = profile.phone;
      }
    }

    // Set phone-related state
    if (countryCodeToSet) setSelectedCountryCode(countryCodeToSet);
    if (phoneNumberToSet) setPhoneNumber(phoneNumberToSet);
    if (countryToSet) setSelectedCountry(countryToSet);

    // Pre-fill form with profile data
    setFormData({
      firstName: firstName,
      lastName: lastName,
      email: profile.email || '',
      phone: profile.phone || '',
      country: countryToSet,
      city: profile.city || '',
      experienceLevel: '',
      preferredCohort: '',
      birthDate: '',
      preferredLanguage: '',
    });
  }, [authLoading, isAuthenticated, profile]); // Only depend on auth state, not form state

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setPhoneError(null);
    const countryData = sortedCountries.find((c) => c.name === country);
    // Auto-fill country code if country is selected
    if (countryData) {
      setSelectedCountryCode(countryData.code);
    }
    // Update form data with country
    setFormData({ ...formData, country });
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    setPhoneError(null);
    const fullPhone = code && phoneNumber ? `${code} ${phoneNumber}`.trim() : phoneNumber;
    setFormData({ ...formData, phone: fullPhone });
    if (phoneNumber.replace(/\D/g, '').length > 0) {
      validateWhatsAppNumber(code, phoneNumber, false);
    }
  };

  const validateWhatsAppNumber = (code: string, number: string, strict = false) => {
    const digits = number.replace(/\D/g, '');
    if (!code || digits.length === 0) {
      setPhoneError(null);
      setPhoneValid(false);
      return;
    }
    const cleanCode = code.replace(/[^+\d]/g, '');
    const fullNumber = `${cleanCode}${digits}`;
    try {
      if (isValidPhoneNumber(fullNumber)) {
        const parsed = parsePhoneNumber(fullNumber);
        if (parsed) {
          setPhoneError(null);
          setPhoneValid(true);
          setFormData(prev => ({ ...prev, phone: parsed.formatInternational() }));
          return;
        }
      }
      setPhoneValid(false);
      const { max } = getPhoneRule(selectedCountry);
      if (digits.length > max) {
        setPhoneError(`Number too long — max ${max} digits for ${selectedCountry || 'this country'}.`);
      } else if (strict) {
        setPhoneError(`Invalid WhatsApp number for ${selectedCountry || 'this country'}. Please check and try again.`);
      } else {
        setPhoneError(null);
      }
    } catch {
      setPhoneError(null);
      setPhoneValid(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleanedValue);

    const fullPhone = selectedCountryCode && cleanedValue ? `${selectedCountryCode} ${cleanedValue}`.trim() : cleanedValue;
    setFormData({ ...formData, phone: fullPhone });

    validateWhatsAppNumber(selectedCountryCode, cleanedValue, false);
  };

  const handlePhoneBlur = () => {
    if (phoneNumber.replace(/\D/g, '').length > 0 && selectedCountryCode) {
      validateWhatsAppNumber(selectedCountryCode, phoneNumber, true);
    }
  };

  // Fetch cohorts from API (no cache so seat counts stay correct after approvals)
  const fetchCohorts = useCallback(async (retryAfter429 = true) => {
    try {
      setCohortsLoading(true);
      setCohortsError(null);
      const res = await fetch('/api/cohorts', { cache: 'no-store' });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retryAfter = data.retryAfter ?? 60;
        setCohortsError(`Too many requests. Retrying in ${retryAfter} seconds…`);
        if (retryAfter429) {
          setTimeout(() => fetchCohorts(false), retryAfter * 1000);
          return;
        }
        throw new Error('Too many requests. Please wait a moment and refresh the page.');
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch cohorts: ${res.status}`);
      }
      const data = await res.json();

      const formatDate = (dateStr: string) => {
        if (!dateStr) return 'TBD';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        } catch {
          return dateStr;
        }
      };

      const formattedCohorts: Cohort[] = (data.cohorts || []).map((cohort: any) => ({
        id: cohort.id,
        name: cohort.name || 'Unnamed Cohort',
        startDate: formatDate(cohort.startDate),
        endDate: formatDate(cohort.endDate),
        status: cohort.status || '',
        sessions: cohort.sessions || 0,
        level: cohort.level || 'Beginner',
        seats: cohort.seats || 0,
        available: cohort.available || 0,
        enrolled: cohort.enrolled || 0,
      }));

      setCohorts(formattedCohorts);
    } catch (err: any) {
      console.error('Error fetching cohorts:', err);
      setCohortsError(err.message || 'Failed to load cohorts');
      setCohorts([]);
    } finally {
      setCohortsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  // Refetch when tab/window gains focus so returning from admin shows updated seat counts
  useEffect(() => {
    const onFocus = () => fetchCohorts();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCohorts]);

  // Helper function to normalize cohort level to match select option values
  const normalizeLevel = (level: string | undefined): string => {
    if (!level) return '';
    const normalized = level.trim().toLowerCase();
    // Map common variations to exact select values
    if (normalized === 'beginner') return 'beginner';
    if (normalized === 'intermediate') return 'intermediate';
    if (normalized === 'advanced') return 'advanced';
    return normalized;
  };

  // Auto-fill preferred cohort and experience level when a cohort is selected
  useEffect(() => {
    if (selectedCohort !== null) {
      const cohort = cohorts.find((c) => c.id === selectedCohort);
      if (cohort) {
        // Update preferredCohort and experienceLevel to match the selected cohort
        const normalizedLevel = normalizeLevel(cohort.level);
        console.log('Setting experience level:', normalizedLevel, 'from cohort level:', cohort.level);
        setFormData((prev) => ({
          ...prev,
          preferredCohort: cohort.id,
          experienceLevel: normalizedLevel,
        }));
      }
    } else {
      // If no cohort is selected, clear the experience level
      setFormData((prev) => ({
        ...prev,
        experienceLevel: '',
      }));
    }
  }, [selectedCohort, cohorts]);

  const selectedCohortData = selectedCohort ? cohorts.find((c) => c.id === selectedCohort) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);
    setPhoneError(null);

    if (!selectedCountry) {
      setSubmitError('Please select your country.');
      setPhoneError('Please select your country.');
      setSubmitting(false);
      return;
    }
    if (!selectedCountryCode) {
      setSubmitError('Please choose your country code.');
      setPhoneError('Please choose your country code.');
      setSubmitting(false);
      return;
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length === 0) {
      setSubmitError('Please enter your WhatsApp number.');
      setPhoneError('Please enter your WhatsApp number.');
      setSubmitting(false);
      return;
    }

    const cleanCode = selectedCountryCode.replace(/[^+\d]/g, '');
    const fullNumber = `${cleanCode}${phoneDigits}`;
    if (!isValidPhoneNumber(fullNumber)) {
      const msg = `Invalid WhatsApp number for ${selectedCountry}. Please check the number and try again.`;
      setSubmitError(msg);
      setPhoneError(msg);
      setSubmitting(false);
      return;
    }
    
    // The phone number is already combined in formData.phone via handlePhoneChange
    const selectedCohortObj = selectedCohort ? cohorts.find((c) => c.id === selectedCohort) : null;
    
    // Validate that the selected cohort is not full
    if (selectedCohortObj && selectedCohortObj.available === 0) {
      setSubmitError('This cohort is full. Please select a different cohort.');
      setSubmitting(false);
      return;
    }
    
    const cohortNumber = selectedCohortObj ? selectedCohortObj.id : null;
    
    const finalFormData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(), // Combine first and last name
      country: selectedCountry,
      birthDate: birthDate || null,
      phone: (() => {
        try {
          const parsed = parsePhoneNumber(`${cleanCode}${phoneDigits}`);
          return parsed ? parsed.formatInternational() : `${selectedCountryCode} ${phoneNumber}`.trim();
        } catch { return `${selectedCountryCode} ${phoneNumber}`.trim(); }
      })(),
      preferredCohort: cohortNumber, // Add preferredCohort (cohort ID) to the request
      preferredLanguage: formData.preferredLanguage || null, // Include preferred language
    };

    try {
      const applicationRes = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });

      const result = await applicationRes.json();

      if (applicationRes.ok) {
        // Check if verification email was sent (new profile created)
        if (result.verificationEmailSent) {
          setSubmitSuccess('Application submitted successfully! Please check your email to verify your address. We will review your application and get back to you soon.');
        } else {
          setSubmitSuccess('Application submitted successfully! We will review and get back to you soon.');
        }
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          country: "",
          city: "",
          experienceLevel: "",
          preferredCohort: "",
          birthDate: "",
          preferredLanguage: "",
        });
        setSelectedCountry("");
        setSelectedCountryCode("");
        setPhoneNumber("");
        setSelectedCohort(null);
        setBirthDate("");
      } else {
        // Handle specific error cases
        if (result.hasProfile && result.needsSignIn) {
          setSubmitError(
            'An account with this email already exists. Please sign in to access your account. If you forgot your password, use the "Forgot Password" option.'
          );
        } else if (result.hasProfile && result.needsPassword) {
          setSubmitError(
            'Your application was already approved! Please set up your password to complete registration.'
          );
        } else {
          // Show detailed error message if available
          const errorMsg = result.error || 'Failed to submit application';
          const errorDetails = result.details ? ` (${result.details})` : '';
          throw new Error(errorMsg + errorDetails);
        }
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      console.error('Full error object:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {submitting && <LoadingSpinner overlay />}
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center w-full">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                <SplitText
                  text="Join our Program"
                  tag="span"
                  className="inline-block"
                  delay={50}
                  duration={1.25}
                  ease="bounce.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                />
              </h1>
              <p className="w-full mt-6 text-lg text-zinc-400 sm:text-xl sm:max-w-3xl sm:mx-auto">
                Apply to join the Pan-Africa Bitcoin Academy and <b>start</b> your journey toward financial sovereignty.
              </p>
            </div>
          </AnimatedSection>

      <div className="space-y-12">
        {/* Cohort Details */}
        <AnimatedSection animation="slideLeft">
          <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Upcoming Cohorts</h2>
          {cohortsLoading ? (
            <div className="text-center py-8 text-cyan-400">Loading cohorts...</div>
          ) : cohortsError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-red-300">
              {cohortsError}
            </div>
          ) : cohorts.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No upcoming cohorts available at this time.</div>
          ) : (
          <div className="relative">
            {/* Carousel Container */}
            <div 
              className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none px-2 sm:px-4"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
            >
              <div 
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-out gap-4 py-2"
                style={{
                  transform: getCarouselTransform(),
                  pointerEvents: isDragging ? 'none' : 'auto',
                }}
              >
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className={cn(
                      "min-w-0 flex-shrink-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.67rem)] p-6 transition",
                      selectedCohort === cohort.id ? cardStyles.selected : cardStyles.base
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-zinc-50">{cohort.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        cohort.level?.toLowerCase() === 'beginner' 
                          ? 'bg-blue-500/20 text-blue-300'
                          : cohort.level?.toLowerCase() === 'intermediate'
                          ? 'bg-orange-500/20 text-orange-300'
                          : cohort.level?.toLowerCase() === 'advanced'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {cohort.level}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-300">
                      <p><span className="font-medium text-zinc-400">Start:</span> {cohort.startDate}</p>
                      <p><span className="font-medium text-zinc-400">End:</span> {cohort.endDate}</p>
                      {cohort.status && (
                        <p><span className="font-medium text-zinc-400">Status:</span> {cohort.status}</p>
                      )}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-2">
                          <span className="text-xs text-zinc-400">Sessions</span>
                          <span className="font-semibold text-cyan-400">
                            {cohort.sessions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-orange-400/20 bg-zinc-900/50 p-2">
                          <span className="text-xs text-zinc-400">Seats Available</span>
                          <span className={`font-semibold ${cohort.available > 0 ? "text-orange-400" : "text-red-400"}`}>
                            {cohort.available} / {cohort.seats}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (cohort.available === 0) return; // Prevent selection if full
                        console.log('Cohort selected:', cohort.id, cohort.name);
                        setSelectedCohort(cohort.id);
                        const normalizedLevel = normalizeLevel(cohort.level);
                        setFormData((prev) => ({
                          ...prev,
                          preferredCohort: cohort.id,
                          experienceLevel: normalizedLevel,
                        }));
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      disabled={cohort.available === 0}
                      className={cn(
                        "mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition",
                        cohort.available === 0
                          ? "cursor-not-allowed opacity-50 bg-zinc-800/50 border border-zinc-700 text-zinc-500"
                          : selectedCohort === cohort.id 
                            ? buttonStyles.selected 
                            : buttonStyles.outline
                      )}
                    >
                      {cohort.available === 0 
                        ? "Full - Not Available" 
                        : selectedCohort === cohort.id 
                          ? "Selected" 
                          : "Select Cohort"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCarouselIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={carouselIndex === 0}
                className={`rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 transition ${
                  carouselIndex === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-800 text-zinc-300'
                }`}
                aria-label="Previous cohort"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Dots Indicator */}
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(cohorts.length / itemsPerView) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCarouselIndex(index)}
                    className={`h-2 rounded-full transition ${
                      carouselIndex === index
                        ? 'w-8 bg-cyan-400'
                        : 'w-2 bg-zinc-600 hover:bg-zinc-500'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  const maxIndex = Math.max(0, cohorts.length - itemsPerView);
                  setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
                }}
                disabled={carouselIndex >= Math.max(0, cohorts.length - itemsPerView)}
                className={`rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 transition ${
                  carouselIndex >= Math.max(0, cohorts.length - itemsPerView)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-800 text-zinc-300'
                }`}
                aria-label="Next cohort"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          )}
          </section>
        </AnimatedSection>

        {/* Registration Form */}
        <AnimatedSection animation="slideRight">
          <section className="rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-zinc-900/90 to-black/90 p-6 sm:p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/10">
          <h2 className="mb-2 text-xl font-semibold text-cyan-200">Application Form</h2>
          <p className="mb-6 text-sm text-zinc-400">Fill in your details to join the next cohort.</p>
          {submitSuccess && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            {/* First Name and Last Name */}
            <FormGrid>
              <div>
                <label htmlFor="firstName" className={labelStyles.required}>
                  First Name <span className={labelStyles.requiredStar}>*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text"
                  placeholder="Micheal"
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelStyles.required}>
                  Last Name <span className={labelStyles.requiredStar}>*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text"
                  placeholder="Jordan"
                />
              </div>
            </FormGrid>

            {/* Email, Phone, Birth Date, Language */}
            <FormGrid>
              <div>
                <label htmlFor="email" className={labelStyles.required}>
                  Email <span className={labelStyles.requiredStar}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputStyles.base}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelStyles.required}>
                  WhatsApp Number <span className={labelStyles.requiredStar}>*</span>
                </label>
                <div className="flex gap-2 w-full">
                  {/* Searchable country code dropdown */}
                  <div ref={codeDropdownRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => { setCodeDropdownOpen(!codeDropdownOpen); setCodeSearch(""); }}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-zinc-950 px-2.5 py-2.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-pointer hover:border-cyan-400/50 transition min-w-[90px]"
                      aria-label="Country code"
                    >
                      {selectedCountryCode ? (
                        <>
                          <span>{sortedCountries.find(c => c.code === selectedCountryCode)?.flag}</span>
                          <span className="font-mono text-xs">{selectedCountryCode}</span>
                          <svg className="h-3 w-3 text-zinc-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                        </>
                      ) : (
                        <>
                          <span className="text-zinc-500 text-xs">Code</span>
                          <svg className="h-3 w-3 text-zinc-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                        </>
                      )}
                    </button>

                    {codeDropdownOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-cyan-400/30 bg-zinc-950 shadow-xl shadow-black/50 overflow-hidden">
                        <div className="p-2 border-b border-zinc-800">
                          <input
                            type="text"
                            value={codeSearch}
                            onChange={(e) => setCodeSearch(e.target.value)}
                            placeholder="Search country..."
                            autoFocus
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {sortedCountries
                            .filter(c => {
                              if (!codeSearch) return true;
                              const q = codeSearch.toLowerCase();
                              return c.name.toLowerCase().includes(q) || c.code.includes(q);
                            })
                            .map((country) => (
                              <button
                                key={country.name}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryCode(country.code);
                                  setSelectedCountry(country.name);
                                  setFormData(prev => ({ ...prev, country: country.name }));
                                  setPhoneError(null);
                                  setCodeDropdownOpen(false);
                                  setCodeSearch("");
                                  if (phoneNumber.replace(/\D/g, '').length > 0) {
                                    validateWhatsAppNumber(country.code, phoneNumber, false);
                                  }
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-cyan-500/10 ${selectedCountryCode === country.code ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-300'}`}
                              >
                                <span className="text-base">{country.flag}</span>
                                <span className="flex-1 truncate">{country.name}</span>
                                <span className="font-mono text-xs text-zinc-500">{country.code}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel-national"
                      required
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      maxLength={15}
                      className={`${inputStyles.phone} ${phoneValid ? 'border-green-500/50 focus:border-green-500/60 focus:ring-green-500/20' : ''} ${phoneError ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20' : ''} pr-9`}
                      placeholder="7 1234 5678"
                      aria-describedby={phoneError ? "phone-error" : undefined}
                    />
                    {phoneValid && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                      </span>
                    )}
                    {phoneError && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </span>
                    )}
                  </div>
                </div>
                {phoneError && (
                  <p id="phone-error" className="mt-1 text-xs text-red-300" role="alert">{phoneError}</p>
                )}
                {phoneValid && (
                  <p className="mt-1 text-xs text-green-400/80">Valid WhatsApp number</p>
                )}
              </div>
              <DatePicker
                label="Birth Date"
                value={formData.birthDate}
                onChange={(v) => {
                  setBirthDate(v);
                  setFormData({ ...formData, birthDate: v });
                }}
                placeholder="Select your birth date"
                required
                maxDate={new Date()}
                inputClassName="border-cyan-400/30 bg-zinc-950 focus:border-cyan-400/50 focus:ring-cyan-400/20"
              />
              <div>
                <label htmlFor="preferredLanguage" className={labelStyles.required}>
                  Preferred Language <span className={labelStyles.requiredStar}>*</span>
                </label>
                <select
                  id="preferredLanguage"
                  required
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className={inputStyles.select}
                  aria-label="Preferred language"
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select language</option>
                  <option value="english" className="bg-zinc-950 text-zinc-50">English</option>
                  <option value="tigrigna" className="bg-zinc-950 text-zinc-50">Tigrinya (ትግርኛ)</option>
                </select>
              </div>
            </FormGrid>

            {/* Country and City */}
            <FormGrid>
              <div>
                <label htmlFor="country" className={labelStyles.required}>
                  Country <span className={labelStyles.requiredStar}>*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  required
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className={inputStyles.select}
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select your country</option>
                  {sortedCountries.map((country) => (
                    <option key={country.name} value={country.name} className="bg-zinc-950 text-zinc-50">
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className={labelStyles.required}>City <span className="text-zinc-500 text-xs">(optional)</span></label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputStyles.optional}
                  placeholder="Asmara"
                />
              </div>
            </FormGrid>

            {/* Experience Level and Preferred Cohort */}
            <FormGrid>
              <div>
                <label htmlFor="experienceLevel" className={labelStyles.required}>
                  Experience Level <span className={labelStyles.requiredStar}>*</span>
                </label>
                <select
                  id="experienceLevel"
                  required
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className={inputStyles.selectWithValue(!!formData.experienceLevel)}
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select your level</option>
                  <option 
                    value="beginner" 
                    className={`bg-zinc-950 ${
                      formData.experienceLevel === 'beginner' ? 'text-green-400' : 'text-zinc-50'
                    }`}
                  >
                    Beginner - New to Bitcoin
                  </option>
                  <option 
                    value="intermediate" 
                    className={`bg-zinc-950 ${
                      formData.experienceLevel === 'intermediate' ? 'text-green-400' : 'text-zinc-50'
                    }`}
                  >
                    Intermediate - Some knowledge
                  </option>
                  <option 
                    value="advanced" 
                    className={`bg-zinc-950 ${
                      formData.experienceLevel === 'advanced' ? 'text-green-400' : 'text-zinc-50'
                    }`}
                  >
                    Advanced - Experienced user
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="preferredCohort" className={labelStyles.required}>
                  Preferred Cohort <span className={labelStyles.requiredStar}>*</span>
                </label>
                <select
                  id="preferredCohort"
                  required
                  value={formData.preferredCohort}
                  onChange={(e) => {
                    const cohortId = e.target.value;
                    const selectedCohortObj = cohorts.find((c) => c.id === cohortId);
                    const normalizedLevel = normalizeLevel(selectedCohortObj?.level);
                    setFormData({ 
                      ...formData, 
                      preferredCohort: cohortId,
                      experienceLevel: normalizedLevel
                    });
                    setSelectedCohort(cohortId || null);
                  }}
                  className={cn(inputStyles.select, formData.preferredCohort ? 'text-green-400' : 'text-zinc-50')}
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select a cohort</option>
                  {cohorts.map((cohort) => (
                    <option 
                      key={cohort.id} 
                      value={cohort.id}
                      disabled={cohort.available === 0}
                      className={`bg-zinc-950 ${
                        cohort.available === 0
                          ? 'text-zinc-600 cursor-not-allowed'
                          : formData.preferredCohort === cohort.id.toString() 
                            ? 'text-green-400' 
                            : 'text-zinc-50'
                      }`}
                    >
                      {cohort.name} ({cohort.available === 0 ? 'Full' : `${cohort.available} seats available`})
                    </option>
                  ))}
                </select>
              </div>
            </FormGrid>

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-cyan-300">Note:</span> We'll review and get back to you within 3-5 business days.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[48px] min-w-[180px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-8 py-3.5 text-base font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:from-cyan-400 disabled:hover:to-cyan-500"
              >
                {submitting ? 'Submitting...' : 'Register'}
              </button>
            </div>
          </form>
          </section>
        </AnimatedSection>
      </div>
        </div>
      </div>
    </div>
  );
}
