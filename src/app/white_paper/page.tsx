import type { Metadata } from 'next';
import { Noto_Sans_Ethiopic } from 'next/font/google';
import { StructuredData } from '@/components/StructuredData';
import { WhitepaperExperience } from '@/components/whitepaper/WhitepaperExperience';

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  adjustFontFallback: true,
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com').replace(/\/$/, '');
const pagePath = '/white_paper';

const pageDescription =
  'Satoshi Nakamoto’s Bitcoin whitepaper in Tigrinya (ትግርኛ): peer-to-peer electronic cash, proof-of-work, mining (መዓብ), and network design — interactive sections, glossary, diagrams, and learning notes. Eritrean and Horn of Africa learners welcome.';

export const metadata: Metadata = {
  title: 'Bitcoin Whitepaper in Tigrinya — ቢትኮይን | Interactive reader | PanAfrican Bitcoin Academy',
  description: pageDescription,
  keywords: [
    'Bitcoin whitepaper in Tigrinya',
    'ቢትኮይን ብትግርኛ',
    'Bitcoin in Tigrinya',
    'ትግርኛ ቢትኮይን',
    'Eritrea Bitcoin whitepaper',
    'Eritrean Bitcoin Satoshi whitepaper',
    'Satoshi Nakamoto paper Tigrinya',
    'mining in Tigrinya',
    'መዓብ ቢትኮይን',
    'peer-to-peer electronic cash Tigrinya',
    'Bitcoin ኤርትራ',
    'Horn of Africa Bitcoin education',
    'interactive Bitcoin whitepaper',
    'PanAfrican Bitcoin Academy',
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: 'Bitcoin Whitepaper in Tigrinya — Interactive reader | PanAfrican Bitcoin Academy',
    description:
      'Read Satoshi’s Bitcoin paper in Tigrinya: sections, glossary, diagrams, and notes — ቢትኮይን፡ ስርዓት ናይ መዘና-ናብ-መዘና ኤሌክትሮኒካዊ ገንዘብ.',
    url: pagePath,
    siteName: 'PanAfrican Bitcoin Academy',
    locale: 'en_US',
    type: 'article',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan-African Bitcoin Academy — Bitcoin whitepaper in Tigrinya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bitcoin Whitepaper in Tigrinya — Interactive reader',
    description:
      'Satoshi Nakamoto’s paper in ትግርኛ: sections, glossary, mining & network topics — PanAfrican Bitcoin Academy.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Bitcoin: A Peer-to-Peer Electronic Cash System — Tigrinya reader',
  description:
    'Interactive Tigrinya edition of Satoshi Nakamoto’s Bitcoin whitepaper with glossary, diagrams, and educational commentary.',
  url: `${siteUrl}${pagePath}`,
  inLanguage: ['ti', 'en'],
  author: {
    '@type': 'Person',
    name: 'Satoshi Nakamoto',
  },
  publisher: {
    '@type': 'Organization',
    name: 'PanAfrican Bitcoin Academy',
    url: siteUrl,
  },
  about: [
    { '@type': 'Thing', name: 'Bitcoin' },
    { '@type': 'Thing', name: 'Cryptocurrency mining' },
    { '@type': 'Thing', name: 'Peer-to-peer electronic cash' },
  ],
  educationalLevel: 'intermediate',
  isAccessibleForFree: true,
};

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Bitcoin Whitepaper in Tigrinya — PanAfrican Bitcoin Academy',
  description: pageDescription,
  url: `${siteUrl}${pagePath}`,
  inLanguage: ['ti', 'en'],
  isPartOf: { '@type': 'WebSite', name: 'PanAfrican Bitcoin Academy', url: siteUrl },
  primaryImageOfPage: { '@type': 'ImageObject', url: `${siteUrl}/og-image.png` },
};

export default function WhitePaperPage() {
  return (
    <div className={`${notoEthiopic.className} min-w-0`}>
      <StructuredData data={articleJsonLd} />
      <StructuredData data={webPageJsonLd} />
      <WhitepaperExperience />
    </div>
  );
}
