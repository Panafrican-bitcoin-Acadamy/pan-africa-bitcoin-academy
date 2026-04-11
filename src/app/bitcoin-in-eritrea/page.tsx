import Link from 'next/link';
import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/AnimatedSection';
import { StructuredData } from '@/components/StructuredData';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com').replace(/\/$/, '');
const pagePath = '/bitcoin-in-eritrea';

export const metadata: Metadata = {
  title: 'Bitcoin in Eritrea — Education & community | PanAfrican Bitcoin Academy',
  description:
    'Learn about Bitcoin in Eritrea with PanAfrican Bitcoin Academy: structured lessons, self-custody skills, and the Eritrean Bitcoin community. Based in Asmara; open to learners across Africa and the diaspora.',
  keywords: [
    'Bitcoin in Eritrea',
    'Eritrea Bitcoin',
    'Eritrean Bitcoiners',
    'Asmara Bitcoin education',
    'Bitcoin education Eritrea',
    'Eritrea Bitcoin academy',
    'ኤርትራ ቢትኮይን',
    'learn Bitcoin Eritrea',
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: 'Bitcoin in Eritrea — Education & community | PanAfrican Bitcoin Academy',
    description:
      'Structured Bitcoin education rooted in Eritrea: lessons, security, and community—not trading hype.',
    url: pagePath,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan-African Bitcoin Academy — Bitcoin education in Eritrea and Africa',
      },
    ],
  },
};

const faqItems = [
  {
    question: 'What is PanAfrican Bitcoin Academy’s connection to Eritrea?',
    answer:
      'We operate as Eritrea’s hub for practical Bitcoin education—focused on how Bitcoin works, secure self-custody, and building skills. Our cohort model and public chapters are designed for clarity and long-term understanding, not speculation.',
  },
  {
    question: 'Can I learn Bitcoin if I live outside Eritrea?',
    answer:
      'Yes. While we are rooted in Asmara and Eritrean learners, our program and free chapter materials serve students across Africa and the Eritrean diaspora. Apply to join a cohort or start with the public chapters.',
  },
  {
    question: 'Is this financial or investment advice?',
    answer:
      'No. We teach education and skills. Nothing on this site is legal, tax, or investment advice. You are responsible for understanding rules that apply to you.',
  },
  {
    question: 'Where do I start?',
    answer:
      'Browse the free Bitcoin chapters for structured explanations, read the FAQ for how the academy works, and apply when you are ready for a mentor-led cohort.',
  },
];

export default function BitcoinInEritreaPage() {
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Bitcoin in Eritrea — PanAfrican Bitcoin Academy',
    description: metadata.description as string,
    url: `${siteUrl}${pagePath}`,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'PanAfrican Bitcoin Academy', url: siteUrl },
    about: [
      { '@type': 'Thing', name: 'Bitcoin' },
      { '@type': 'Place', name: 'Eritrea' },
    ],
    spatialCoverage: { '@type': 'Place', name: 'Eritrea', addressCountry: 'ER' },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <StructuredData data={webPageJsonLd} />
      <StructuredData data={faqJsonLd} />
      <div className="relative z-10 w-full bg-black/95">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 sm:mx-auto sm:max-w-3xl lg:px-8 lg:py-20 lg:max-w-4xl">
          <AnimatedSection animation="slideUp">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              Eritrea · Bitcoin · Education
            </p>
            <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
              Bitcoin in Eritrea
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-300">
              Sound Bitcoin education for Eritreans at home, in the region, and in the diaspora—rooted in{' '}
              <span className="text-cyan-200">Asmara</span> and open across Africa.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-10 space-y-6 text-base leading-relaxed text-zinc-200 sm:text-lg">
              <p>
                People searching for <strong className="font-semibold text-zinc-100">Bitcoin and Eritrea</strong>{' '}
                usually want two things: trustworthy explanations of how Bitcoin works, and a real community that
                prioritizes security and learning over hype. PanAfrican Bitcoin Academy exists for exactly that—we
                are an <strong className="font-semibold text-zinc-100">education-first</strong> academy, not a trading
                signal room.
              </p>
              <p>
                Our curriculum covers foundations—keys, transactions, self-custody, Lightning, and developer
                pathways—so learners can make informed decisions and contribute to open-source Bitcoin over time.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <section className="mt-12 rounded-xl border border-cyan-500/25 bg-zinc-900/50 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-cyan-100 sm:text-2xl">What you can do here</h2>
              <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-300 marker:text-cyan-400">
                <li>
                  <Link href="/chapters" className="text-cyan-300 underline-offset-2 hover:underline">
                    Read free Bitcoin chapters
                  </Link>{' '}
                  — structured lessons you can start today.
                </li>
                <li>
                  <Link href="/apply" className="text-cyan-300 underline-offset-2 hover:underline">
                    Apply for a cohort
                  </Link>{' '}
                  — mentor-led learning with assignments and certificates.
                </li>
                <li>
                  <Link href="/about" className="text-cyan-300 underline-offset-2 hover:underline">
                    Learn our mission and values
                  </Link>{' '}
                  — transparency about what we are (and are not).
                </li>
                <li>
                  <Link href="/contact" className="text-cyan-300 underline-offset-2 hover:underline">
                    Join the community
                  </Link>{' '}
                  — Discord, WhatsApp, and social links.
                </li>
              </ul>
            </section>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <section className="mt-12">
              <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Questions</h2>
              <dl className="mt-6 space-y-6">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                    <dt className="font-medium text-cyan-200">{item.question}</dt>
                    <dd className="mt-2 text-zinc-400">{item.answer}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-zinc-500">
                For program details, see the{' '}
                <Link href="/faq" className="text-cyan-400/90 underline-offset-2 hover:underline">
                  full FAQ
                </Link>
                .
              </p>
            </section>
          </AnimatedSection>

          <AnimatedSection animation="slideUp">
            <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/apply"
                className="inline-flex rounded-full bg-gradient-to-r from-orange-400/90 to-cyan-500/80 px-8 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                Apply to the academy
              </Link>
              <Link
                href="/chapters"
                className="inline-flex rounded-full border border-cyan-400/40 px-8 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/10"
              >
                Start with chapters
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
