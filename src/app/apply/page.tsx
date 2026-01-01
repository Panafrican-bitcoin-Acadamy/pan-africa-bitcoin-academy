'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { sortedCountries, getPhoneRule, type Country } from '@/lib/countries';
import { inputStyles, labelStyles, formStyles, buttonStyles, cardStyles, alertStyles, cn } from '@/lib/styles';
import { FormGrid } from '@/components/ui';

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
  const [birthDate, setBirthDate] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    // Update phone number in form data
    const fullPhone = code && phoneNumber ? `${code} ${phoneNumber}`.trim() : phoneNumber;
    setFormData({ ...formData, phone: fullPhone });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and spaces
    const cleanedValue = value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleanedValue);
    
    // Combine with selected country code for form data
    const fullPhone = selectedCountryCode && cleanedValue ? `${selectedCountryCode} ${cleanedValue}`.trim() : cleanedValue;
    setFormData({ ...formData, phone: fullPhone });

    // Live validate digits against country rule
    if (selectedCountry) {
      const digits = cleanedValue.replace(/\D/g, '');
      const { min, max } = getPhoneRule(selectedCountry);
      if (digits.length > 0 && (digits.length < min || digits.length > max)) {
        setPhoneError(`Needs ${min}${min !== max ? `-${max}` : ''} digits for ${selectedCountry} (excluding country code).`);
      } else {
        setPhoneError(null);
      }
    }
  };

  // Fetch cohorts from Supabase
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        setCohortsLoading(true);
        setCohortsError(null);
        const res = await fetch('/api/cohorts');
        if (!res.ok) {
          throw new Error(`Failed to fetch cohorts: ${res.status}`);
        }
        const data = await res.json();
        
        // Format dates and transform data
        const formatDate = (dateStr: string) => {
          if (!dateStr) return 'TBD';
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
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
        // Fallback to empty array
        setCohorts([]);
      } finally {
        setCohortsLoading(false);
      }
    };
    
    fetchCohorts();
  }, []);

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

    // Validate phone length based on country rules
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    const { min, max } = getPhoneRule(selectedCountry);
    
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
    if (phoneDigits.length < min || phoneDigits.length > max) {
      const msg = `Phone number should have ${min}${min !== max ? `-${max}` : ''} digits for ${selectedCountry}.`;
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
      phone: `${selectedCountryCode} ${phoneNumber}`.trim(),
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
        setSubmitSuccess('Application submitted successfully! We will review and get back to you soon.');
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
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center w-full">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Apply to PanAfrican Bitcoin Academy - Join Bitcoin Education Program
              </h1>
              <p className="w-full mt-6 text-lg text-zinc-400 sm:text-xl sm:max-w-3xl sm:mx-auto">
                Apply to join the Pan-Africa Bitcoin Academy and start your journey toward financial sovereignty.
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
          <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <h2 className="mb-6 text-xl font-semibold text-cyan-200">Application Form</h2>
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
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-zinc-300">
                  First Name <span className="text-red-400">*</span>
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
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-zinc-300">
                  Last Name <span className="text-red-400">*</span>
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
                  placeholder="Doe"
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
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-300">
                  Phone <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 w-full">
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
                    className="flex-shrink-0 rounded-lg border border-cyan-400/30 bg-zinc-950 px-2 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                    style={{ minWidth: '80px', maxWidth: '100px' }}
                    title={selectedCountryCode ? sortedCountries.find(c => c.code === selectedCountryCode)?.name : "Select country code"}
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">Code</option>
                    {sortedCountries.map((country) => (
                      <option key={country.code} value={country.code} className="bg-zinc-950 text-zinc-50">
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel-national"
                    required
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={selectedCountry ? getPhoneRule(selectedCountry).max : 13}
                    className={inputStyles.phone}
                    placeholder="1234567890"
                    aria-describedby={phoneError ? "phone-error" : selectedCountry ? "phone-help" : undefined}
                  />
                </div>
                {phoneError && (
                  <p id="phone-error" className="mt-1 text-xs text-red-300" role="alert">{phoneError}</p>
                )}
              </div>
              <div>
                <label htmlFor="birthDate" className={labelStyles.required}>
                  Birth Date <span className={labelStyles.requiredStar}>*</span>
                </label>
                <div className="relative">
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    autoComplete="bday"
                    required
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setFormData({ ...formData, birthDate: e.target.value });
                    }}
                    className={inputStyles.date}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('birthDate') as HTMLInputElement;
                      if (input) {
                        if (typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.focus();
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-400 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                    aria-label="Open calendar"
                    title="Choose date from calendar"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select</option>
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
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2.5 text-base sm:text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 cursor-text"
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
                <label htmlFor="city" className={labelStyles.base}>City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputStyles.optional}
                  placeholder="Lagos"
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

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs text-zinc-400">
                <span className="font-semibold text-orange-300">Note:</span> We'll review and get back to you within 3-5 business days.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition ${
                  submitting ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'
                }`}
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
