'use client';

import { useEffect, useState, useRef } from 'react';

interface ImpactMetrics {
  totalStudentsTrained: number;
  cohortsCompleted: number;
  countriesReached: number;
  assignmentsSubmitted: number;
  teachingHours: number;
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

const outcomes = [
  "50% now using Bitcoin daily",
  "4 students supporting local communities",
  "3 students teaching Bitcoin in their schools",
  "Lightning payments used in real life: 120+ transactions",
];

const testimonials = [
  {
    name: "Amina K.",
    city: "Lagos, Nigeria",
    quote: "This academy changed my understanding of Bitcoin. I now run a Lightning node and help others in my community.",
    photo: "👤",
  },
  {
    name: "David M.",
    city: "Nairobi, Kenya",
    quote: "The hands-on approach and sats rewards made learning engaging. I've completed all assignments and earned 5,000 sats!",
    photo: "👤",
  },
  {
    name: "Fatima A.",
    city: "Accra, Ghana",
    quote: "Best Bitcoin education I've received. The mentors are knowledgeable and the community is supportive.",
    photo: "👤",
  },
];

// Custom hook for animated counter
function useAnimatedCounter(target: number, duration: number = 1500, startAnimation: boolean = true) {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

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
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Animated values for progress metrics
  const animatedCompletionRate = useAnimatedCounter(
    progressMetrics?.completionRate || 0,
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
        const [metricsResponse, cohortsResponse, progressResponse] = await Promise.all([
          fetch('/api/impact/metrics'),
          fetch('/api/impact/cohorts'),
          fetch('/api/impact/progress'),
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
      } catch (error) {
        console.error('Error fetching impact data:', error);
      } finally {
        // Start animation after data is loaded
        setTimeout(() => setShouldAnimate(true), 100);
      }
    };

    fetchData();
  }, []);

  // Format metrics for display
  const displayMetrics = metrics
    ? [
        { label: "Total Students Trained", value: metrics.totalStudentsTrained.toString(), icon: "👥" },
        { label: "Cohorts Completed", value: metrics.cohortsCompleted.toString(), icon: "📚" },
        { label: "Countries Reached", value: metrics.countriesReached.toString(), icon: "🌍" },
        // Lightning Transactions - paused
        { label: "Assignments Submitted", value: metrics.assignmentsSubmitted.toString(), icon: "📝" },
        // Sats Distributed - paused
        { label: "Teaching Hours", value: metrics.teachingHours.toString(), icon: "⏰" },
      ]
    : [];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Our Impact in Building Bitcoin Education & Sovereignty in Africa
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400 sm:text-xl">
              Tracking our progress openly. Updated after every cohort.
            </p>
          </div>

      <div className="space-y-12">
        {/* Key Metrics */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Key Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayMetrics.length > 0 ? (
              displayMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-3 text-4xl">{metric.icon}</div>
                  <div className="text-3xl font-bold text-cyan-300">{metric.value}</div>
                  <div className="mt-2 text-xs text-zinc-400 sm:text-sm">{metric.label}</div>
                </div>
              ))
            ) : (
              // Show placeholder with 0 values while loading
              [
                { label: "Total Students Trained", icon: "👥", value: "0" },
                { label: "Cohorts Completed", icon: "📚", value: "0" },
                { label: "Countries Reached", icon: "🌍", value: "0" },
                { label: "Assignments Submitted", icon: "📝", value: "0" },
                { label: "Teaching Hours", icon: "⏰", value: "0" },
              ].map((metric, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-3 text-4xl">{metric.icon}</div>
                  <div className="text-3xl font-bold text-cyan-300">{metric.value}</div>
                  <div className="mt-2 text-xs text-zinc-400 sm:text-sm">{metric.label}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Student Progress Charts */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Student Progress</h2>
          {progressMetrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Completion Rate</h3>
                <div className="text-3xl font-bold text-orange-400">{animatedCompletionRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-orange-400 transition-all duration-1500 ease-out" 
                    style={{ width: `${animatedCompletionRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Attendance Rate</h3>
                <div className="text-3xl font-bold text-cyan-400">{animatedAttendanceRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-cyan-400 transition-all duration-1500 ease-out" 
                    style={{ width: `${animatedAttendanceRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Avg Assignment Score</h3>
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
            // Show placeholder with 0 values while loading
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Completion Rate</h3>
                <div className="text-3xl font-bold text-orange-400">0%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-orange-400" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Attendance Rate</h3>
                <div className="text-3xl font-bold text-cyan-400">0%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">Avg Assignment Score</h3>
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
          <h2 className="text-xl font-semibold text-zinc-50">Cohort History</h2>
          {cohorts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <h3 className="mb-4 text-lg font-semibold text-cyan-200">{cohort.name}</h3>
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

        {/* Graduate Outcomes */}
        <section className="space-y-4 rounded-xl border border-orange-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-semibold text-orange-200">Graduate Outcomes</h2>
          <p className="text-sm text-zinc-300 sm:text-base">What our students have achieved:</p>
          <ul className="mt-4 space-y-2">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-300 sm:text-base">
                <span className="text-orange-400">✓</span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sats Reward Economy */}
        <section className="space-y-4 rounded-xl border border-purple-500/25 bg-black/80 p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          <h2 className="text-xl font-semibold text-purple-200">Sats Reward Economy</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">150,000+</div>
              <div className="mt-1 text-xs text-zinc-400">Sats Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">120,000+</div>
              <div className="mt-1 text-xs text-zinc-400">Sats Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">270,000+</div>
              <div className="mt-1 text-xs text-zinc-400">Sats Circulated</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            This proves our academy is Bitcoin-native, not just "talking about Bitcoin."
          </p>
        </section>

        {/* Testimonials */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-50">Student Testimonials</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                    <span className="text-xl">{testimonial.photo}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-50">{testimonial.name}</div>
                    <div className="text-xs text-zinc-400">{testimonial.city}</div>
                  </div>
                </div>
                <p className="text-sm italic text-zinc-300">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download Report */}
        <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <h2 className="text-xl font-semibold text-cyan-200">Download Impact Report</h2>
          <p className="mt-2 text-sm text-zinc-300 sm:text-base">
            Get our comprehensive 1–2 page PDF report with mission, results, charts, stats, photos, and quotes.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Essential when applying for grants and partnerships.
          </p>
          <button className="mt-6 rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110">
            Download PDF Report
          </button>
        </section>

        {/* Support Section */}
        <section className="rounded-xl border border-orange-500/25 bg-black/80 p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-semibold text-orange-200">Want to help us expand our impact?</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/donate"
              className="rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Lightning Donate
            </a>
            <a
              href="/apply"
              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Sponsor a Student
            </a>
            <a
              href="/mentorship"
              className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-6 py-3 text-sm font-semibold text-purple-300 transition hover:bg-purple-400/20"
            >
              Apply to Mentor
            </a>
          </div>
        </section>
      </div>
        </div>
      </div>
    </div>
  );
}

