import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
    default: "Pan-African Bitcoin Academy",
    template: "%s | Pan-African Bitcoin Academy",
  },
  description:
    "Learn Bitcoin the right way with clear, technical guidance. Pan-African Bitcoin Academy offers comprehensive Bitcoin education, developer resources, and community support across Africa.",
  keywords: [
    "Bitcoin education",
    "Bitcoin academy",
    "Bitcoin learning",
    "Bitcoin Africa",
    "Bitcoin developer",
    "Lightning Network",
    "Bitcoin course",
    "cryptocurrency education",
    "blockchain education",
    "Bitcoin training",
  ],
  authors: [{ name: "Pan-African Bitcoin Academy" }],
  creator: "Pan-African Bitcoin Academy",
  publisher: "Pan-African Bitcoin Academy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Pan-African Bitcoin Academy',
    title: 'Pan-African Bitcoin Academy - Learn Bitcoin the Right Way',
    description: 'Learn Bitcoin the right way with clear, technical guidance. Comprehensive Bitcoin education, developer resources, and community support across Africa.',
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
    title: 'Pan-African Bitcoin Academy - Learn Bitcoin the Right Way',
    description: 'Learn Bitcoin the right way with clear, technical guidance. Comprehensive Bitcoin education and developer resources.',
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
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-zinc-50 antialiased`}
        suppressHydrationWarning
      >
        {/* Bitcoin Background Elements */}
        <div className="bitcoin-keys-bg" />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1 relative z-10">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

