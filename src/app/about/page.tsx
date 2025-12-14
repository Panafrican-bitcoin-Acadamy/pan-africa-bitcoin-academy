import { Metadata } from 'next';

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
  },
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
              Pan-Africa Bitcoin Academy
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Understand Bitcoin the right way — through precise explanations, transparent guidance, and meaningful technical depth
            </h1>
          </div>

          <div className="space-y-10 text-base text-zinc-100 sm:text-lg">
            {/* Mission */}
            <section className="space-y-3">
              <p className="text-zinc-200">
                Pan-Africa Bitcoin Academy exists to help people across Africa learn Bitcoin the right way —
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

            {/* Who it's for */}
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

            {/* Support for developers */}
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

            {/* Community */}
            <section className="rounded-xl border border-green-400/25 bg-green-500/5 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-green-200 sm:text-xl">A growing community — open to all</h2>
              <p className="mt-3 text-zinc-200">
                Built in Uganda and connected to the Pan-African and global Bitcoin ecosystem. We welcome mentors,
                guest lecturers, Bitcoin developers, educators, open-source contributors, builders, wallet creators,
                Lightning enthusiasts, and anyone who wants to support African learners.
              </p>
            </section>

            {/* Students as contributors */}
            <section className="rounded-xl border border-purple-400/25 bg-purple-500/10 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-purple-100 sm:text-xl">Our students become contributors</h2>
              <p className="mt-3 text-zinc-200">
                Graduates are encouraged to write about their learning journey, share safety lessons, explain the
                challenges they faced, and teach future cohorts. Many go on to mentor, lecture, or contribute to the
                curriculum and community resources.
              </p>
            </section>

            {/* What we do not do */}
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

            {/* Evolving project */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">An evolving project</h2>
              <p className="text-zinc-300">
                The academy keeps growing as more students join, mentors participate, developers contribute, and
                communities share resources. Together, we can build a movement of informed, empowered, and technically
                skilled African Bitcoin developers and builders.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

