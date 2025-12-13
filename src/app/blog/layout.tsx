import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Bitcoin Blog - Articles & Essays | PanAfrican Bitcoin Academy',
  description: 'Read Bitcoin articles, student essays, and technical deep dives from PanAfrican Bitcoin Academy. Learn from real experiences and expert insights.',
  keywords: [
    "Bitcoin blog",
    "Bitcoin articles",
    "Bitcoin education",
    "Learn Bitcoin",
    "Bitcoin essays",
    "PanAfrican Bitcoin Academy",
  ],
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

