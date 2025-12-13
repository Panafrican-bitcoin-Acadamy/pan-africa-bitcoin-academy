import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Bitcoin Tutorials for Beginners - Learn Bitcoin Step by Step',
  description: 'Bitcoin tutorials for beginners at PanAfrican Bitcoin Academy. Learn Bitcoin step by step with clear lessons, real security, and developer pathways. Comprehensive Bitcoin education in Africa.',
  keywords: [
    "Bitcoin tutorials for beginners",
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "Bitcoin academy",
    "Bitcoin step by step",
    "PanAfrican Bitcoin Academy",
  ],
  openGraph: {
    title: 'Bitcoin Tutorials for Beginners - Learn Bitcoin Step by Step',
    description: 'Bitcoin tutorials for beginners at PanAfrican Bitcoin Academy. Learn Bitcoin step by step with clear lessons and real security.',
    url: '/chapters',
  },
};

export default function ChaptersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

