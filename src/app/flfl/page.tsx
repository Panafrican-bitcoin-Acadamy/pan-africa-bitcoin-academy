import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/AnimatedSection';
import { StructuredData } from '@/components/StructuredData';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com').replace(/\/$/, '');
const pagePath = '/flfl';

export const metadata: Metadata = {
  title: 'FLFL Expo 2026 Sponsorship Proposal | PanAfrican Bitcoin Academy',
  description:
    'Pan-African Bitcoin Academy seeks sponsorship for FLFL Expo 2026 in Kampala, Uganda — introducing Bitcoin education to the Eritrean community through workshops, demonstrations, and grassroots circular economy initiatives.',
  keywords: [
    'FLFL Expo 2026',
    'FLFL Expo sponsorship',
    'Bitcoin education Eritrea',
    'Eritrean community Uganda',
    'Kampala Bitcoin workshop',
    'Pan-African Bitcoin Academy',
    'FLFL tech',
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: 'FLFL Expo 2026 Sponsorship Proposal | PanAfrican Bitcoin Academy',
    description:
      'Support practical Bitcoin education at FLFL Expo 2026 — workshops, demonstrations, and community engagement in Kampala, Uganda.',
    url: pagePath,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan-African Bitcoin Academy — FLFL Expo 2026 Sponsorship',
      },
    ],
  },
};

const planItems = [
  'Host introductory Bitcoin workshops for people who are new to Bitcoin.',
  'Run sessions on What Is Bitcoin? and The History of Money.',
  'Demonstrate how Bitcoin works and answer questions from attendees.',
  'Host a dedicated workshop for businesses and vendors to introduce Bitcoin, explain how Bitcoin payments work, and explore practical ways Bitcoin can benefit their businesses.',
  'Introduce attendees to practical Bitcoin use through demonstrations and educational activities.',
  'Begin developing a Bitcoin circular economy within the event by connecting participating vendors, educators, and attendees.',
];

const sponsorshipNeeds = [
  {
    title: 'Event setup and branding',
    description:
      'Banners, event signage, branded table/display materials, stickers, promotional materials, flyers, brochures, and staff identification.',
  },
  {
    title: 'Educational materials',
    description:
      'Development and production of materials for Bitcoin and History of Money workshops, including handouts and learning resources.',
  },
  {
    title: 'Sats giveaways',
    description:
      'Small amounts of sats for hands-on demonstrations, interactive learning, and participant engagement.',
  },
  {
    title: 'Workshop materials',
    description:
      'Resources needed to deliver practical Bitcoin demonstrations, activities, and educational sessions.',
  },
  {
    title: 'Community outreach',
    description:
      'Materials and activities that help us engage vendors, businesses, and attendees and introduce them to Bitcoin.',
  },
  {
    title: 'Event participation and logistics',
    description:
      'Costs associated with representing Pan-African Bitcoin Academy at FLFL Expo, including staff and volunteer support, transportation, and other necessary event-related expenses.',
  },
];

const previousVideos = [
  {
    label: 'Previous event videos on facebook ',
    href: 'https://www.facebook.com/reel/1378530967495031',
  }, 
  {
    label: '2025 event video on YouTube',
    href: 'https://www.youtube.com/watch?v=F_cOAkq2jB4&t=2211s',
  },
  {
    label: '2025 kids playground YouTube',
    href: 'https://www.youtube.com/watch?v=NuQnoFcneLg&t=198s',
  },
  {
    label: 'More 2025 videos on YouTube',
    href: 'https://www.youtube.com/watch?v=j_uHKXQn4IA&t=289s',
  },
];

const eventDetails = [
  { label: 'Event', value: 'FLFL Expo 2026' },
  { label: 'Dates', value: '18–20 September 2026' },
  { label: 'Location', value: 'Kansanga, Kampala, Uganda' },
  { label: 'Organizer', value: 'FLFL tech' },
  {
    label: 'Pan-African Bitcoin Academy',
    value: 'www.panafricanbitcoin.com',
    href: 'https://www.panafricanbitcoin.com',
  },
];

function SectionCard({
  title,
  children,
  accent = 'cyan',
}: {
  title: string;
  children: React.ReactNode;
  accent?: 'cyan' | 'orange';
}) {
  const borderClass =
    accent === 'orange' ? 'border-orange-500/25' : 'border-cyan-500/25';
  const titleClass = accent === 'orange' ? 'text-orange-100' : 'text-cyan-100';

  return (
    <section className={`rounded-xl border ${borderClass} bg-zinc-900/50 p-6 sm:p-8`}>
      <h2 className={`text-xl font-semibold sm:text-2xl ${titleClass}`}>{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
        {children}
      </div>
    </section>
  );
}

export default function FlflPage() {
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'FLFL Expo 2026 Sponsorship Proposal — PanAfrican Bitcoin Academy',
    description: metadata.description as string,
    url: `${siteUrl}${pagePath}`,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'PanAfrican Bitcoin Academy', url: siteUrl },
    about: [
      { '@type': 'Thing', name: 'Bitcoin education' },
      { '@type': 'Event', name: 'FLFL Expo 2026' },
    ],
    spatialCoverage: { '@type': 'Place', name: 'Kansanga, Kampala, Uganda' },
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <StructuredData data={webPageJsonLd} />
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:mx-auto sm:max-w-3xl lg:px-8 lg:py-20 lg:max-w-4xl">
          <AnimatedSection animation="slideUp">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              FLFL Expo 2026 · Kampala · Sponsorship
            </p>
            <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
              FLFL Expo 2026 Sponsorship Proposal
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-zinc-300">
              We are seeking sponsorship to support our participation at FLFL Expo 2026, where we aim to
              introduce Bitcoin education to the Eritrean community, engage with local businesses, and take
              the first steps toward building a grassroots Bitcoin circular economy through in-person
              workshops and demonstrations.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-12">
              <SectionCard title="About the Event">
                <p>
                  FLFL Expo 2026 is a major event within the Eritrean community, bringing together
                  businesses, organizations, entrepreneurs, and community members.
                </p>
                <p>
                  The three-day event will take place{' '}
                  <strong className="font-semibold text-zinc-100">18–20 September 2026</strong> in{' '}
                  <strong className="font-semibold text-zinc-100">Kansanga, Kampala, Uganda</strong>.
                </p>
                <p>
                  The event provides a platform for participants to showcase their products, introduce
                  their companies, connect with the community, and build new relationships.
                </p>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-8">
              <SectionCard title="Previous Editions">
                <p>
                  The event has been held in previous years and has brought together a large and diverse
                  audience from the Eritrean community.
                </p>
                <p>
                  Highlights, presentations, and activities from previous editions can be found through
                  different YouTube channels and social media platforms, providing a glimpse of the event&apos;s scale and impact. 
                  check out the links below for videos from previous editions.:
                </p>
                <div className="mt-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/90">
                      Previous event videos
                    </h3>
                    <ul className="mt-2 list-inside list-disc space-y-1.5 marker:text-cyan-400">
                      {previousVideos.map((video) => (
                        <li key={video.label}>
                          <a
                            href={video.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 underline-offset-2 hover:underline"
                          >
                            {video.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-xl border border-cyan-500/20 bg-zinc-950/80 p-2 sm:p-3 shadow-lg">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
                    <video
                      controls
                      preload="metadata"
                      className="h-full w-full object-contain rounded-lg"
                    >
                      <source src="/images/flflvideo.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="mt-2 text-center text-xs text-zinc-400 font-medium">
                    FLFL Expo Event Video Preview
                  </p>
                </div>
                <p className="text-sm text-zinc-400">
                  These previous editions provide a picture of the event&apos;s audience, activities, and
                  opportunities for participating organizations and businesses.
                </p>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-8">
              <SectionCard title="Our Plan">
                <p>
                  As a Bitcoin education community, we see FLFL Expo as an opportunity to introduce
                  Bitcoin to the Eritrean community through practical, accessible, in-person education.
                </p>
                <p>
                  Pan-African Bitcoin Academy has already been delivering structured Bitcoin courses to
                  learners. This event gives us an opportunity to take that education beyond the classroom
                  and engage directly with the wider community.
                </p>
                <p>During the three-day event, we plan to:</p>
                <ul className="list-inside list-disc space-y-2 marker:text-cyan-400">
                  {planItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-8">
              <SectionCard title="The Bigger Vision" accent="orange">
                <p>
                  We see FLFL Expo as more than a one-time workshop. It can serve as a first step toward
                  building a stronger Bitcoin community and circular economy within the Eritrean community.
                </p>
                <p>
                  With businesses, vendors, entrepreneurs, and community members gathered in one place,
                  the event provides an opportunity to demonstrate how Bitcoin can move from an
                  educational topic to something people can understand, explore, and potentially use in
                  everyday commerce.
                </p>
                <p>
                  Our goal is to use this event as an initial step toward a larger, ongoing Bitcoin
                  education and community initiative.
                </p>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-8">
              <SectionCard title="Why We Need a Sponsor">
                <p>
                  To make this initiative possible, we are looking for support for the following:
                </p>
                <ol className="mt-2 space-y-4">
                  {sponsorshipNeeds.map((need, index) => (
                    <li key={need.title} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <span className="font-medium text-cyan-200">
                        {index + 1}. {need.title}
                      </span>
                      <p className="mt-1.5 text-base text-zinc-400">{need.description}</p>
                    </li>
                  ))}
                </ol>
                <p>
                  By sponsoring this initiative, you would support the introduction of practical Bitcoin
                  education to the Eritrean community and help us take the next step from online education
                  to real-world community engagement.
                </p>
                <p>
                  We are looking for a partner who believes in education, open-source knowledge, and
                  building stronger Bitcoin communities in Africa.
                </p>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-8">
              <SectionCard title="Event Details">
                <dl className="space-y-3">
                  {eventDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="flex flex-col gap-0.5 border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0 sm:flex-row sm:gap-4"
                    >
                      <dt className="min-w-[11rem] shrink-0 text-sm font-medium text-zinc-500">
                        {detail.label}
                      </dt>
                      <dd className="text-zinc-200">
                        {'href' in detail && detail.href ? (
                          <a
                            href={detail.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 underline-offset-2 hover:underline"
                          >
                            {detail.value}
                          </a>
                        ) : (
                          detail.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-10 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-zinc-900/80 p-3 sm:p-4 shadow-2xl shadow-cyan-950/40">
              <div className="relative w-full overflow-hidden rounded-xl bg-zinc-950 flex justify-center">
                <Image
                  src="/images/flfl.png"
                  alt="Official FLFL Expo 2026 Event Poster"
                  width={1080}
                  height={1350}
                  className="w-full h-auto object-contain rounded-xl transition-transform duration-300 hover:scale-[1.01]"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-xs sm:text-sm text-zinc-400 font-medium">
                Official FLFL Expo 2026 Event Poster · Kansanga, Kampala, Uganda
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-16 rounded-3xl border border-orange-500/30 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 p-8 sm:p-12 text-center shadow-2xl shadow-orange-950/30 backdrop-blur-md">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/logo_3.png"
                  alt="PanAfrican Bitcoin Academy Logo"
                  width={90}
                  height={120}
                  className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-transform duration-300 hover:scale-105"
                />
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-50">
                Every Sat Helps
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-zinc-300 leading-relaxed">
                Every sat contributed helps us provide Bitcoin education and make the experience more accessible to the community.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <Link
                  href="/donate"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-400 px-10 py-4 text-base sm:text-lg font-bold text-zinc-950 shadow-xl shadow-orange-500/25 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Become a sponsor
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-2 border-cyan-400/80 bg-cyan-950/50 px-10 py-4 text-base sm:text-lg font-bold text-cyan-200 shadow-xl shadow-cyan-950/50 transition-all duration-300 hover:bg-cyan-500/20 hover:border-cyan-300 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Get in touch
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
