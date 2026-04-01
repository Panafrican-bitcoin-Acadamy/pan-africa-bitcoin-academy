'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Globe2,
  FileText,
  Clock,
  GraduationCap,
  Check,
  User,
  TrendingUp,
  ArrowDownRight,
  RefreshCw,
  CalendarCheck,
  Zap,
  HeartHandshake,
  UserPlus,
} from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { AnimatedHeading } from '@/components/AnimatedHeading';
import SplitText from '@/components/SplitText';

interface ImpactMetrics {
  totalStudentsTrained: number;
  cohortsCompleted: number;
  countriesReached: number;
  assignmentsSubmitted: number;
  teachingHours: number;
  eventsCompleted: number;
}

interface SatsStats {
  satsEarned: number;
  satsSpent: number;
  satsCirculated: number;
}

interface CohortData {
  id: string;
  name: string;
  students: number;
  completionRate: number;
  startDate: string | null;
  endDate: string | null;
  mentor: string | null;
  level: string;
}

interface ProgressMetrics {
  completionRate: number;
  attendanceRate: number;
  avgAssignmentScore: number;
}

interface Testimonial {
  id: string;
  name: string;
  city: string;
  quote: string;
  photo: string | null;
}

const outcomes = [
  "50% now using Bitcoin daily",
  "students supporting local communities",
  "students teaching Bitcoin in their schools",
  "Lightning payments used in real life: 120+ transactions",
];

// Custom hook for animated counter
function useAnimatedCounter(target: number, duration: number = 1500, startAnimation: boolean = true) {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!startAnimation || target === 0) {
      setCount(target);
      return;
    }

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.round(target * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [target, duration, startAnimation]);

  return count;
}

export default function ImpactPage() {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [satsStats, setSatsStats] = useState<SatsStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Completion: show 10% when computed rate is 0 (empty / early cohorts)
  const completionRateTarget =
    progressMetrics != null && progressMetrics.completionRate === 0
      ? 10
      : progressMetrics?.completionRate ?? 0;

  // Animated values for progress metrics
  const animatedCompletionRate = useAnimatedCounter(
    completionRateTarget,
    1500,
    shouldAnimate
  );
  const animatedAttendanceRate = useAnimatedCounter(
    progressMetrics?.attendanceRate || 0,
    1500,
    shouldAnimate
  );
  const animatedAssignmentScore = useAnimatedCounter(
    progressMetrics?.avgAssignmentScore || 0,
    1500,
    shouldAnimate
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [metricsResponse, cohortsResponse, progressResponse, satsResponse, testimonialsResponse] = await Promise.all([
          fetch('/api/impact/metrics'),
          fetch('/api/impact/cohorts'),
          fetch('/api/impact/progress'),
          fetch('/api/impact/sats-stats'),
          fetch('/api/impact/testimonials'),
        ]);

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData);
        }

        if (cohortsResponse.ok) {
          const cohortsData = await cohortsResponse.json();
          setCohorts(cohortsData.cohorts || []);
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgressMetrics(progressData);
        }

        if (satsResponse.ok) {
          const satsData = await satsResponse.json();
          setSatsStats(satsData);
        }

        if (testimonialsResponse.ok) {
          const testimonialsData = await testimonialsResponse.json();
          setTestimonials(testimonialsData.testimonials || []);
        }
      } catch (error) {
        console.error('Error fetching impact data:', error);
      } finally {
        setDataLoaded(true);
        setTimeout(() => setShouldAnimate(true), 100);
      }
    };

    fetchData();
  }, []);

  type MetricIcon = typeof Users;
  const keyMetricDefs: { label: string; Icon: MetricIcon; getValue: (m: ImpactMetrics) => number | string }[] = [
    { label: 'Total Students Trained', Icon: Users, getValue: (m) => m.totalStudentsTrained },
    { label: 'Cohorts Completed', Icon: GraduationCap, getValue: (m) => m.cohortsCompleted },
    { label: 'Countries Reached', Icon: Globe2, getValue: (m) => m.countriesReached },
    { label: 'Assignments Submitted', Icon: FileText, getValue: (m) => m.assignmentsSubmitted },
    {
      label: 'Teaching Hours',
      Icon: Clock,
      getValue: (m) => {
        const v = m.teachingHours ?? 0;
        return Number.isInteger(v) ? v : v.toFixed(1);
      },
    },
    { label: 'Events Completed', Icon: CalendarCheck, getValue: (m) => m.eventsCompleted ?? 0 },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <AnimatedSection animation="slideUp">
            <div className="mb-16 text-center">
              <AnimatedHeading as="h1" className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                <SplitText
                  text="Our Impact"
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
              </AnimatedHeading>
              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" aria-hidden />
              <p className="mx-auto mt-5 max-w-md text-sm text-zinc-500 sm:text-base">
                Cohort stats and outcomes we publish here.
              </p>
            </div>
          </AnimatedSection>

      <div className="space-y-12">
        {/* Key Metrics */}
        <AnimatedSection animation="slideLeft">
          <section className="space-y-6">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-zinc-50">Key Metrics</AnimatedHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {keyMetricDefs.map((def, index) => {
              const Icon = def.Icon;
              const value = metrics ? def.getValue(metrics).toString() : '0';
              return (
                <div
                  key={def.label}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/40"
                >
                  <div className="mb-3 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10">
                      <Icon className="h-6 w-6 text-cyan-300" aria-hidden />
                    </div>
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-cyan-300">{value}</div>
                  <div className="mt-2 text-xs text-zinc-400 sm:text-sm">{def.label}</div>
                </div>
              );
            })}
          </div>
          </section>
        </AnimatedSection>

        {/* Student Progress Charts */}
        <AnimatedSection animation="slideRight">
          <section className="space-y-6">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-zinc-50">Student Progress</AnimatedHeading>
          {progressMetrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Completion Rate</AnimatedHeading>
                <div className="text-3xl font-bold text-orange-400">{animatedCompletionRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-orange-400 transition-all duration-1500 ease-out" 
                    style={{ width: `${animatedCompletionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Attendance Rate</AnimatedHeading>
                <div className="text-3xl font-bold text-cyan-400">{animatedAttendanceRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-cyan-400 transition-all duration-1500 ease-out" 
                    style={{ width: `${animatedAttendanceRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Avg Assignment Score</AnimatedHeading>
                <div className="text-3xl font-bold text-purple-400">{animatedAssignmentScore}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-purple-400 transition-all duration-1500 ease-out" 
                    style={{ width: `${animatedAssignmentScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            // Placeholder while loading (completion uses 10% so the bar is not empty)
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Completion Rate</AnimatedHeading>
                <div className="text-3xl font-bold text-orange-400">10%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-orange-400" style={{ width: '10%' }}></div>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Attendance Rate</AnimatedHeading>
                <div className="text-3xl font-bold text-cyan-400">0%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <AnimatedHeading as="h3" className="mb-2 text-sm font-medium text-zinc-400">Avg Assignment Score</AnimatedHeading>
                <div className="text-3xl font-bold text-purple-400">0%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-purple-400" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Cohort History */}
        <section className="space-y-6">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-zinc-50">Cohort History</AnimatedHeading>
          {cohorts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <AnimatedHeading as="h3" className="text-lg font-semibold text-cyan-200">
                      {cohort.name}
                    </AnimatedHeading>
                    {(() => {
                      const ended =
                        !!cohort.endDate && !Number.isNaN(new Date(cohort.endDate).getTime())
                          ? new Date(cohort.endDate).getTime() < Date.now()
                          : false;
                      const isCompleted = (cohort.completionRate ?? 0) >= 100 || ended;
                      return isCompleted ? (
                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300 ring-1 ring-green-500/25">
                          Completed
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <p><span className="font-medium text-zinc-400">Students:</span> {cohort.students}</p>
                    <p><span className="font-medium text-zinc-400">Completion Rate:</span> {cohort.completionRate}%</p>
                    {cohort.startDate && cohort.endDate && (
                      <p><span className="font-medium text-zinc-400">Duration:</span> {cohort.startDate} - {cohort.endDate}</p>
                    )}
                    <p><span className="font-medium text-zinc-400">Level:</span> {cohort.level}</p>
                    {cohort.mentor && (
                      <p><span className="font-medium text-zinc-400">Mentor:</span> {cohort.mentor}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <p className="text-zinc-400">No completed cohorts yet.</p>
            </div>
          )}
          </section>
        </AnimatedSection>

        {/* Graduate Outcomes */}
        <AnimatedSection animation="slideRight">
          <section className="space-y-4 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-orange-200">Graduate Outcomes</AnimatedHeading>
          <p className="text-sm text-zinc-300 sm:text-base">What our students are expected to achieve:</p>
          <ul className="mt-4 space-y-2">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-zinc-300 sm:text-base">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" aria-hidden />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
          </section>
        </AnimatedSection>

        {/* Sats Reward Economy */}
        <AnimatedSection animation="slideLeft">
          <section className="space-y-4 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-purple-200">Sats Reward Economy</AnimatedHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" aria-hidden />
              </div>
              <div className="text-2xl font-bold tabular-nums text-purple-400">
                {satsStats
                  ? `${(satsStats.satsEarned / 1000).toFixed(0)}K+`
                  : '0+'}
              </div>
              <div className="mt-1 text-xs text-zinc-400">Sats Earned</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <ArrowDownRight className="h-6 w-6 text-purple-400" aria-hidden />
              </div>
              <div className="text-2xl font-bold tabular-nums text-purple-400">
                {satsStats
                  ? `${(satsStats.satsSpent / 1000).toFixed(0)}K+`
                  : '0+'}
              </div>
              <div className="mt-1 text-xs text-zinc-400">Sats Spent</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <RefreshCw className="h-6 w-6 text-purple-400" aria-hidden />
              </div>
              <div className="text-2xl font-bold tabular-nums text-purple-400">
                {satsStats
                  ? `${(satsStats.satsCirculated / 1000).toFixed(0)}K+`
                  : '0+'}
              </div>
              <div className="mt-1 text-xs text-zinc-400">Sats Circulated</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            This proves our academy is Bitcoin-native, not just "talking about Bitcoin."
          </p>
          </section>
        </AnimatedSection>

        {/* Testimonials */}
        <AnimatedSection animation="slideRight">
          <section className="space-y-6">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-zinc-50">Student Testimonials</AnimatedHeading>
          {testimonials.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    {testimonial.photo ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden">
                        <Image 
                          src={testimonial.photo} 
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                        <User className="h-6 w-6 text-cyan-300/90" aria-hidden />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-zinc-50">{testimonial.name}</div>
                      {testimonial.city && (
                        <div className="text-xs text-zinc-400">{testimonial.city}</div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm italic text-zinc-300">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <p className="text-zinc-400">No testimonials available at this time.</p>
            </div>
          )}
          </section>
        </AnimatedSection>

        {/* Download Report */}
        <AnimatedSection animation="slideUp">
          <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <AnimatedHeading as="h2" className="text-xl font-semibold text-cyan-200">Download Impact Report</AnimatedHeading>
          <p className="mt-2 text-sm text-zinc-300 sm:text-base">
            Get our comprehensive 1–2 page PDF report with mission, results, charts, stats, photos, and quotes.
          </p>
          <button 
            disabled
            className="mt-6 rounded-lg bg-gradient-to-r from-zinc-600 to-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-400 cursor-not-allowed opacity-60"
          >
            Download PDF Report
          </button>
          </section>
        </AnimatedSection>

        {/* Support Section */}
        <AnimatedSection animation="slideLeft">
          <section className="overflow-hidden rounded-xl border border-orange-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="mx-auto max-w-3xl text-center">
              <AnimatedHeading as="h2" className="text-xl font-semibold text-orange-200">
                Want to help us expand our impact?
              </AnimatedHeading>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">
                Support the next cohort of builders, educators, and community leaders across Africa.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href="/donate"
                className="group rounded-xl border border-orange-400/25 bg-gradient-to-b from-orange-400/10 to-transparent p-5 text-left transition hover:border-orange-400/40 hover:bg-orange-400/15 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-400/10">
                    <Zap className="h-5 w-5 text-orange-300" aria-hidden />
                  </div>
                  <span className="rounded-full bg-orange-400/10 px-2.5 py-1 text-[11px] font-semibold text-orange-200 ring-1 ring-orange-400/20">
                    Fast
                  </span>
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-50">Lightning Donate</div>
                <div className="mt-1 text-xs text-zinc-400">
                  Contribute instantly via Lightning to keep classes, meetups, and workshops running.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-orange-200">
                  Donate now <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </a>

              <a
                href="/sponsor"
                className="group rounded-xl border border-cyan-400/25 bg-gradient-to-b from-cyan-400/10 to-transparent p-5 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
                    <HeartHandshake className="h-5 w-5 text-cyan-300" aria-hidden />
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
                    Direct
                  </span>
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-50">Sponsor a Student</div>
                <div className="mt-1 text-xs text-zinc-400">
                  Help cover learning resources and mentorship for students who need it most.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200">
                  Sponsor <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </a>

              <a
                href="/mentorship"
                className="group rounded-xl border border-purple-400/25 bg-gradient-to-b from-purple-400/10 to-transparent p-5 text-left transition hover:border-purple-400/40 hover:bg-purple-400/15 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-400/10">
                    <UserPlus className="h-5 w-5 text-purple-300" aria-hidden />
                  </div>
                  <span className="rounded-full bg-purple-400/10 px-2.5 py-1 text-[11px] font-semibold text-purple-200 ring-1 ring-purple-400/20">
                    Mentoring
                  </span>
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-50">Join us on mentoring</div>
                <div className="mt-1 text-xs text-zinc-400">
                  Volunteer your time to guide students and strengthen local Bitcoin communities.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-purple-200">
                  Join us <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </a>
            </div>
          </section>
        </AnimatedSection>
      </div>
        </div>
      </div>
    </div>
  );
}

