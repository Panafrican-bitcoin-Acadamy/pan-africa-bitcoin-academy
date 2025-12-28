import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Music2 } from "lucide-react";
import { StructuredData } from "@/components/StructuredData";
import { AnimatedSection } from "@/components/AnimatedSection";
import { AnimatedList } from "@/components/AnimatedList";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";

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
  { step: "1", title: "Join a cohort", description: "Apply and get accepted into a structured learning program" },
  { step: "2", title: "Attend live sessions", description: "Participate in interactive classes with mentors" },
  { step: "3", title: "Complete practical tasks", description: "Hands-on Bitcoin exercises and assignments" },
  { step: "4", title: "Earn sats + certificate", description: "Get rewarded with Bitcoin and earn your certificate" },
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
      console.error('Error fetching mentors:', error);
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
    console.error('Error fetching mentors:', error);
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
      console.error('Error fetching students:', studentsError);
    }

    // Fetch distinct countries from students
    const { data: studentsData, error: countriesError } = await supabaseAdmin
      .from('students')
      .select('country');

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
    console.error('Error fetching impact stats:', error);
    // Return fallback values
    return {
      studentsTrained: 0,
      satsRewarded: 0,
      countriesRepresented: 0,
    };
  }
}

export default async function Home() {
  const mentors = await getMentors();
  const impactStats = await getImpactStats();
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Full-page Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Background effects */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        
        {/* Hero Content - Aligned to the rightmost column */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="ml-auto max-w-4xl space-y-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
            Scaling Bitcoin adoption
          </h1>
          <p className="text-2xl font-semibold text-orange-400 sm:text-3xl lg:text-4xl">
            Turning the Africa orange
          </p>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Join our hands-on Bitcoin academy designed for Africa. Learn by doing, earn sats, and become part of a growing community of builders.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-8 py-4 text-base font-semibold text-black shadow-[0_0_40px_rgba(249,115,22,0.8)] transition hover:brightness-110"
            >
              👉 Join Cohort
            </Link>
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-full border-2 border-orange-400/50 bg-orange-400/10 px-8 py-4 text-base font-semibold text-orange-300 backdrop-blur-sm transition hover:bg-orange-400/20"
            >
              👉 Explore Learning Paths
            </Link>
          </div>
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

      {/* Content Sections - Full Width */}
      <div className="relative z-10 w-full bg-black/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* 2. How It Started Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-orange-200 sm:text-4xl lg:text-5xl">
                  How It Started: From Bailouts to Blockchain
                </h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg max-w-3xl mx-auto">
                  In 2008, the global financial crisis exposed the fragility of traditional banking. While governments bailed out the banks, ordinary people lost homes, jobs, and savings. Bitcoin was born from this crisis — a decentralized alternative that doesn't require trust in banks or governments.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl rounded-xl overflow-hidden border border-orange-500/25 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
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
            <section className="mb-16 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-zinc-900 via-cyan-900/20 to-zinc-900 p-8 shadow-[0_0_40px_rgba(14,165,233,0.2)] sm:p-10">
              <div className="mx-auto max-w-4xl text-center">
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
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-semibold text-orange-200 sm:text-4xl">Our Mission</h2>
                  <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                    Bitcoin is a tool for sovereignty and economic empowerment — especially in Africa.
                  </p>
                  <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                    Our academy helps people understand, use, and build with Bitcoin through hands-on learning and community support.
                  </p>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
                  >
                    👉 Read Our Mission
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative flex h-64 w-64 items-center justify-center">
                    {/* Logo image with SEO optimization */}
                    <Image
                      src="/images/logo_3.png"
                      alt="Pan-African Bitcoin Academy Logo - First Eritrea Based Bitcoin Academy"
                      width={256}
                      height={256}
                      priority
                      loading="eager"
                      className="object-contain brightness-110 contrast-125 saturate-120"
                      quality={95}
                      sizes="(max-width: 768px) 192px, 256px"
                      fetchPriority="high"
                    />
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* 4. Curriculum Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">What You Will Learn</h2>
              </div>
              <AnimatedList animation="slideUp" className="grid gap-6 sm:grid-cols-3">
                {curriculumCards.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                  >
                    <div className="mb-6 text-5xl">{card.icon}</div>
                    <h3 className="mb-3 text-xl font-semibold text-cyan-200">{card.title}</h3>
                    <p className="text-base text-zinc-400">{card.description}</p>
                  </div>
                ))}
              </AnimatedList>
              <div className="text-center">
                <Link
                  href="/chapters"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  👉 View Full Curriculum
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 5. How It Works Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">How It Works</h2>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">A simple roadmap to your Bitcoin learning journey</p>
              </div>
              <AnimatedList animation="slideLeft" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {howItWorksSteps.map((item, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl border border-purple-500/25 bg-black/80 p-8 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                  >
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-3xl font-bold text-purple-300">
                      {item.step}
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-zinc-50">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                    {index < howItWorksSteps.length - 1 && (
                      <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 translate-x-full text-2xl text-purple-400 lg:block">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </AnimatedList>
              <div className="text-center">
                <Link
                  href="/chapters"
                  className="inline-flex items-center justify-center rounded-lg border border-purple-400/30 bg-purple-400/10 px-6 py-3 text-base font-semibold text-purple-300 transition hover:bg-purple-400/20"
                >
                  👉 See How the Academy Works
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 6. Impact Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 rounded-xl border border-orange-500/25 bg-black/80 p-12 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <div className="text-center">
                <h2 className="mb-12 text-3xl font-semibold text-orange-200 sm:text-4xl">Our Impact</h2>
                <AnimatedList animation="slideUp" className="grid gap-8 sm:grid-cols-3">
                  <div>
                    <div className="text-5xl font-bold text-orange-400 sm:text-6xl">
                      {impactStats.studentsTrained > 0 ? impactStats.studentsTrained : '0'}
                    </div>
                    <div className="mt-4 text-base text-zinc-400">Students trained</div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-orange-400 sm:text-6xl">
                      {impactStats.satsRewarded > 0 
                        ? `${(impactStats.satsRewarded / 1000).toFixed(0)}K+` 
                        : '0'}
                    </div>
                    <div className="mt-4 text-base text-zinc-400">Sats rewarded</div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-orange-400 sm:text-6xl">
                      {impactStats.countriesRepresented > 0 ? impactStats.countriesRepresented : '0'}
                    </div>
                    <div className="mt-4 text-base text-zinc-400">Countries represented</div>
                  </div>
                </AnimatedList>
                <div className="mt-10">
                  <Link
                    href="/impact"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
                  >
                    👉 See Our Impact Dashboard
                  </Link>
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* 7. Community Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8 text-center">
              <div>
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Join Our Community</h2>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Join a growing network of learners, builders, and Bitcoin educators.
                </p>
              </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
              >
                👉 Join WhatsApp Community
              </a>
              <a
                href="https://jumble.social/users/npub1q659nzy6j3mn8nr8ljznzumplesd40276tefj6gjz72npmqqg5cqmh70vv"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-400/30 bg-purple-400/10 px-8 py-4 text-base font-semibold text-purple-300 transition hover:bg-purple-400/20"
                aria-label="Follow on Nostr"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 2L3 13h7.5l-1 9 10.5-11h-7.5l1-9z"/>
                </svg>
                <span>Nostr</span>
              </a>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mt-6">
              <a
                href="https://discord.gg/4G4TUAP7"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
              >
                💬 Join Discord
              </a>
            </div>
            </section>
          </AnimatedSection>

          {/* 8. Mentors Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">
                  Guided by Mentors & Community Leaders
                </h2>
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
                    <h3 className="mb-2 text-xl font-semibold text-zinc-50">{mentor.name}</h3>
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

          {/* 9. Blog Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Student Stories</h2>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Read how our graduates are using Bitcoin, building the future, and contributing to the community.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "How I'm Using Bitcoin to Build Financial Sovereignty",
                    author: "Amina K.",
                    category: "Use Cases",
                    excerpt: "After completing the academy, I've started using Lightning Network for daily transactions...",
                  },
                  {
                    title: "The Future of Bitcoin Development: What Africa Needs",
                    author: "David M.",
                    category: "Development",
                    excerpt: "As a developer, I see huge potential for Bitcoin in Africa. Here's what we need to build...",
                  },
                  {
                    title: "Building a Bitcoin Community in My City",
                    author: "Fatima A.",
                    category: "Community",
                    excerpt: "Starting a local Bitcoin meetup has changed how I see community building...",
                  },
                ].map((post, index) => (
                  <AnimatedSection key={index} animation="slideUp" delay={index * 100}>
                    <Link
                      href="/blog"
                      className="group block rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                        {post.title}
                      </h3>
                      <p className="mb-4 text-sm text-zinc-400">{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>By {post.author}</span>
                        <span>•</span>
                        <span className="text-cyan-300">Read more →</span>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  👉 View All Blog Posts
                </Link>
              </div>
            </section>
          </AnimatedSection>

          {/* 10. Partners & Funders Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32">
              <AnimatedList animation="fadeIn" className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {[
                  {
                    name: "Partner 1",
                    logo: "🏢",
                  },
                  {
                    name: "Partner 2",
                    logo: "🏢",
                  },
                  {
                    name: "Partner 3",
                    logo: "🏢",
                  },
                  {
                    name: "Partner 4",
                    logo: "🏢",
                  },
                ].map((partner, index) => (
                  <div
                    key={index}
                    className="group flex h-32 w-full items-center justify-center rounded-lg border border-cyan-400/25 bg-black/60 p-6 transition hover:border-cyan-400/50 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                  >
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-70 transition group-hover:opacity-100">
                      {partner.logo}
                    </div>
                  </div>
                ))}
              </AnimatedList>
            </section>
          </AnimatedSection>

          {/* 11. Social Media Section */}
          <AnimatedSection animation="slideUp">
            <section className="mb-32 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Connect With Us</h2>
                <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                  Follow us on social media to stay updated with the latest news, events, and Bitcoin education content.
                </p>
              </div>
              <AnimatedList animation="slideLeft" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Facebook",
                  icon: Facebook,
                  url: "https://www.facebook.com/profile.php?id=61585070968194",
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
                    <h3 className="text-sm font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                      {social.name}
                    </h3>
                  </a>
                );
              })}
              </AnimatedList>
            </section>
          </AnimatedSection>

          {/* 12. Donate Preview */}
          <AnimatedSection animation="slideUp">
            <section className="mb-20 rounded-xl border border-orange-500/25 bg-black/80 p-12 text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <h2 className="mb-6 text-3xl font-semibold text-orange-200 sm:text-4xl">Support Our Mission</h2>
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
        </div>
      </div>
      <StructuredData
        data={{
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
        }}
      />
    </div>
  );
}
