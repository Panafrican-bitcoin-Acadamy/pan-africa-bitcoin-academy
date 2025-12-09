import Link from "next/link";

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

const mentors = [
  {
    name: "Aisha",
    role: "Lightning Mentor",
    description: "Supports students during live sessions and helps review assignments.",
  },
  {
    name: "Daniel",
    role: "Community Volunteer",
    description: "Helps onboard new students and provides guidance in the chat.",
  },
  {
    name: "Sarah",
    role: "Bitcoin Educator",
    description: "Teaches core concepts and guides students through practical exercises.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Full-page Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Background effects */}
        <div className="absolute inset-0 bitcoin-network-lines" />
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        
        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-5xl space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
            Scaling Bitcoin adoption
          </h1>
          <p className="text-2xl font-semibold text-orange-400 sm:text-3xl lg:text-4xl">
            Turning the world orange
          </p>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Join our hands-on Bitcoin academy designed for Africa. Learn by doing, earn sats, and become part of a growing community of builders.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-8 py-4 text-base font-semibold text-black shadow-[0_0_40px_rgba(249,115,22,0.8)] transition hover:brightness-110"
            >
              👉 Join Cohort 1
            </Link>
            <Link
              href="/chapters"
              className="inline-flex items-center justify-center rounded-full border-2 border-orange-400/50 bg-orange-400/10 px-8 py-4 text-base font-semibold text-orange-300 backdrop-blur-sm transition hover:bg-orange-400/20"
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

      {/* Content Sections - Full Width */}
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* 2. About Preview */}
          <section className="mb-32 rounded-xl border border-orange-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(249,115,22,0.2)] sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-orange-200 sm:text-4xl">Our Mission</h2>
                <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                  Bitcoin is a tool for financial freedom — especially in Africa.
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
                  {/* Outer glow rings */}
                  <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-2xl animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-orange-400/10 blur-3xl" />
                  
                  {/* Geometric borders */}
                  <div className="absolute inset-4 rounded-2xl border-4 border-orange-400/50 rotate-45" />
                  <div className="absolute inset-6 rounded-2xl border-2 border-orange-300/30 -rotate-45" />
                  
                  {/* Main B container */}
                  <div className="relative z-10 flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-[0_0_60px_rgba(249,115,22,0.8)]">
                    <span className="text-8xl font-black text-black tracking-tight">B</span>
                  </div>
                  
                  {/* Corner accents */}
                  <div className="absolute top-8 left-8 h-4 w-4 rounded-full bg-orange-400/60 blur-sm" />
                  <div className="absolute bottom-8 right-8 h-4 w-4 rounded-full bg-orange-400/60 blur-sm" />
                  <div className="absolute top-8 right-8 h-3 w-3 rounded-full bg-cyan-400/40 blur-sm" />
                  <div className="absolute bottom-8 left-8 h-3 w-3 rounded-full bg-cyan-400/40 blur-sm" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Curriculum Preview */}
          <section className="mb-32 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">What You Will Learn</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
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
            </div>
            <div className="text-center">
              <Link
                href="/chapters"
                className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                👉 View Full Curriculum
              </Link>
            </div>
          </section>

          {/* 4. How It Works Preview */}
          <section className="mb-32 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">How It Works</h2>
              <p className="mt-4 text-base text-zinc-400 sm:text-lg">A simple roadmap to your Bitcoin learning journey</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
            <div className="text-center">
              <Link
                href="/chapters"
                className="inline-flex items-center justify-center rounded-lg border border-purple-400/30 bg-purple-400/10 px-6 py-3 text-base font-semibold text-purple-300 transition hover:bg-purple-400/20"
              >
                👉 See How the Academy Works
              </Link>
            </div>
          </section>

          {/* 5. Impact Preview */}
          <section className="mb-32 rounded-xl border border-orange-500/25 bg-black/80 p-12 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <div className="text-center">
              <h2 className="mb-12 text-3xl font-semibold text-orange-200 sm:text-4xl">Our Impact</h2>
              <div className="grid gap-8 sm:grid-cols-3">
                <div>
                  <div className="text-5xl font-bold text-orange-400 sm:text-6xl">12</div>
                  <div className="mt-4 text-base text-zinc-400">Students trained</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-orange-400 sm:text-6xl">80,000+</div>
                  <div className="mt-4 text-base text-zinc-400">Sats rewarded</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-orange-400 sm:text-6xl">3</div>
                  <div className="mt-4 text-base text-zinc-400">Countries represented</div>
                </div>
              </div>
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

          {/* 6. Community Preview */}
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
                href="https://nostr.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-purple-400/30 bg-purple-400/10 px-8 py-4 text-base font-semibold text-purple-300 transition hover:bg-purple-400/20"
              >
                👉 Follow on Nostr
              </a>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mt-6">
              <a
                href="https://discord.gg/bitcoinacademy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
              >
                💬 Join Discord
              </a>
            </div>
          </section>

          {/* 7. Mentors Preview */}
          <section className="mb-32 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">
                Guided by Mentors & Community Leaders
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {mentors.map((mentor, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-zinc-50">{mentor.name}</h3>
                  <p className="mb-4 text-base font-medium text-cyan-300">{mentor.role}</p>
                  <p className="text-sm text-zinc-400">"{mentor.description}"</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/mentorship"
                className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                👉 Meet All Mentors & Volunteers
              </Link>
            </div>
          </section>

          {/* 8. Blog Preview */}
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
                <Link
                  key={index}
                  href="/blog"
                  className="group rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
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

          {/* 9. Partners & Funders Section */}
          <section className="mb-32">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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
            </div>
          </section>

          {/* 10. Social Media Section */}
          <section className="mb-32 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl lg:text-5xl">Connect With Us</h2>
              <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                Follow us on social media to stay updated with the latest news, events, and Bitcoin education content.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Twitter / X",
                  icon: "𝕏",
                  url: "https://twitter.com/bitcoinacademy",
                  color: "hover:bg-zinc-800",
                },
                {
                  name: "Nostr",
                  icon: "🔗",
                  url: "https://nostr.com",
                  color: "hover:bg-purple-500/20",
                },
                {
                  name: "WhatsApp",
                  icon: "📱",
                  url: "https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji",
                  color: "hover:bg-green-500/20",
                },
                {
                  name: "LinkedIn",
                  icon: "💼",
                  url: "https://linkedin.com/company/bitcoinacademy",
                  color: "hover:bg-blue-500/20",
                },
                {
                  name: "YouTube",
                  icon: "▶️",
                  url: "https://youtube.com/@bitcoinacademy",
                  color: "hover:bg-red-500/20",
                },
                {
                  name: "GitHub",
                  icon: "💻",
                  url: "https://github.com/bitcoinacademy",
                  color: "hover:bg-zinc-700",
                },
                {
                  name: "Discord",
                  icon: "💬",
                  url: "https://discord.gg/bitcoinacademy",
                  color: "hover:bg-indigo-500/20",
                },
                {
                  name: "Instagram",
                  icon: "📷",
                  url: "https://instagram.com/bitcoinacademy",
                  color: "hover:bg-pink-500/20",
                },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col items-center justify-center rounded-xl border border-cyan-400/25 bg-black/80 p-6 text-center transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] ${social.color}`}
                >
                  <div className="mb-3 text-4xl">{social.icon}</div>
                  <h3 className="text-sm font-semibold text-zinc-50 group-hover:text-cyan-200 transition">
                    {social.name}
                  </h3>
                </a>
              ))}
            </div>
          </section>

          {/* 11. Donate Preview */}
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
        </div>
      </div>
    </div>
  );
}
