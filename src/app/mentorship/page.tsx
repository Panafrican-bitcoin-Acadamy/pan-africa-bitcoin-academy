'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "@/components/AnimatedSection";
import { AnimatedList } from "@/components/AnimatedList";

const roles = [
  {
    id: "mentor",
    title: "Mentor",
    description: "Support students during cohorts, lead Q&A sessions, help review assignments, and provide guidance on Bitcoin, Lightning, or sovereignty.",
    time: "1–3 hours/month",
    icon: "👥",
  },
  {
    id: "lecturer",
    title: "Guest Lecturer",
    description: "Teach specialized sessions (Lightning, mining, nodes, privacy, etc.), share industry or technical experience, and participate in panel discussions.",
    time: "Per invitation",
    icon: "🎓",
  },
  {
    id: "volunteer",
    title: "Volunteer",
    description: "Help with community moderation, student onboarding, content creation, or administrative tasks. Flexible time commitment.",
    time: "Flexible",
    icon: "🤝",
  },
];

export default function MentorshipPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    whatsapp: "",
    role: "",
    experience: "",
    teachingExperience: "",
    motivation: "",
    hours: "",
    comments: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('/api/mentors');
        if (response.ok) {
          const data = await response.json();
          setMentors(data.mentors || []);
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          teachingExperience: formData.teachingExperience,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Mentorship & Volunteer
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                Join us in building Bitcoin education and sovereignty in Africa.
              </p>
            </div>
          </AnimatedSection>

      <div className="space-y-12">
        {/* Why Mentors Matter */}
        <AnimatedSection animation="slideRight">
          <section className="space-y-4 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-semibold text-orange-200">Why Mentors & Volunteers Matter</h2>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Bitcoin education grows through community, not classrooms.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Our mentors, volunteers, and guest lecturers help shape the next generation of African Bitcoin talent.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            If you share our mission of sovereignty, freedom, and open knowledge — we invite you to join us.
          </p>
          </section>
        </AnimatedSection>

        {submitted && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-200">
            Thank you! Your mentorship application has been received.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Roles */}
        <AnimatedSection animation="slideLeft">
          <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Roles You Can Apply For</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`rounded-xl border p-6 transition ${
                  selectedRole === role.id
                    ? "border-orange-400/50 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                    : "border-cyan-400/25 bg-black/80 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{role.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50">{role.title}</h3>
                    <p className="text-xs text-zinc-400">Time: {role.time}</p>
                  </div>
                </div>
                <p className="mb-4 text-sm text-zinc-300">{role.description}</p>
                <button
                  onClick={() => {
                    setSelectedRole(role.id);
                    setFormData({ ...formData, role: role.id });
                  }}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    selectedRole === role.id
                      ? "bg-orange-400 text-black"
                      : "bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30"
                  }`}
                >
                  {selectedRole === role.id ? "Selected" : "Apply for This Role"}
                </button>
              </div>
            ))}
          </div>
          </section>
        </AnimatedSection>

        {/* Application Form */}
        <AnimatedSection animation="slideUp">
          <section id="application" className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-cyan-200 mb-2">Application Form</h2>
              <p className="text-sm text-zinc-400">Fill out the form below to apply for a mentorship or volunteer role</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
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
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                        placeholder="e.g., Nigeria, Kenya, Ghana"
                      />
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
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                        placeholder="Phone number or @username"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Selection Section */}
              <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                    <span className="text-xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-orange-200">Role Selection</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Which role are you applying for? <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => {
                        setFormData({ ...formData, role: e.target.value });
                        setSelectedRole(e.target.value);
                      }}
                      className="w-full rounded-lg border border-orange-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.title} - {role.time}
                        </option>
                      ))}
                    </select>
                    {selectedRole && (
                      <p className="mt-2 text-xs text-zinc-400">
                        {roles.find(r => r.id === selectedRole)?.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      How many hours per month can you contribute? <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full rounded-lg border border-orange-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition"
                      placeholder="e.g., 8-12 hours"
                    />
                  </div>
                </div>
              </div>

              {/* Experience Section */}
              <div className="rounded-xl border border-purple-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                    <span className="text-xl">💼</span>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-200">Experience & Background</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      What experience do you have with Bitcoin / Lightning? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-purple-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition resize-none"
                      placeholder="Describe your experience with Bitcoin, Lightning, nodes, mining, development, etc."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Have you taught or mentored before?
                    </label>
                    <textarea
                      value={formData.teachingExperience}
                      onChange={(e) => setFormData({ ...formData, teachingExperience: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-purple-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition resize-none"
                      placeholder="Any teaching, mentoring, or community leadership experience?"
                    />
                  </div>
                </div>
              </div>

              {/* Motivation Section */}
              <div className="rounded-xl border border-green-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                    <span className="text-xl">💚</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-200">Motivation & Vision</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Why do you want to support this academy? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-green-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition resize-none"
                      placeholder="Share your motivation, vision, and what drives you to contribute..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Additional comments
                    </label>
                    <textarea
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-green-400/20 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition resize-none"
                      placeholder="Anything else you'd like to share?"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="rounded-xl border border-zinc-700/50 bg-black/80 p-6">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="onboarding" 
                    className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900/50 text-cyan-400 focus:ring-2 focus:ring-cyan-400/20" 
                  />
                  <label htmlFor="onboarding" className="text-sm text-zinc-300">
                    Are you open to participating in a short onboarding call?
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || submitted}
                  className="w-full max-w-md rounded-lg bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-8 py-4 text-base font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.4)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
                      Submitting...
                    </span>
                  ) : submitted ? (
                    "✓ Application Submitted"
                  ) : (
                    "Submit Application"
                  )}
                </button>
                <p className="text-xs text-zinc-500">
                  Fields marked with <span className="text-red-400">*</span> are required
                </p>
              </div>
            </form>
          </section>
        </AnimatedSection>

        {/* Vetting Steps */}
        <AnimatedSection animation="slideRight">
          <section className="space-y-4 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <h2 className="text-xl font-semibold text-purple-200">Our Vetting Process</h2>
          <div className="space-y-3 text-sm text-zinc-300 sm:text-base">
            <div className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              <span><strong className="text-purple-200">Application Review</strong> — Filter by skills, availability, and culture fit.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">2.</span>
              <span><strong className="text-purple-200">Quick Connect Call</strong> — A brief chat to get to know each other.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">3.</span>
              <span><strong className="text-purple-200">Trial Week (optional)</strong> — See how you interact in the community.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">4.</span>
              <span><strong className="text-purple-200">Onboarding</strong> — Guidelines, expectations, and responsibilities.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">5.</span>
              <span><strong className="text-purple-200">Public Welcome</strong> — Introduce you to the community (WhatsApp + X/Nostr).</span>
            </div>
          </div>
          </section>
        </AnimatedSection>

        {/* Appreciation Section */}
        <AnimatedSection animation="slideLeft">
          <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-50">Our Mentors & Contributors</h2>
            <p className="mt-2 text-sm text-zinc-400">
              This academy exists because of the people who choose to stand with us.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Our mentors, guest lecturers, and volunteers give their time, knowledge, and energy to build Bitcoin education in Africa.
            </p>
          </div>
          
          {loadingMentors ? (
            <div className="text-center py-8 text-zinc-400">Loading mentors...</div>
          ) : mentors.length > 0 ? (
            <AnimatedList animation="slideLeft" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mentors.map((mentor, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden">
                    {mentor.image_url ? (
                      <Image
                        src={mentor.image_url}
                        alt={mentor.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">👤</span>
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-zinc-50">{mentor.name}</h3>
                  <p className="mb-2 text-base font-medium text-cyan-300">{mentor.role}</p>
                  {mentor.type && (
                    <p className="mb-3 text-xs font-medium text-orange-300">{mentor.type}</p>
                  )}
                  <p className="mb-4 text-sm text-zinc-400">"{mentor.description || ''}"</p>
                  {(mentor.github || mentor.twitter) && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-700">
                      {mentor.github && (
                        <a
                          href={mentor.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-cyan-400 transition-colors"
                          aria-label={`${mentor.name}'s GitHub`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {mentor.twitter && (
                        <a
                          href={mentor.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-cyan-400 transition-colors"
                          aria-label={`${mentor.name}'s Twitter`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </AnimatedList>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <p>No mentors available at this time.</p>
              <p className="mt-2 text-xs text-zinc-500">
                Approved mentors will appear here automatically from our mentorship database.
              </p>
            </div>
          )}
          </section>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection animation="slideUp">
          <section className="rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <h2 className="text-xl font-semibold text-orange-200">Want to join our mentorship team?</h2>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Help empower the next generation of African Bitcoin talent.
            </p>
            <a
              href="#application"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Apply to be a Mentor or Volunteer
            </a>
          </section>
        </AnimatedSection>
      </div>
        </div>
      </div>
    </div>
  );
}

