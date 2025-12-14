import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Bitcoin Tutorials for Beginners - Learn Bitcoin Step by Step',
  description: 'Bitcoin tutorials for beginners at PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Learn Bitcoin step by step with clear lessons, real security, and developer pathways. Comprehensive Bitcoin education in Eritrea, Uganda, and across Africa.',
  keywords: [
    "Bitcoin tutorials for beginners",
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "Bitcoin academy",
    "Bitcoin step by step",
    "PanAfrican Bitcoin Academy",
    "Eritrea Bitcoin education",
    "Asmara Bitcoin education",
    "Uganda Bitcoin education",
    "Eritrean Bitcoiners",
    "Bitcoin in Eritrea",
  ],
  alternates: {
    canonical: '/chapters',
  },
  openGraph: {
    title: 'Bitcoin Tutorials for Beginners - Learn Bitcoin Step by Step',
    description: 'Bitcoin tutorials for beginners at PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Learn Bitcoin step by step with clear lessons and real security.',
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

