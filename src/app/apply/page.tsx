'use client';

import { useState } from "react";
import { PageContainer } from "@/components/PageContainer";

const cohorts = [
  {
    id: 1,
    name: "Cohort 1 - January 2025",
    startDate: "January 15, 2025",
    endDate: "March 15, 2025",
    seats: 20,
    available: 8,
    level: "Beginner",
    duration: "8 weeks",
  },
  {
    id: 2,
    name: "Cohort 2 - March 2025",
    startDate: "March 1, 2025",
    endDate: "April 26, 2025",
    seats: 25,
    available: 15,
    level: "Intermediate",
    duration: "8 weeks",
  },
  {
    id: 3,
    name: "Cohort 3 - May 2025",
    startDate: "May 5, 2025",
    endDate: "June 30, 2025",
    seats: 30,
    available: 30,
    level: "Beginner",
    duration: "8 weeks",
  },
];

export default function ApplyPage() {
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    experienceLevel: "",
    preferredCohort: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to Google Forms or your backend
    const formUrl = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";
    window.open(formUrl, "_blank");
  };

  return (
    <PageContainer
      title="Join Our Next Cohort"
      subtitle="Apply to join our Bitcoin Academy and start your journey toward financial sovereignty."
    >
      <div className="space-y-12">
        {/* Cohort Details */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Upcoming Cohorts</h2>
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
                  <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-300">
                    {cohort.level}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-zinc-300">
                  <p><span className="font-medium text-zinc-400">Start:</span> {cohort.startDate}</p>
                  <p><span className="font-medium text-zinc-400">End:</span> {cohort.endDate}</p>
                  <p><span className="font-medium text-zinc-400">Duration:</span> {cohort.duration}</p>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-2">
                    <span className="text-xs text-zinc-400">Seats Available</span>
                    <span className={`font-semibold ${cohort.available > 0 ? "text-orange-400" : "text-red-400"}`}>
                      {cohort.available} / {cohort.seats}
                    </span>
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
        </section>

        {/* Registration Form */}
        <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <h2 className="mb-6 text-xl font-semibold text-cyan-200">Application Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Country <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Nigeria"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Lagos"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Experience Level <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">Select your level</option>
                <option value="beginner">Beginner - New to Bitcoin</option>
                <option value="intermediate">Intermediate - Some knowledge</option>
                <option value="advanced">Advanced - Experienced user</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Preferred Cohort <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.preferredCohort}
                onChange={(e) => setFormData({ ...formData, preferredCohort: e.target.value })}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">Select a cohort</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} ({cohort.available} seats available)
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs text-zinc-400">
                <span className="font-semibold text-orange-300">Note:</span> After submitting, you'll be redirected to complete your application. We'll review and get back to you within 3-5 business days.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.4)] transition hover:brightness-110"
            >
              Apply Now
            </button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}

