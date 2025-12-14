'use client';

import { useState } from "react";
import { AnimatedSection } from "@/components/AnimatedSection";

const roles = [
  {
    id: "mentor",
    title: "Mentor",
    description: "Support students during cohorts, lead Q&A sessions, help review assignments, and provide guidance on Bitcoin, Lightning, or sovereignty.",
    time: "1–3 hours/week",
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

const mentors = [
  {
    name: "Sarah N.",
    role: "Lightning Developer",
    description: "Led Week 3 Lightning session and mentored 12 students.",
    type: "Mentor",
  },
  {
    name: "Brian M.",
    role: "Bitcoin Educator",
    description: "Reviewed assignments and guided new learners.",
    type: "Mentor",
  },
  {
    name: "Aisha K.",
    role: "Community Assistant",
    description: "Helped answer student questions and supported onboarding.",
    type: "Volunteer",
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
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">WhatsApp / X / Nostr</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Phone number or @username"
                />
              </div>
            </div>

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
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                What experience do you have with Bitcoin / Lightning? <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Describe your experience with Bitcoin, Lightning, nodes, etc."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Have you taught or mentored before?
              </label>
              <textarea
                value={formData.teachingExperience}
                onChange={(e) => setFormData({ ...formData, teachingExperience: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Any teaching, mentoring, or community leadership experience?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Why do you want to support this academy? <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Share your motivation and vision..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                How many hours per week can you contribute? <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="e.g., 2-3 hours"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Additional comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Anything else you'd like to share?"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="onboarding" className="rounded border-cyan-400/20" />
              <label htmlFor="onboarding" className="text-sm text-zinc-300">
                Are you open to participating in a short onboarding call?
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || submitted}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.4)] transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Application"}
            </button>
          </form>
        </section>

        {/* Vetting Steps */}
        <section className="space-y-4 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <h2 className="text-xl font-semibold text-purple-200">Our Vetting Process</h2>
          <div className="space-y-3 text-sm text-zinc-300 sm:text-base">
            <div className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              <span><strong className="text-purple-200">Application Review</strong> — Filter by skills, availability, and culture fit.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">2.</span>
              <span><strong className="text-purple-200">Short Interview / Call</strong> — 10-minute screening with our team.</span>
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

        {/* Appreciation Section */}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor, index) => (
              <div
                key={index}
                className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-50">{mentor.name}</h3>
                <p className="mt-1 text-sm font-medium text-cyan-300">{mentor.role}</p>
                <p className="mt-2 text-xs text-zinc-400">{mentor.type}</p>
                <p className="mt-3 text-sm text-zinc-300">{mentor.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
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
      </div>
        </div>
      </div>
    </div>
  );
}

