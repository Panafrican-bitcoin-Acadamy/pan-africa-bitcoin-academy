import { Metadata } from 'next';
import { AnimatedSection } from '@/components/AnimatedSection';

export const metadata: Metadata = {
  title: 'About PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy',
  description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn about our mission to provide clear Bitcoin education in Eritrea, Uganda, and across Africa. Join Eritrean Bitcoiners community.',
  keywords: [
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "Bitcoin academy",
    "PanAfrican Bitcoin Academy",
    "Eritrea Bitcoin academy",
    "Eritrea Bitcoin",
    "Eritrean Bitcoiners",
    "first Eritrean Bitcoin education",
    "Asmara Bitcoin education",
    "Uganda Bitcoin education",
    "Bitcoin education mission",
    "Bitcoin in Eritrea",
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy',
    description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn about our mission to provide clear Bitcoin education in Eritrea, Uganda, and across Africa.',
    url: '/about',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan-African Bitcoin Academy - About Us',
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:max-w-7xl sm:mx-auto lg:px-8 lg:py-20">
          {/* Hero */}
          <AnimatedSection animation="slideUp">
            <div className="mb-14 text-center">
              <h1 className="mt-4 text-4xl tracking-tight text-zinc-30 sm:text-5xl lg:text-6xl">
                Understand Bitcoin the right way — through precise explanations, transparent guidance, and meaningful technical depth
              </h1>
            </div>
          </AnimatedSection>

          {/* Core Identity */}
          <AnimatedSection animation="slideUp">
            <section className="mb-12 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-zinc-900 via-cyan-900/20 to-zinc-900 p-8 shadow-[0_0_40px_rgba(14,165,233,0.2)] sm:p-10">
              <div className="w-full sm:max-w-4xl sm:mx-auto text-center">
                <div className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Our Core Identity</p>
                </div>
                <p className="text-xl font-semibold leading-relaxed text-cyan-100 sm:text-2xl lg:text-3xl">
                  Pan-African Bitcoin Academy is an open-source Bitcoin education infrastructure about Bitcoin from first principles and builds long-term technical and contributor capacity in underserved communities.
                </p>
              </div>
            </section>
          </AnimatedSection>

          <div className="space-y-10 text-base text-zinc-100 sm:text-lg">
            {/* Mission */}
            <AnimatedSection animation="slideRight">
              <section className="space-y-3">
              <p className="text-zinc-200">
                Pan-African Bitcoin Academy exists to help people across Africa learn Bitcoin the right way —
                with clarity, honesty, and technical depth. Our mission is to create a trusted learning
                environment where anyone can understand how Bitcoin truly works: keys, UTXOs, transactions,
                mining, blocks, wallets, and responsible self-custody.
              </p>
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-zinc-900 via-cyan-900/20 to-zinc-900 p-5 text-center shadow-[0_0_40px_rgba(14,165,233,0.15)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_32%)]" />
                <p className="relative text-lg font-bold text-cyan-100 sm:text-xl">
                  “The best thing you can do for yourself is to have the knowledge.”
                </p>
              </div>
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100 sm:text-base">
                <p>This is not a hype platform. This is not a trading academy.</p>
                <p className="mt-1 font-semibold">This is a place for real knowledge, real skills, and real empowerment.</p>
              </div>
              </section>
            </AnimatedSection>

            {/* Who it's for */}
            <AnimatedSection animation="slideLeft">
              <section className="rounded-xl border border-orange-500/25 bg-zinc-950/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-orange-200 sm:text-xl">Who this academy is for</h2>
              <div className="mt-4 space-y-6 text-zinc-200">
                <div>
                  <p className="font-semibold text-zinc-100">1) New learners and curious beginners</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300 sm:text-base">
                    <li>Understand Bitcoin deeply as a system, not a price chart</li>
                    <li>Protect yourself from scams and common mistakes</li>
                    <li>Safely use wallets and practice responsible self-custody</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">2) People who want detailed Bitcoin technology</p>
                  <p className="mt-1 text-sm text-zinc-300 sm:text-base">
                    Go beyond “what is Bitcoin?” and get a structured foundation in how the protocol works.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">3) Future Bitcoin and Lightning developers</p>
                  <p className="mt-1 text-sm text-zinc-300 sm:text-base">
                    We don’t run a coding bootcamp, but we provide roadmaps, curated resources, mentor connections,
                    events, hackathons, and guidance to start contributing to Bitcoin Core, wallets, and Lightning.
                  </p>
                </div>
              </div>
              </section>
            </AnimatedSection>

            {/* Support for developers */}
            <AnimatedSection animation="slideRight">
              <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
              <h2 className="text-lg font-semibold text-cyan-200 sm:text-xl">How we support new developers</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200 sm:text-base">
                <li>Curated library of Bitcoin, wallet, and Lightning development resources</li>
                <li>Pathways to Bitcoin Core, Lightning, and wallet builder communities</li>
                <li>Access to mentors, guest speakers, and local/online meetups</li>
                <li>Introductions to open-source projects, events, and hackathons</li>
                <li>Guidance on contributing to wallets, tools, and Bitcoin OSS projects</li>
              </ul>
              </section>
            </AnimatedSection>

            {/* Community */}
            <AnimatedSection animation="slideLeft">
              <section className="rounded-xl border border-green-400/25 bg-green-500/5 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-green-200 sm:text-xl">A growing community — open to all</h2>
              <p className="mt-3 text-zinc-200">
                Connected to the Pan-African and global Bitcoin ecosystem. We welcome mentors,
                guest lecturers, Bitcoin developers, educators, open-source contributors, builders, wallet creators,
                Lightning enthusiasts, and anyone who wants to support African learners.
              </p>
              </section>
            </AnimatedSection>

            {/* Students as contributors */}
            <AnimatedSection animation="slideUp">
              <section className="rounded-xl border border-purple-400/25 bg-purple-500/10 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-purple-100 sm:text-xl">Our students become contributors</h2>
              <p className="mt-3 text-zinc-200">
                Graduates are encouraged to write about their learning journey, share safety lessons, explain the
                challenges they faced, and teach future cohorts. Many go on to mentor, lecture, or contribute to the
                curriculum and community resources.
              </p>
              </section>
            </AnimatedSection>

            {/* What we do not do */}
            <AnimatedSection animation="slideRight">
              <section className="rounded-xl border border-red-400/25 bg-red-500/10 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-red-100 sm:text-xl">What we do NOT do</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200 sm:text-base">
                <li>We do NOT teach trading.</li>
                <li>We do NOT give investment advice or push anyone to invest.</li>
                <li>
                  We focus on knowledge, security, self-custody skills, technical understanding, and scam awareness so
                  you can protect yourself.
                </li>
              </ul>
              </section>
            </AnimatedSection>

            {/* License */}
            <AnimatedSection animation="slideUp">
              <section className="rounded-xl border border-cyan-400/25 bg-black/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                <h2 className="text-lg font-semibold text-cyan-200 sm:text-xl mb-3">Open Source License</h2>
                <p className="text-zinc-200 mb-4">
                  This program is free software: you can redistribute it and/or modify it under the terms of the{" "}
                  <a
                    href="https://www.gnu.org/licenses/gpl-3.0.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    GNU General Public License v3
                  </a>
                  {" "}or (at your option) any later version.
                </p>
                <p className="text-zinc-300 text-sm mb-4">
                  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
                </p>
                <div className="mt-4">
                  <a
                    href="/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    View Full License
                  </a>
                </div>
              </section>
            </AnimatedSection>

            {/* Evolving project */}
            <AnimatedSection animation="slideLeft">
              <section className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">An evolving project</h2>
              <p className="text-zinc-300">
                The academy keeps growing as more students join, mentors participate, developers contribute, and
                communities share resources. Together, we can build a movement of informed, empowered, and technically
                skilled African Bitcoin developers and builders.
              </p>
              </section>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

