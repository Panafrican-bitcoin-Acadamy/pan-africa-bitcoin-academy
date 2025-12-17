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
    "Eritrea investment",
    "Bitcoin Nakfa",
    "convert Bitcoin to Nakfa",
    "Habesha Bitcoin",
    "Uganda Bitcoin education",
    "Bitcoin education",
    "Bitcoin learning",
    "Bitcoin developer",
    "Lightning Network",
    "Bitcoin course",
    "cryptocurrency education",
    "blockchain education",
    "Bitcoin training",
    "Bitcoin Africa",
    "African Bitcoin education",
    "Bitcoin in Eritrea",
    "Eritrean cryptocurrency",
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
        alt: 'Pan-African Bitcoin Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PanAfrican Bitcoin Academy - First Eritrea Based Bitcoin Academy',
    description: 'PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Learn Bitcoin education, convert Bitcoin to Nakfa, join Eritrean Bitcoiners. Clear lessons, real security, and developer pathways.',
    images: ['/og-image.png'],
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
        {/* Resource hints for critical origins */}
        <ResourceHints />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-zinc-50 antialiased`}
        suppressHydrationWarning
      >
        {/* Structured Data for SEO */}
        <StructuredData data={organizationStructuredData} />
        <StructuredData data={websiteStructuredData} />
        
        {/* Bitcoin Background Elements */}
        <div className="bitcoin-keys-bg" />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

