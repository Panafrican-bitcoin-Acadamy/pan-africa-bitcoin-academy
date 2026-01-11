import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { ResourceHints } from "@/components/ResourceHints";
import { StructuredData } from "@/components/StructuredData";
import { organizationStructuredData, websiteStructuredData } from "@/lib/structured-data";

// Lazy load Navbar and Footer to reduce initial bundle size
const Navbar = dynamic(() => import("@/components/Navbar").then(mod => ({ default: mod.Navbar })), {
  ssr: true, // Keep SSR for SEO
});

const Footer = dynamic(() => import("@/components/Footer").then(mod => ({ default: mod.Footer })), {
  ssr: true,
});

// AdminModeBadgeWrapper is a client component - use dynamic import
const AdminModeBadgeWrapper = dynamic(() => import("@/components/AdminModeBadgeWrapper").then(mod => ({ default: mod.AdminModeBadgeWrapper })));

// CookieConsent is a client component - use dynamic import
const CookieConsent = dynamic(() => import("@/components/CookieConsent").then((mod) => ({ default: mod.CookieConsent })), {
  ssr: false, // Client-side only since it uses localStorage
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy",
    template: "%s | PanAfrican Bitcoin Academy",
  },
  description:
    "PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners community. Clear lessons, real security, and developer pathways.",
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
    "Bitcoin education Uganda",
    "Bitcoin Kampala",
    "Bitcoin in Uganda",
    "African Bitcoin",
    "Bitcoin Africa",
    "East Africa Bitcoin",
    "Bitcoin education East Africa",
    "Eritrea cryptocurrency",
    "Uganda cryptocurrency",
    "Africa cryptocurrency education",
    "Bitcoin education",
    "Bitcoin learning",
    "Bitcoin developer",
    "Lightning Network",
    "Bitcoin course",
    "cryptocurrency education",
    "blockchain education",
    "Bitcoin training",
    "African Bitcoin education",
    "Bitcoin in Eritrea",
    "Eritrean cryptocurrency",
    "Bitcoin Asmara",
    "Bitcoin Nakfa exchange",
    "Eritrean Bitcoin community",
    "Ugandan Bitcoin community",
    "African Bitcoin community",
  ],
  authors: [{ name: "Pan-African Bitcoin Academy" }],
  creator: "Pan-African Bitcoin Academy",
  publisher: "Pan-African Bitcoin Academy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com'),
  alternates: {
    canonical: '/', // Homepage canonical
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PanAfrican Bitcoin Academy',
    title: 'PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy',
    description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education, convert Bitcoin to Nakfa, join Eritrean Bitcoiners. Clear lessons, real security, and developer pathways.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pan-African Bitcoin Academy - First Eritrea Based Bitcoin Academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa.',
      },
      {
        url: '/images/bitcoin-bg.jpg',
        width: 1920,
        height: 1080,
        alt: 'Bitcoin education background - PanAfrican Bitcoin Academy serving Eritrea, Uganda, and Africa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy',
    description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners. Clear lessons, real security, and developer pathways.',
    images: [
      {
        url: '/og-image.png',
        alt: 'Pan-African Bitcoin Academy - Bitcoin Education in Eritrea, Uganda, and Africa',
      },
      {
        url: '/images/bitcoin-bg.jpg',
        alt: 'Bitcoin education background - Eritrea, Uganda, Africa Bitcoin Academy',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Icons are automatically handled by Next.js App Router via file-based icons:
  // - src/app/icon.png (favicon)
  // - src/app/apple-icon.png (Apple touch icon)
  // - src/app/favicon.ico (fallback favicon)
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical background image for faster loading - SEO optimized */}
        <link
          rel="preload"
          href="/images/bitcoin-bg.jpg"
          as="image"
          fetchPriority="high"
          type="image/jpeg"
        />
        {/* SEO: Background image meta for Eritrea, Uganda, Africa Bitcoin education */}
        <meta
          name="image"
          content="/images/bitcoin-bg.jpg"
        />
        <meta
          property="og:image"
          content="/images/bitcoin-bg.jpg"
        />
        {/* Favicon links */}
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Resource hints for critical origins */}
        <ResourceHints />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} text-zinc-50 antialiased`}
        suppressHydrationWarning
      >
        {/* Structured Data for SEO */}
        <StructuredData data={organizationStructuredData} />
        <StructuredData data={websiteStructuredData} />
        
        {/* Admin Mode Badge - shows on all pages when admin is logged in */}
        <AdminModeBadgeWrapper />
        
        {/* Cookie Consent Popup - shows on first visit */}
        <CookieConsent />
        
        <div className="flex min-h-screen flex-col">
          <Navbar />
          {/* Mobile-first: Full width on mobile, max-width only on larger screens */}
          <main className="flex-1 relative z-10 w-full">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

