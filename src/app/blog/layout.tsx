import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Bitcoin Blog - Articles & Essays | PanAfrican Bitcoin Academy',
  description: 'Read Bitcoin articles, student essays, and technical deep dives from PanAfrican Bitcoin Academy. Learn from real experiences and expert insights.',
  keywords: [
    "Bitcoin eritrea",
    "Bitcoin eritrean articles",
    "eritrean Bitcoin education",
    "Learn Bitcoin in eritrea",
    "Bitcoin eritrean essays",
    "PanAfrican Bitcoin Academy",
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Bitcoin Blog - Articles & Essays | PanAfrican Bitcoin Academy',
    description: 'Read Bitcoin articles, student essays, and technical deep dives from PanAfrican Bitcoin Academy.',
    url: '/blog',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

