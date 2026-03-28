'use client';

import { useState } from 'react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { AnimatedHeading } from '@/components/AnimatedHeading';
import { inputStyles, labelStyles, buttonStyles, cardStyles, cn } from '@/lib/styles';

const ONCHAIN_ADDRESS = 'bc1q4pg073ws86qdnxac3y8zhk4t8vtkg2vx529jrj';
const ONCHAIN_QR_SRC = '/images/onchain-btc-qr.jpeg';
const LIGHTNING_ADDRESS = 'panafricanbitcoin@blink.sv';
const LNURL_QR_SRC = '/images/lunrl_qr.jpeg';

export default function SponsorPage() {
  const [sponsorType, setSponsorType] = useState<'general' | 'student'>('general');
  const [formData, setFormData] = useState({
    sponsorName: '',
    sponsorEmail: '',
    studentName: '',
    anonymous: false,
    message: '',
    paymentMethod: 'lightning' as 'lightning' | 'onchain',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In a real implementation, you would:
    // 1. Submit sponsorship form data
    // 2. Process payment
    // 3. Create sponsorship record in database

    alert('Thank you for your sponsorship! After completing your payment, we will confirm your sponsorship.');
  };

  const studentNameTrimmed = formData.studentName.trim();
  const canSubmitStudent =
    sponsorType !== 'student' || studentNameTrimmed.length > 0;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <AnimatedHeading as="h1" className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Sponsor a Student
              </AnimatedHeading>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                Help a student access Bitcoin education. Your sponsorship covers their learning journey and sats rewards.
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-12">
            {/* Sponsorship Type Selection */}
            <AnimatedSection animation="slideRight">
              <section className="space-y-6 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                <AnimatedHeading as="h2" className="text-xl font-semibold text-cyan-200">Choose Sponsorship Type</AnimatedHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSponsorType('general');
                    }}
                    className={`rounded-lg border p-6 text-left transition ${
                      sponsorType === 'general'
                        ? 'border-orange-400/50 bg-orange-500/10'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <AnimatedHeading as="h3" className="mb-2 text-lg font-semibold text-orange-200">General Sponsorship</AnimatedHeading>
                    <p className="text-sm text-zinc-300">
                      Support the academy generally. Your contribution helps all students through sats rewards, infrastructure, and growth.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSponsorType('student')}
                    className={`rounded-lg border p-6 text-left transition ${
                      sponsorType === 'student'
                        ? 'border-cyan-400/50 bg-cyan-500/10'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <AnimatedHeading as="h3" className="mb-2 text-lg font-semibold text-cyan-200">Sponsor Specific Student</AnimatedHeading>
                    <p className="text-sm text-zinc-300">
                      Enter the name of the student you want to sponsor. Your support goes to their education and sats rewards.
                    </p>
                  </button>
                </div>
              </section>
            </AnimatedSection>

            {/* Student name (if sponsoring a specific student) */}
            {sponsorType === 'student' && (
              <AnimatedSection animation="slideLeft">
                <section className="space-y-4 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                  <AnimatedHeading as="h2" className="text-xl font-semibold text-cyan-200">Student name</AnimatedHeading>
                  <p className="text-sm text-zinc-400">
                    Type the full name of the student you are sponsoring. If you are unsure of spelling, add a note in the message field below.
                  </p>
                  <div>
                    <label htmlFor="studentName" className="mb-2 block text-sm font-medium text-zinc-300">
                      Student name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="studentName"
                      name="studentName"
                      type="text"
                      autoComplete="off"
                      required={sponsorType === 'student'}
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </section>
              </AnimatedSection>
            )}

            {/* Sponsorship Form */}
            <AnimatedSection animation="slideUp">
              <section className="space-y-6 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                <AnimatedHeading as="h2" className="text-xl font-semibold text-orange-200">Sponsorship Details</AnimatedHeading>
                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sponsorName" className="mb-2 block text-sm font-medium text-zinc-300">
                        Your Name {!formData.anonymous && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id="sponsorName"
                        name="sponsorName"
                        type="text"
                        autoComplete="name"
                        required={!formData.anonymous}
                        disabled={formData.anonymous}
                        value={formData.sponsorName}
                        onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="sponsorEmail" className="mb-2 block text-sm font-medium text-zinc-300">
                        Your Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="sponsorEmail"
                        name="sponsorEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.sponsorEmail}
                        onChange={(e) => setFormData({ ...formData, sponsorEmail: e.target.value })}
                        className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="anonymous"
                      name="anonymous"
                      type="checkbox"
                      checked={formData.anonymous}
                      onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                      className="h-4 w-4 rounded border-cyan-400/30 text-cyan-400 focus:ring-cyan-400/20"
                    />
                    <label htmlFor="anonymous" className="text-sm text-zinc-300">
                      Keep my sponsorship anonymous (name won&apos;t be displayed publicly)
                    </label>
                  </div>

                  {sponsorType === 'student' && studentNameTrimmed ? (
                    <div className={cn(cardStyles.info, 'bg-cyan-500/5')}>
                      <p className="text-sm text-cyan-200">
                        <span className="font-semibold">Sponsoring:</span> {studentNameTrimmed}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="message" className={labelStyles.base}>
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={cn(inputStyles.optional, 'py-2 text-sm')}
                      placeholder="Optional message for the student or academy..."
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className={cn(labelStyles.base, 'mb-3')}>
                      Payment Method <span className="text-red-400">*</span>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'lightning' })}
                        className={cn(
                          'rounded-lg border p-4 text-left transition',
                          formData.paymentMethod === 'lightning'
                            ? 'border-cyan-400/50 bg-cyan-500/10'
                            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                        )}
                      >
                        <AnimatedHeading as="h3" className="mb-1 text-sm font-semibold text-cyan-200">Lightning Network</AnimatedHeading>
                        <p className="text-xs text-zinc-400">Fast, low-fee payments</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'onchain' })}
                        className={cn(
                          'rounded-lg border p-4 text-left transition',
                          formData.paymentMethod === 'onchain'
                            ? 'border-orange-400/50 bg-orange-500/10'
                            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                        )}
                      >
                        <AnimatedHeading as="h3" className="mb-1 text-sm font-semibold text-orange-200">On-Chain</AnimatedHeading>
                        <p className="text-xs text-zinc-400">Traditional Bitcoin transaction</p>
                      </button>
                    </div>
                  </div>

                  {/* Payment QR Code and Address */}
                  <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6">
                    <AnimatedHeading as="h3" className="mb-4 text-lg font-semibold text-purple-200">
                      {formData.paymentMethod === 'lightning' ? 'Lightning Network Payment' : 'On-Chain Payment'}
                    </AnimatedHeading>
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-xl border border-purple-400/30 bg-zinc-900/60 p-3">
                        <img
                          src={formData.paymentMethod === 'lightning' ? LNURL_QR_SRC : ONCHAIN_QR_SRC}
                          alt={`${formData.paymentMethod === 'lightning' ? 'Lightning' : 'On-chain'} payment QR code`}
                          className="h-48 w-48 rounded-lg object-contain"
                        />
                      </div>
                      <div className="w-full space-y-2">
                        <label className="block text-center text-xs font-medium text-zinc-400">
                          {formData.paymentMethod === 'lightning' ? 'Paycode' : 'Bitcoin Address'}
                        </label>
                        <div className="rounded-lg border border-purple-400/20 bg-zinc-900/50 p-3 text-center font-mono text-xs text-purple-300 break-all">
                          {formData.paymentMethod === 'lightning' ? LIGHTNING_ADDRESS : ONCHAIN_ADDRESS}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const address = formData.paymentMethod === 'lightning' ? LIGHTNING_ADDRESS : ONCHAIN_ADDRESS;
                            navigator.clipboard?.writeText(address);
                            alert('Copied to clipboard!');
                          }}
                          className={cn(buttonStyles.primary, 'w-full px-4 py-2 text-sm')}
                        >
                          Copy {formData.paymentMethod === 'lightning' ? 'Paycode' : 'Address'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-xs text-zinc-400">
                      <span className="font-semibold text-orange-300">Note:</span> After completing your payment, please submit this form. We will confirm your sponsorship once payment is verified.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmitStudent}
                    className={cn(
                      buttonStyles.primary,
                      'w-full text-sm',
                      !canSubmitStudent && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    Submit Sponsorship
                  </button>
                </form>
              </section>
            </AnimatedSection>

            {/* What Sponsorship Covers */}
            <AnimatedSection animation="slideRight">
              <section className="space-y-4 rounded-xl border border-green-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <AnimatedHeading as="h2" className="text-xl font-semibold text-green-200">What Your Sponsorship Covers</AnimatedHeading>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300 sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Full access to all 20 chapters of Bitcoin education</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Sats rewards for completing assignments and chapters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Access to live sessions and mentorship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Certificate upon completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Support for infrastructure and educational resources</span>
                  </li>
                </ul>
              </section>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
