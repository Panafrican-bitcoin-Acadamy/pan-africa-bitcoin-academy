import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Music2 } from "lucide-react";
import { StructuredData } from "@/components/StructuredData";
import { AnimatedSection } from "@/components/AnimatedSection";
import { AnimatedHeading } from "@/components/AnimatedHeading";
import { AnimatedList } from "@/components/AnimatedList";
import { HeroHeadline } from "@/components/HeroHeadline";
import { TrueFocus } from "@/components/TrueFocus";
import { UpcomingEventsWithModal } from "@/components/UpcomingEventsWithModal";
import { ImpactStatsCountUp } from "@/components/ImpactStatsCountUp";
import { supabaseAdmin } from "@/lib/supabase";
import { chaptersContent } from "@/content/chaptersContent";
import { getChapterListByTitle } from "@/content/chaptersListContent";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Learn Bitcoin - First Eritrea Based Bitcoin Academy",
  description: "PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners community. Clear lessons, real security, and developer pathways.",
  keywords: [
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "Bitcoin academy",
    "Bitcoin tutorials for beginners",
    "PanAfrican Bitcoin Academy",
    "Eritrea Bitcoin academy",
    "Eritrea Bitcoin",
    "Eritrean Bitcoiners",
    "first Eritrean Bitcoin education",
    "Asmara Bitcoin education",
    "Bitcoin education Asmara",
    "Bitcoin Nakfa",
    "convert Bitcoin to Nakfa",
    "Habesha Bitcoin",
    "Uganda Bitcoin education",
    "Bitcoin in Eritrea",
    "Eritrean cryptocurrency",
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Learn Bitcoin - First Eritrea Based Bitcoin Academy",
    description: "PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education, convert Bitcoin to Nakfa, join Eritrean Bitcoiners. Clear lessons, real security, and developer pathways.",
  },
};

const curriculumCards = [
  {
    title: "Bitcoin Basics",
    description: "Understanding what Bitcoin is, how it works, and why it matters for financial sovereignty.",
    icon: "₿",
  },
  {
    title: "How Bitcoin Works",
    description: "Simple and visual explanations of keys, addresses, UTXOs, transactions, and blocks.",
    icon: "🔗",
  },
  {
    title: "Lightning Skills",
    description: "Learn to use Lightning Network for fast, low-cost Bitcoin transactions.",
    icon: "⚡",
  },
];

const howItWorksSteps = [
  { step: "1", title: "Join a cohort", description: "Apply and get accepted into a structured, mentor-led learning program." },
  { step: "2", title: "Attend live sessions", description: "Join interactive classes and learn directly from Bitcoin educators." },
  { step: "3", title: "Complete practical tasks", description: "Build real skills with hands-on exercises and assignments." },
  { step: "4", title: "Earn sats + certificate", description: "Get paid in Bitcoin for your progress and earn a verified certificate." },
];

// Mentor type definition
type Mentor = {
  name: string;
  role: string;
  description: string;
  image: string | null;
  github: string | null;
  twitter: string | null;
  type: string | null;
};

// Fallback mentors (for initial display or if database fetch fails)
const fallbackMentors: Mentor[] = [
  {
    name: "Yohannes Amanuel",
    role: "Bitcoin Educator & Development Mentor",
    description: "Educates students on Bitcoin fundamentals and mentors Bitcoin development.",
    image: "/images/mentors/yohannes-amanuel.jpg",
    github: "https://github.com/Joie199",
    twitter: "https://twitter.com/joieama",
    type: null,
  },
  {
    name: "Semir Omer",
    role: "Bitcoin Core Mentor & Developer",
    description: "Mentors students in Bitcoin Core development and contributes to the Bitcoin protocol.",
    image: "/images/mentors/semir-omer.jpg",
    github: "https://github.com/samiromer2",
    twitter: "https://twitter.com/samiromer",
    type: null,
  },
  {
    name: "Ojok Emmanuel Nsubuga",
    role: "Software Developer",
    description: "Software developer contributing to Bitcoin wallet development and open-source projects.",
    image: "/images/mentors/ojokne.jpg",
    github: "https://github.com/ojokne",
    twitter: "https://x.com/Ojokne",
    type: null,
  },
];

async function getMentors(): Promise<Mentor[]> {
  try {
    const { data: mentors, error } = await supabaseAdmin
      .from('mentors')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Only log meaningful errors (not empty objects)
      const errorInfo = {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      };
      // Only log if there's actual error information
      if (errorInfo.message || errorInfo.code) {
        console.error('Error fetching mentors:', errorInfo);
      }
      return fallbackMentors;
    }

    // Transform database mentors to match the expected format
    const transformedMentors: Mentor[] = (mentors || []).map((mentor) => ({
      name: mentor.name,
      role: mentor.role,
      description: mentor.description || '',
      image: mentor.image_url || null,
      github: mentor.github || null,
      twitter: mentor.twitter || null,
      type: mentor.type || null,
    }));

    // Merge with fallback mentors (for Yohannes and Semir who might not be in DB yet)
    // Only add fallback if they're not already in the list
    const mentorNames = new Set(transformedMentors.map(m => m.name.toLowerCase()));
    const additionalMentors = fallbackMentors.filter(m => !mentorNames.has(m.name.toLowerCase()));
    
    return [...transformedMentors, ...additionalMentors];
  } catch (error) {
    console.error('Error fetching mentors:', error instanceof Error ? error.message : String(error));
    return fallbackMentors;
  }
}

interface ImpactStats {
  studentsTrained: number;
  satsRewarded: number;
  countriesRepresented: number;
}

async function getImpactStats(): Promise<ImpactStats> {
  try {
    // Fetch total students (all enrolled students, not just graduated)
    const { count: totalStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentsError) {
      // Only log meaningful errors (not empty objects)
      const errorInfo = {
        message: studentsError.message,
        details: studentsError.details,
        hint: studentsError.hint,
        code: studentsError.code,
      };
      // Only log if there's actual error information
      if (errorInfo.message || errorInfo.code) {
        console.error('Error fetching students:', errorInfo);
      }
    }

    // Fetch distinct countries from students
    const { data: studentsData, error: countriesError } = await supabaseAdmin
      .from('students')
      .select('country');

    if (countriesError) {
      console.error('Error fetching student countries:', {
        message: countriesError.message,
        details: countriesError.details,
        hint: countriesError.hint,
        code: countriesError.code,
      });
    }

    let countriesReached = 0;
    if (!countriesError && studentsData) {
      const distinctCountries = new Set(
        studentsData
          .map((s) => s.country)
          .filter((c) => c && c.trim() !== '')
      );
      countriesReached = distinctCountries.size;
    }

    // Fetch sats rewards
    const { data: rewards, error: satsError } = await supabaseAdmin
      .from('sats_rewards')
      .select('amount_paid, amount_pending');

    if (satsError) {
      console.error('Error fetching sats rewards:', {
        message: satsError.message,
        details: satsError.details,
        hint: satsError.hint,
        code: satsError.code,
      });
    }

    let satsRewarded = 0;
    if (!satsError && rewards) {
      rewards.forEach((reward: any) => {
        const paid = reward.amount_paid || 0;
        const pending = reward.amount_pending || 0;
        satsRewarded += paid + pending; // Total sats awarded
      });
    }

    return {
      studentsTrained: totalStudents || 0,
      satsRewarded: satsRewarded || 0,
      countriesRepresented: countriesReached || 0,
    };
  } catch (error) {
    console.error('Error fetching impact stats:', error instanceof Error ? error.message : String(error));
    // Return fallback values
    return {
      studentsTrained: 0,
      satsRewarded: 0,
      countriesRepresented: 0,
    };
  }
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  date: Date;
  dateString: string;
  time: string;
  description: string;
  link: string | null;
  image_url: string | null;
  image_alt_text: string | null;
  is_registration_enabled?: boolean;
  cohort_id?: string | null;
  /** When this event is a cohort session with a topic linked to a chapter (saved in DB as topic) */
  chapter_slug?: string | null;
  chapter_title?: string | null;
  /** Short line about what the topic is about (from chapter hook) */
  topic_detail?: string | null;
  /** What you'll learn (from chapter, first few points) */
  topic_learn?: string[] | null;
  /** Chapter list layout: theory / practice / live session / quiz (from chapters list) */
  topic_theory?: string[] | null;
  topic_practice?: string[] | null;
  topic_live_session?: string | null;
  topic_quiz?: string | null;
}

async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    // Use a 12-hour buffer so events that are "today" in timezones ahead of UTC still get fetched
    const cutoff = new Date(today.getTime() - 12 * 60 * 60 * 1000);
    const cutoffISO = cutoff.toISOString();

    // Fetch all events (for everyone - cohort_id is null) and upcoming cohort sessions
    // Important: Only events with cohort_id = null ("For Everyone" in admin) appear here.
    const [eventsResult, sessionsResult] = await Promise.all([
      supabaseAdmin
        .from('events')
        .select('*')
        .is('cohort_id', null)
        .gte('start_time', cutoffISO)
        .order('start_time', { ascending: true })
        .limit(100),
      // Fetch upcoming cohort sessions
      supabaseAdmin
        .from('cohort_sessions')
        .select('*, cohorts(name)')
        .gte('session_date', today.toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .limit(10),
    ]);

    const upcomingEvents: UpcomingEvent[] = [];

    // Transform events (only include those that haven't started yet)
    if (eventsResult.data) {
      eventsResult.data.forEach((event: any) => {
        const startTime = event.start_time ? new Date(event.start_time) : new Date();
        if (startTime < now) return; // skip past events
        upcomingEvents.push({
          id: event.id,
          title: event.name || 'Untitled Event',
          type: event.type || 'community',
          date: startTime,
          dateString: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          description: event.description || '',
          link: event.link || null,
          image_url: event.image_url || null,
          image_alt_text: event.image_alt_text || null,
          is_registration_enabled: event.is_registration_enabled || false,
          cohort_id: event.cohort_id || null,
        });
      });
    }

    // Transform sessions (topic is stored in DB; match to chapter for link)
    const chapterByTitle = new Map(chaptersContent.map((c) => [c.title, c]));
    if (sessionsResult.data) {
      sessionsResult.data.forEach((session: any) => {
        const sessionDate = new Date(session.session_date);
        const cohortName = session.cohorts?.name || 'Cohort';
        const topic = session.topic || '';
        const chapter = topic ? chapterByTitle.get(topic) ?? null : null;
        const chapterList = topic ? getChapterListByTitle(topic) : null;
        upcomingEvents.push({
          id: `session-${session.id}`,
          title: `${cohortName} - Session ${session.session_number}${topic ? `: ${topic}` : ''}`,
          type: 'live-class',
          date: sessionDate,
          dateString: sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: session.duration_minutes ? `${session.duration_minutes} min` : '60 min',
          description: topic || `Cohort session ${session.session_number}`,
          link: session.link || null,
          image_url: null,
          image_alt_text: null,
          chapter_slug: chapter?.slug ?? null,
          chapter_title: chapter?.title ?? null,
          topic_detail: chapter?.hook ?? null,
          topic_learn: chapter?.learn?.slice(0, 5) ?? null,
          topic_theory: chapterList?.theory ?? null,
          topic_practice: chapterList?.practice ?? null,
          topic_live_session: chapterList?.LiveSession ?? null,
          topic_quiz: chapterList?.quiz ?? null,
        });
      });
    }

    // Sort by date and return top 12 (to show more events from admin)
    const sortedEvents = upcomingEvents
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 12);

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Homepage] Upcoming Events:', {
        totalFetched: upcomingEvents.length,
        totalDisplayed: sortedEvents.length,
        eventsFromDB: eventsResult.data?.length || 0,
        sessionsFromDB: sessionsResult.data?.length || 0,
        todayISO: today.toISOString(),
      });
    }

    return sortedEvents;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

interface Testimonial {
  id: string;
  name: string;
  city: string;
  quote: string;
  rating: number;
  photo: string | null;
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const { data: testimonials, error: testimonialsError } = await supabaseAdmin
      .from('student_testimonials')
      .select('id, testimonial, rating, display_order, is_featured, created_at, student_id')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(6);

    if (testimonialsError || !testimonials || testimonials.length === 0) {
      return [];
    }

    const studentIds = testimonials.map((t: any) => t.student_id);
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, city, country, photo_url')
      .in('id', studentIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return testimonials.map((t: any) => {
      const profile: any = profileMap.get(t.student_id) || {};
      let location = '';
      if (profile.city && profile.country) location = `${profile.city}, ${profile.country}`;
      else if (profile.country) location = profile.country;
      else if (profile.city) location = profile.city;

      return {
        id: t.id,
        name: profile.name || 'Student',
        city: location,
        quote: t.testimonial,
        rating: t.rating || 5,
        photo: profile.photo_url || null,
      };
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

const homeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Pan-African Bitcoin Academy',
  description: 'Learn Bitcoin the right way with clear, technical guidance. Comprehensive Bitcoin education, developer resources, and community support across Africa.',
  url: 'https://panafricanbitcoin.com',
  logo: 'https://panafricanbitcoin.com/images/logo_3.png',
  sameAs: [
    'https://github.com/Joie199/pan-africa-bitcoin-academy',
    'https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji',
    'https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv',
    'https://discord.gg/4G4TUAP7',
    'https://www.facebook.com/profile.php?id=61586743276906',
    'https://x.com/panafricanbtc',
    'https://www.instagram.com/panafricanbitcoin/',
    'https://www.tiktok.com/@panafricanbitcoin',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'UG',
  },
  offers: {
    '@type': 'Offer',
    category: 'Education',
    description: 'Bitcoin education courses and developer training',
  },
};

export default async function Home() {
  const mentors = await getMentors();
  const impactStats = await getImpactStats();
  const upcomingEvents = await getUpcomingEvents();
  const testimonials = await getTestimonials();
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Full-page Hero Section - Edge-to-edge on mobile, fade in on load */}
      <AnimatedSection animation="fadeIn" duration={700} threshold={0.05}>
        <section className="relative flex min-h-screen flex-col items-center justify-center w-full">
          {/* Background effects */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        
        {/* Hero Content - Full width on mobile, max-width only on larger screens */}
        <div className="relative z-10 w-full px-4 space-y-6 sm:space-y-8 text-center sm:max-w-4xl ml-auto lg:px-6">
          <HeroHeadline />
          <p className="w-full text-base sm:text-lg text-zinc-400 leading-relaxed sm:max-w-2xl sm:mx-auto">
            Join our hands-on Bitcoin academy designed for Africa. Learn by doing, earn sats, and become part of a growing community of builders.
          </p>
          {/* Mobile-first: Full width buttons on mobile, side-by-side on larger screens */}
          <div className="flex flex-col items-stretch sm:items-center sm:justify-center gap-3 sm:gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 sm:px-8 py-4 min-h-[52px] text-base font-semibold text-black shadow-[0_0_40px_rgba(249,115,22,0.8)] transition active:brightness-110 active:scale-95 touch-target w-full sm:w-auto"
            >
              👉 Join Cohort
            </Link>
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-full border-2 border-orange-400/50 bg-orange-400/10 px-6 sm:px-8 py-4 min-h-[52px] text-base font-semibold text-orange-300 backdrop-blur-sm transition active:bg-orange-400/20 active:scale-95 touch-target w-full sm:w-auto"
            >
              👉 Explore Learning Paths
            </Link>
          </div>
        </div>

        {/* World Map Visual - Pixelated style */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
          <div className="relative h-full w-full">
            {/* Pixelated world map effect - deterministic pattern */}
            <div className="absolute inset-0 opacity-30" style={{ display: 'grid', gridTemplateColumns: 'repeat(40, 1fr)', gap: '2px' }}>
              {Array.from({ length: 800 }).map((_, i) => {
                // Deterministic pattern based on index
                const x = i % 40;
                const y = Math.floor(i / 40);
                const seed = (x * 7 + y * 13) % 100;
                const isLand = seed < 30; // 30% land
                const isGlow = seed > 95; // 5% glow points
                return (
                  <div
                    key={i}
                    className={`h-2 w-2 ${
                      isGlow
                        ? "bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                        : isLand
                        ? "bg-orange-500/60"
                        : "bg-transparent"
                    }`}
                  />
                );
              })}
            </div>
            {/* Glowing points overlay */}
            <div className="absolute inset-0">
              {[
                { x: "15%", y: "30%" },
                { x: "35%", y: "25%" },
                { x: "50%", y: "35%" },
                { x: "70%", y: "40%" },
                { x: "25%", y: "60%" },
                { x: "60%", y: "65%" },
              ].map((point, i) => (
                <div
                  key={i}
                  className="absolute h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,1)]"
                  style={{
                    left: point.x,
                    top: point.y,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        </section>
      </AnimatedSection>

      {/* Content Sections - Full Width - Edge-to-edge on mobile */}
      <div className="relative z-10 w-full bg-black/60 backdrop-blur-sm">
        {/* Full width on mobile, max-width only on larger screens */}
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20">
          {/* 2. How It Started Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-orange-200 sm:text-4xl lg:text-5xl">
                  How It Started:{' '}
                  <TrueFocus
                    sentence="Bailouts to Blockchain"
                    focusOnlyIndices={[0, 2]}
                    pauseBetweenAnimations={5}
                    blurAmount={5}
                    borderColor="#22d3ee"
                    glowColor="rgba(34, 211, 238, 0.6)"
                    animationDuration={3}
                  />
                </AnimatedHeading>
                <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg w-full sm:max-w-3xl sm:mx-auto">
                  In 2008, the global financial crisis exposed the fragility of traditional banking. While governments bailed out the banks, ordinary people lost homes, jobs, and savings. Bitcoin was born from this crisis — a decentralized alternative that doesn't require trust in banks or governments.
                </p>
              </div>
              <div className="flex items-center justify-center w-full">
                <div className="relative w-full sm:max-w-4xl rounded-xl overflow-hidden border border-orange-500/25 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                  {/* Image container */}
                  <div className="relative w-full bg-gradient-to-br from-zinc-900 via-orange-900/20 to-zinc-900 flex items-center justify-center">
                    {/* Image showing Bitcoin's origin story */}
                    <img 
                      src="/images/bailouts-to-blockchain.jpg" 
                      alt="From Bailouts to Blockchain - Bitcoin's origin story"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* 3. Core Identity */}
          <AnimatedSection animation="slideUp">
            <section className="mb-16 w-full rounded-xl border border-cyan-500/30 bg-gradient-to-r from-zinc-900 via-cyan-900/20 to-zinc-900 p-8 shadow-[0_0_40px_rgba(14,165,233,0.2)] sm:p-10">
              <div className="w-full sm:max-w-4xl sm:mx-auto text-center">
                <div className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Our Core Identity</p>
                </div>
                <p className="text-xl font-semibold leading-relaxed text-cyan-100 sm:text-2xl lg:text-3xl">
                  Pan-African Bitcoin Academy is an open-source Bitcoin education infrastructure that teaches Bitcoin from first principles and builds long-term technical and contributor capacity in underserved communities.
                </p>
              </div>
            </section>
          </AnimatedSection>

          {/* 4. About Preview */}
          <AnimatedSection animation="slideLeft">
            <section className="mb-32 rounded-xl border border-orange-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)] sm:p-12">
              <div className="flex flex-col items-center text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-orange-200 sm:text-4xl">Our Mission</AnimatedHeading>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                  Bitcoin is a tool for sovereignty and economic empowerment — especially in Africa.
                </p>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                  Our academy helps people understand, use, and build with Bitcoin through hands-on learning and community support.
                </p>
                <Link
                  href="/about"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
                >
                  Read Our Mission
                </Link>
                <div className="relative mt-10 flex h-64 w-64 items-center justify-center">
                  <Image
                    src="/images/logo_3.png"
                    alt="Pan-African Bitcoin Academy Logo - First Eritrea Based Bitcoin Academy"
                    width={256}
                    height={256}
                    priority
                    loading="eager"
                    className="object-contain brightness-110 contrast-125 saturate-120"
                    style={{ width: 'auto', height: 'auto' }}
                    quality={95}
                    sizes="(max-width: 768px) 192px, 256px"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* 4. Curriculum Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">What You Will Learn</AnimatedHeading>
              </div>
              <AnimatedList animation="slideUp" className="grid gap-6 sm:grid-cols-3">
                {curriculumCards.map((card, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center rounded-xl border border-cyan-400/25 bg-black/80 p-8 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                  >
                    <div className="mb-6 text-5xl">{card.icon}</div>
                    <AnimatedHeading as="h3" className="mb-3 text-xl font-semibold text-cyan-200">{card.title}</AnimatedHeading>
                    <p className="text-base text-zinc-400">{card.description}</p>
                  </div>
                ))}
              </AnimatedList>
              <div className="text-center">
                <Link
                  href="/chapters"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                >
                 View Full Curriculum
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 5. How It Works Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-12">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">How It Works</AnimatedHeading>
                <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 sm:text-lg">A clear path from sign-up to your first sats and certificate.</p>
              </div>
              <AnimatedList animation="slideLeft" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {howItWorksSteps.map((item, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center text-center rounded-2xl border border-orange-500/20 bg-gradient-to-b from-zinc-900/95 to-black/90 p-8 shadow-[0_0_30px_rgba(249,115,22,0.08)] ring-1 ring-orange-400/5 transition-all duration-300 hover:border-orange-400/40 hover:shadow-[0_0_40px_rgba(249,115,22,0.12)] hover:ring-orange-400/15"
                  >
                    <div className="mb-6 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-cyan-500/30 text-4xl font-bold text-orange-200 shadow-[0_0_24px_rgba(249,115,22,0.2)] ring-2 ring-orange-400/20">
                      {item.step}
                    </div>
                    <AnimatedHeading as="h3" className="mb-3 text-lg font-semibold text-zinc-50 sm:text-xl">{item.title}</AnimatedHeading>
                    <p className="text-sm leading-relaxed text-zinc-400">{item.description}</p>
                    {index < howItWorksSteps.length - 1 && (
                      <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 translate-x-full text-2xl text-orange-400/70 lg:block" aria-hidden>
                        →
                      </div>
                    )}
                  </div>
                ))}
              </AnimatedList>
              <div className="text-center">
                <Link
                  href="/chapters"
                  className="inline-flex items-center justify-center rounded-xl border border-orange-400/40 bg-orange-500/10 px-6 py-3.5 text-base font-semibold text-orange-300 transition hover:bg-orange-500/20 hover:border-orange-400/60"
                >
                  See how the academy works
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 6. Impact Preview */}
          <AnimatedSection animation="slideUp">
            <ImpactStatsCountUp
              studentsTrained={impactStats.studentsTrained}
              satsRewarded={impactStats.satsRewarded}
              countriesRepresented={impactStats.countriesRepresented}
            />
          </AnimatedSection>

          {/* 7. Community Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-10">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Join Our Community</AnimatedHeading>
                <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 sm:text-lg">
                  Connect with learners, builders, and Bitcoin educators across the continent.
                </p>
              </div>

              <AnimatedList animation="slideUp" className="grid gap-5 sm:grid-cols-3">
                {/* WhatsApp */}
                <a
                  href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex flex-col items-center rounded-2xl border border-green-500/20 bg-black/70 px-6 py-8 text-center transition-all duration-300 hover:border-green-400/50 hover:shadow-[0_0_35px_rgba(34,197,94,0.15)] hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                    <svg className="h-7 w-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <AnimatedHeading as="h3" className="mb-1.5 text-lg font-semibold text-zinc-50">WhatsApp</AnimatedHeading>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-400">Daily discussions, peer support, and cohort updates.</p>
                  <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-green-500/10 px-5 py-2 text-sm font-medium text-green-400 ring-1 ring-green-500/25 transition-all group-hover:bg-green-500/20 group-hover:ring-green-400/40">
                    Join Group
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                  </span>
                </a>

                {/* Discord */}
                <a
                  href="https://discord.gg/4G4TUAP7"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex flex-col items-center rounded-2xl border border-indigo-500/20 bg-black/70 px-6 py-8 text-center transition-all duration-300 hover:border-indigo-400/50 hover:shadow-[0_0_35px_rgba(99,102,241,0.15)] hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/20">
                    <svg className="h-7 w-7 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <AnimatedHeading as="h3" className="mb-1.5 text-lg font-semibold text-zinc-50">Discord</AnimatedHeading>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-400">Channels for each cohort, study groups, and live events.</p>
                  <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-5 py-2 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/25 transition-all group-hover:bg-indigo-500/20 group-hover:ring-indigo-400/40">
                    Join Server
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                  </span>
                </a>

                {/* Nostr */}
                <a
                  href="https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex flex-col items-center rounded-2xl border border-purple-500/20 bg-black/70 px-6 py-8 text-center transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_35px_rgba(168,85,247,0.15)] hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                    <svg className="h-7 w-7 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.5 2L3 13h7.5l-1 9 10.5-11h-7.5l1-9z"/>
                    </svg>
                  </div>
                  <AnimatedHeading as="h3" className="mb-1.5 text-lg font-semibold text-zinc-50">Nostr</AnimatedHeading>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-400">Censorship-resistant updates and the Bitcoin conversation.</p>
                  <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-400 ring-1 ring-purple-500/25 transition-all group-hover:bg-purple-500/20 group-hover:ring-purple-400/40">
                    Follow Us
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                  </span>
                </a>
              </AnimatedList>
            </section>
          </AnimatedSection>

          {/* 8. Mentors Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">
                  Guided by Mentors & Community Leaders
                </AnimatedHeading>
              </div>
              <AnimatedList animation="slideLeft" className="flex flex-wrap justify-center items-center gap-6 max-w-7xl mx-auto">
                {mentors.map((mentor, index) => (
                  <div
                    key={index}
                    className="w-full sm:w-auto max-w-sm rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_20px_rgba(34,211,238,0.1)] flex flex-col items-center text-center"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden">
                      {mentor.image ? (
                        <Image
                          src={mentor.image}
                          alt={mentor.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                    <AnimatedHeading as="h3" className="mb-2 text-xl font-semibold text-zinc-50">{mentor.name}</AnimatedHeading>
                    <p className="mb-2 text-base font-medium text-cyan-300">{mentor.role}</p>
                    {mentor.type && (
                      <p className="mb-3 text-xs font-medium text-orange-300">{mentor.type}</p>
                    )}
                    <p className="mb-4 text-sm text-zinc-400 flex-grow">"{mentor.description}"</p>
                    {(mentor.github || mentor.twitter) && (
                      <div className="flex items-center justify-center gap-3 mt-auto pt-4 border-t border-zinc-700 w-full">
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
              <div className="text-center">
                <Link
                  href="/mentorship"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  👉 Meet All Mentors & Volunteers
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 9. Student Testimonials */}
          {testimonials.length > 0 && (
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">What Our Students Say</AnimatedHeading>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Hear from our students about their experience at the academy.
                </p>
              </div>
              <AnimatedList animation="slideUp" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t, index) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] flex flex-col"
                  >
                    <div className="flex items-center gap-0.5 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`h-4 w-4 ${star <= t.rating ? 'text-yellow-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed flex-grow mb-4">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20 overflow-hidden shrink-0">
                        {t.photo ? (
                          <Image src={t.photo} alt={t.name} width={40} height={40} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                        {t.city && <p className="text-xs text-zinc-500">{t.city}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </AnimatedList>
            </section>
          </AnimatedSection>
          )}

          {/* 10. Partners & Funders Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Our Partners &amp; Supporters</AnimatedHeading>
                <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 sm:text-lg">
                  Backed by organizations advancing Bitcoin education across Africa.
                </p>
              </div>
              <div className="relative overflow-hidden py-4">
                <div className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
                <div className="flex animate-scroll-left gap-8 w-max">
                  {[
                    { name: "Bitcoin", icon: "₿", color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/20", text: "text-orange-400" },
                    { name: "Lightning Network", icon: "⚡", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20", text: "text-yellow-400" },
                    { name: "Open Source", icon: "🌍", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20", text: "text-cyan-400" },
                    { name: "Africa Dev", icon: "🌐", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20", text: "text-green-400" },
                    { name: "Education Fund", icon: "🎓", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20", text: "text-purple-400" },
                    { name: "Community", icon: "🤝", color: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20", text: "text-pink-400" },
                    { name: "Bitcoin", icon: "₿", color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/20", text: "text-orange-400" },
                    { name: "Lightning Network", icon: "⚡", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20", text: "text-yellow-400" },
                    { name: "Open Source", icon: "🌍", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20", text: "text-cyan-400" },
                    { name: "Africa Dev", icon: "🌐", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20", text: "text-green-400" },
                    { name: "Education Fund", icon: "🎓", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20", text: "text-purple-400" },
                    { name: "Community", icon: "🤝", color: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20", text: "text-pink-400" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`flex shrink-0 items-center gap-4 rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} px-8 py-5 transition hover:scale-105`}
                    >
                      <span className="text-4xl">{p.icon}</span>
                      <span className={`text-sm font-semibold ${p.text} whitespace-nowrap`}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* 11. Social Media Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Connect With Us</AnimatedHeading>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Follow us on social media to stay updated with the latest news, events, and Bitcoin education content.
                </p>
              </div>
              <AnimatedList animation="slideLeft" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Facebook",
                  icon: Facebook,
                  url: "https://www.facebook.com/profile.php?id=61586743276906",
                  color: "hover:bg-blue-500/20",
                },
                {
                  name: "X (Twitter)",
                  icon: Twitter,
                  url: "https://x.com/panafricanbtc",
                  color: "hover:bg-slate-500/20",
                },
                {
                  name: "Instagram",
                  icon: Instagram,
                  url: "https://www.instagram.com/panafricanbitcoin/",
                  color: "hover:bg-pink-500/20",
                },
                {
                  name: "TikTok",
                  icon: Music2,
                  url: "https://www.tiktok.com/@panafricanbitcoin",
                  color: "hover:bg-purple-500/20",
                },
              ].map((social, index) => {
                const IconComponent = social.icon;

                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group flex flex-col items-center justify-center rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] ${social.color}`}
                  >
                    {IconComponent && (
                      <IconComponent className="mb-3 h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition" />
                    )}
                    <AnimatedHeading as="h3" className="text-sm font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                      {social.name}
                    </AnimatedHeading>
                  </a>
                );
              })}
              </AnimatedList>
            </section>
          </AnimatedSection>

          {/* 12. Donate Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-20 rounded-xl border border-orange-500/25 bg-black/80 p-12 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <AnimatedHeading as="h2" className="mb-6 text-3xl font-semibold text-orange-200 sm:text-4xl">Support Our Mission</AnimatedHeading>
              <p className="mb-8 text-base text-zinc-300 sm:text-lg">
                Support our mission to expand Bitcoin education across Africa.
              </p>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-8 py-4 text-base font-semibold text-black transition hover:brightness-110"
              >
                👉 Support the Academy
              </Link>
            </section>
          </AnimatedSection>

          {/* 13. Upcoming Events */}
          <AnimatedSection animation="slideUp">
            <section className="mb-20 space-y-8">
              <div className="text-center">
                <AnimatedHeading as="h2" className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Upcoming Events</AnimatedHeading>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Join our upcoming sessions and workshops.
                </p>
              </div>
              <UpcomingEventsWithModal
                events={upcomingEvents.map((e) => ({
                  id: e.id,
                  title: e.title,
                  type: e.type,
                  dateString: e.dateString,
                  time: e.time,
                  description: e.description,
                  link: e.link,
                  image_url: e.image_url,
                  image_alt_text: e.image_alt_text,
                  is_registration_enabled: e.is_registration_enabled,
                  cohort_id: e.cohort_id,
                  chapter_slug: e.chapter_slug ?? null,
                  chapter_title: e.chapter_title ?? null,
                  topic_detail: e.topic_detail ?? null,
                  topic_learn: e.topic_learn ?? null,
                  topic_theory: e.topic_theory ?? null,
                  topic_practice: e.topic_practice ?? null,
                  topic_live_session: e.topic_live_session ?? null,
                  topic_quiz: e.topic_quiz ?? null,
                }))}
              />
              <div className="text-center">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  👉 Join a Cohort
                </Link>
              </div>
            </section>
          </AnimatedSection>
        </div>
      </div>
      <StructuredData data={homeStructuredData} />
      <Analytics />
    </div>
  );
}
