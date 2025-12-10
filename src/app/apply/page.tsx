'use client';

import { useState, useEffect } from "react";

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

const africanCountries = [
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿" },
  { name: "Uganda", code: "+256", flag: "🇺🇬" },
  { name: "Algeria", code: "+213", flag: "🇩🇿" },
  { name: "Morocco", code: "+212", flag: "🇲🇦" },
  { name: "Angola", code: "+244", flag: "🇦🇴" },
  { name: "Mozambique", code: "+258", flag: "🇲🇿" },
  { name: "Madagascar", code: "+261", flag: "🇲🇬" },
  { name: "Cameroon", code: "+237", flag: "🇨🇲" },
  { name: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { name: "Niger", code: "+227", flag: "🇳🇪" },
  { name: "Burkina Faso", code: "+226", flag: "🇧🇫" },
  { name: "Mali", code: "+223", flag: "🇲🇱" },
  { name: "Malawi", code: "+265", flag: "🇲🇼" },
  { name: "Zambia", code: "+260", flag: "🇿🇲" },
  { name: "Senegal", code: "+221", flag: "🇸🇳" },
  { name: "Chad", code: "+235", flag: "🇹🇩" },
  { name: "Somalia", code: "+252", flag: "🇸🇴" },
  { name: "Zimbabwe", code: "+263", flag: "🇿🇼" },
  { name: "Guinea", code: "+224", flag: "🇬🇳" },
  { name: "Rwanda", code: "+250", flag: "🇷🇼" },
  { name: "Benin", code: "+229", flag: "🇧🇯" },
  { name: "Burundi", code: "+257", flag: "🇧🇮" },
  { name: "Tunisia", code: "+216", flag: "🇹🇳" },
  { name: "South Sudan", code: "+211", flag: "🇸🇸" },
  { name: "Togo", code: "+228", flag: "🇹🇬" },
  { name: "Sierra Leone", code: "+232", flag: "🇸🇱" },
  { name: "Libya", code: "+218", flag: "🇱🇾" },
  { name: "Liberia", code: "+231", flag: "🇱🇷" },
  { name: "Central African Republic", code: "+236", flag: "🇨🇫" },
  { name: "Mauritania", code: "+222", flag: "🇲🇷" },
  { name: "Eritrea", code: "+291", flag: "🇪🇷" },
  { name: "Gambia", code: "+220", flag: "🇬🇲" },
  { name: "Botswana", code: "+267", flag: "🇧🇼" },
  { name: "Namibia", code: "+264", flag: "🇳🇦" },
  { name: "Gabon", code: "+241", flag: "🇬🇦" },
  { name: "Lesotho", code: "+266", flag: "🇱🇸" },
  { name: "Guinea-Bissau", code: "+245", flag: "🇬🇼" },
  { name: "Equatorial Guinea", code: "+240", flag: "🇬🇶" },
  { name: "Mauritius", code: "+230", flag: "🇲🇺" },
  { name: "Eswatini", code: "+268", flag: "🇸🇿" },
  { name: "Djibouti", code: "+253", flag: "🇩🇯" },
  { name: "Comoros", code: "+269", flag: "🇰🇲" },
  { name: "Cabo Verde", code: "+238", flag: "🇨🇻" },
  { name: "São Tomé and Príncipe", code: "+239", flag: "🇸🇹" },
  { name: "Seychelles", code: "+248", flag: "🇸🇨" },
];

export default function ApplyPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [cohortsError, setCohortsError] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    experienceLevel: "",
    preferredCohort: "",
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    const countryData = africanCountries.find((c) => c.name === country);
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
  };

  // Fetch cohorts from Notion
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        setCohortsLoading(true);
        setCohortsError(null);
        const res = await fetch('/api/notion/cohorts');
        if (!res.ok) {
          throw new Error(`Failed to fetch cohorts: ${res.status}`);
        }
        const data = await res.json();
        
        // Format dates and transform data
        const formattedCohorts: Cohort[] = (data.cohorts || []).map((cohort: any) => {
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
          
          return {
            id: cohort.id,
            name: cohort.name || 'Unnamed Cohort',
            startDate: formatDate(cohort.startDate),
            endDate: formatDate(cohort.endDate),
            status: cohort.status || '',
            sessions: cohort.sessions || 0,
            level: cohort.level || 'Beginner',
          };
        });
        
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

  // Auto-fill preferred cohort when a cohort is selected
  useEffect(() => {
    if (selectedCohort !== null) {
      const cohort = cohorts.find((c) => c.id === selectedCohort);
      if (cohort) {
        // Update preferredCohort to match the selected cohort ID (dropdown uses ID as value)
        setFormData((prev) => ({ ...prev, preferredCohort: cohort.id }));
      }
    }
  }, [selectedCohort, cohorts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // The phone number is already combined in formData.phone via handlePhoneChange
    const finalFormData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(), // Combine first and last name
      country: selectedCountry,
    };

    const selectedCohortObj = selectedCohort ? cohorts.find((c) => c.id === selectedCohort) : null;
    const cohortNumber = selectedCohortObj ? selectedCohortObj.id : null;
    const cohortName = selectedCohortObj ? selectedCohortObj.name : formData.preferredCohort || '';

    try {
      // Submit to Notion API
      const [applicationRes] = await Promise.all([
        fetch('/api/notion/submit-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalFormData),
        }),
        // Best-effort profile registration (does not block success)
        fetch('/api/notion/profile/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            cohortNumber,
            cohortName,
          }),
        }).catch((err) => {
          console.warn('Profile registration failed:', err);
        }),
      ]);

      const result = await applicationRes.json();

      if (applicationRes.ok) {
        alert('Application submitted successfully! We will review and get back to you soon.');
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
        });
        setSelectedCountry("");
        setSelectedCountryCode("");
        setPhoneNumber("");
        setSelectedCohort(null);
      } else {
        throw new Error(result.error || 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert(`Error: ${error.message}. Please try again or contact support.`);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Join Our Next Cohort
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              Apply to join the Pan-Africa Bitcoin Academy and start your journey toward financial sovereignty.
            </p>
          </div>

      <div className="space-y-12">
        {/* Cohort Details */}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className={`rounded-xl border p-6 transition ${
                  selectedCohort === cohort.id
                    ? "border-orange-400/50 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                    : "border-cyan-400/25 bg-black/80 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                }`}
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
                  onClick={() => setSelectedCohort(cohort.id)}
                  className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    selectedCohort === cohort.id
                      ? "bg-orange-400 text-black"
                      : "bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30"
                  }`}
                >
                  {selectedCohort === cohort.id ? "Selected" : "Select This Cohort"}
                </button>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Registration Form */}
        <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <h2 className="mb-6 text-xl font-semibold text-cyan-200">Application Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name and Last Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Phone <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCountryCode}
                    onChange={handleCountryCodeChange}
                    className="flex-shrink-0 rounded-lg border border-cyan-400/30 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                    style={{ minWidth: '90px' }}
                    title={selectedCountryCode ? africanCountries.find(c => c.code === selectedCountryCode)?.name : "Select country code"}
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">Code</option>
                    {africanCountries.map((country) => (
                      <option key={country.code} value={country.code} className="bg-zinc-950 text-zinc-50">
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1 rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Country and City */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Country <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select your country</option>
                  {africanCountries.map((country) => (
                    <option key={country.name} value={country.name} className="bg-zinc-950 text-zinc-50">
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Lagos"
                />
              </div>
            </div>

            {/* Experience Level and Preferred Cohort */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Experience Level <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select your level</option>
                  <option value="beginner" className="bg-zinc-950 text-zinc-50">Beginner - New to Bitcoin</option>
                  <option value="intermediate" className="bg-zinc-950 text-zinc-50">Intermediate - Some knowledge</option>
                  <option value="advanced" className="bg-zinc-950 text-zinc-50">Advanced - Experienced user</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Preferred Cohort <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.preferredCohort}
                  onChange={(e) => {
                    const cohortId = e.target.value;
                    setFormData({ ...formData, preferredCohort: cohortId });
                    setSelectedCohort(cohortId || null);
                  }}
                  className={`w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer ${
                    formData.preferredCohort ? 'text-green-400' : 'text-zinc-50'
                  }`}
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">Select a cohort</option>
                  {cohorts.map((cohort) => (
                    <option 
                      key={cohort.id} 
                      value={cohort.id} 
                      className={`bg-zinc-950 ${
                        formData.preferredCohort === cohort.id.toString() ? 'text-green-400' : 'text-zinc-50'
                      }`}
                    >
                      {cohort.name} ({cohort.available} seats available)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs text-zinc-400">
                <span className="font-semibold text-orange-300">Note:</span> After submitting, you'll be redirected to complete your application. We'll review and get back to you within 3-5 business days.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
              >
                Register
              </button>
            </div>
          </form>
        </section>
      </div>
        </div>
      </div>
    </div>
  );
}

