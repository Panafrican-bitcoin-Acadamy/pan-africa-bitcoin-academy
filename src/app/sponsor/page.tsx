'use client';

import { useState, useEffect } from 'react';
import { AnimatedSection } from '@/components/AnimatedSection';
import Image from 'next/image';

const ONCHAIN_ADDRESS = 'bc1q4pg073ws86qdnxac3y8zhk4t8vtkg2vx529jrj';
const ONCHAIN_QR_SRC = '/images/onchain-btc-qr.jpeg';
const LIGHTNING_ADDRESS = 'panafricanbitcoin@blink.sv';
const LNURL_QR_SRC = '/images/lunrl_qr.jpeg';

interface Student {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  photo_url: string | null;
  progress_percent: number;
  status: string;
}

export default function SponsorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [sponsorType, setSponsorType] = useState<'general' | 'student'>('general');
  const [formData, setFormData] = useState({
    sponsorName: '',
    sponsorEmail: '',
    anonymous: false,
    message: '',
    paymentMethod: 'lightning' as 'lightning' | 'onchain',
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/sponsor/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real implementation, you would:
    // 1. Submit sponsorship form data
    // 2. Process payment
    // 3. Create sponsorship record in database
    
    alert('Thank you for your sponsorship! After completing your payment, we will confirm your sponsorship.');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Sponsor a Student
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
                Help a student access Bitcoin education. Your sponsorship covers their learning journey and sats rewards.
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-12">
            {/* Sponsorship Type Selection */}
            <AnimatedSection animation="slideRight">
              <section className="space-y-6 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                <h2 className="text-xl font-semibold text-cyan-200">Choose Sponsorship Type</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => {
                      setSponsorType('general');
                      setSelectedStudent(null);
                    }}
                    className={`rounded-lg border p-6 text-left transition ${
                      sponsorType === 'general'
                        ? 'border-orange-400/50 bg-orange-500/10'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <h3 className="mb-2 text-lg font-semibold text-orange-200">General Sponsorship</h3>
                    <p className="text-sm text-zinc-300">
                      Support the academy generally. Your contribution helps all students through sats rewards, infrastructure, and growth.
                    </p>
                  </button>
                  <button
                    onClick={() => setSponsorType('student')}
                    className={`rounded-lg border p-6 text-left transition ${
                      sponsorType === 'student'
                        ? 'border-cyan-400/50 bg-cyan-500/10'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <h3 className="mb-2 text-lg font-semibold text-cyan-200">Sponsor Specific Student</h3>
                    <p className="text-sm text-zinc-300">
                      Choose a specific student to sponsor. Your support goes directly to their education and sats rewards.
                    </p>
                  </button>
                </div>
              </section>
            </AnimatedSection>

            {/* Student Selection (if sponsoring specific student) */}
            {sponsorType === 'student' && (
              <AnimatedSection animation="slideLeft">
                <section className="space-y-6 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                  <h2 className="text-xl font-semibold text-cyan-200">Select a Student</h2>
                  {loading ? (
                    <div className="text-center py-8 text-zinc-400">Loading students...</div>
                  ) : students.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {students.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={`rounded-lg border p-4 text-left transition ${
                            selectedStudent === student.id
                              ? 'border-cyan-400/50 bg-cyan-500/10'
                              : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {student.photo_url ? (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden">
                                <Image
                                  src={student.photo_url}
                                  alt={student.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                                <span className="text-xl">👤</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-50">{student.name}</div>
                              {(student.city || student.country) && (
                                <div className="text-xs text-zinc-400">
                                  {[student.city, student.country].filter(Boolean).join(', ')}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-cyan-400">
                                Progress: {student.progress_percent}%
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">No students available for sponsorship at this time.</div>
                  )}
                </section>
              </AnimatedSection>
            )}

            {/* Sponsorship Form */}
            <AnimatedSection animation="slideUp">
              <section className="space-y-6 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                <h2 className="text-xl font-semibold text-orange-200">Sponsorship Details</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sponsorName" className="mb-2 block text-sm font-medium text-zinc-300">
                        Your Name {!formData.anonymous && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id="sponsorName"
                        name="sponsorName"
                        type="text"
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
                      Keep my sponsorship anonymous (name won't be displayed publicly)
                    </label>
                  </div>

                  {sponsorType === 'student' && selectedStudent && (
                    <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
                      <p className="text-sm text-cyan-200">
                        <span className="font-semibold">Sponsoring:</span>{' '}
                        {students.find(s => s.id === selectedStudent)?.name}
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-zinc-300">
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="Optional message for the student or academy..."
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-zinc-300">
                      Payment Method <span className="text-red-400">*</span>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'lightning' })}
                        className={`rounded-lg border p-4 text-left transition ${
                          formData.paymentMethod === 'lightning'
                            ? 'border-cyan-400/50 bg-cyan-500/10'
                            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                      >
                        <h3 className="mb-1 text-sm font-semibold text-cyan-200">Lightning Network</h3>
                        <p className="text-xs text-zinc-400">Fast, low-fee payments</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'onchain' })}
                        className={`rounded-lg border p-4 text-left transition ${
                          formData.paymentMethod === 'onchain'
                            ? 'border-orange-400/50 bg-orange-500/10'
                            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                      >
                        <h3 className="mb-1 text-sm font-semibold text-orange-200">On-Chain</h3>
                        <p className="text-xs text-zinc-400">Traditional Bitcoin transaction</p>
                      </button>
                    </div>
                  </div>

                  {/* Payment QR Code and Address */}
                  <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-purple-200">
                      {formData.paymentMethod === 'lightning' ? 'Lightning Network Payment' : 'On-Chain Payment'}
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-xl border border-purple-400/30 bg-zinc-900/60 p-3">
                        <img
                          src={formData.paymentMethod === 'lightning' ? LNURL_QR_SRC : ONCHAIN_QR_SRC}
                          alt={`${formData.paymentMethod === 'lightning' ? 'Lightning' : 'On-chain'} payment QR code`}
                          className="h-48 w-48 rounded-lg object-contain"
                        />
                      </div>
                      <div className="w-full space-y-2">
                        <label className="text-xs font-medium text-zinc-400 text-center block">
                          {formData.paymentMethod === 'lightning' ? 'Paycode' : 'Bitcoin Address'}
                        </label>
                        <div className="rounded-lg border border-purple-400/20 bg-zinc-900/50 p-3 font-mono text-xs text-purple-300 break-all text-center">
                          {formData.paymentMethod === 'lightning' ? LIGHTNING_ADDRESS : ONCHAIN_ADDRESS}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const address = formData.paymentMethod === 'lightning' ? LIGHTNING_ADDRESS : ONCHAIN_ADDRESS;
                            navigator.clipboard?.writeText(address);
                            alert('Copied to clipboard!');
                          }}
                          className="w-full rounded-lg bg-gradient-to-r from-purple-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
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
                    disabled={sponsorType === 'student' && !selectedStudent}
                    className={`w-full rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110 ${
                      sponsorType === 'student' && !selectedStudent ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Submit Sponsorship
                  </button>
                </form>
              </section>
            </AnimatedSection>

            {/* What Sponsorship Covers */}
            <AnimatedSection animation="slideRight">
              <section className="space-y-4 rounded-xl border border-green-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <h2 className="text-xl font-semibold text-green-200">What Your Sponsorship Covers</h2>
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
