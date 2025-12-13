import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Developer Hub - Bitcoin Developer Resources | PanAfrican Bitcoin Academy',
  description: 'Bitcoin developer resources and pathways at PanAfrican Bitcoin Academy. Learn Bitcoin development, contribute to open source, and build on Bitcoin and Lightning Network.',
  keywords: [
    "Bitcoin developer",
    "Bitcoin development",
    "Lightning Network developer",
    "Bitcoin education Africa",
    "Bitcoin programming",
    "PanAfrican Bitcoin Academy",
  ],
  openGraph: {
    title: 'Developer Hub - Bitcoin Developer Resources | PanAfrican Bitcoin Academy',
    description: 'Bitcoin developer resources and pathways. Learn Bitcoin development and contribute to open source.',
    url: '/developer-hub',
  },
};

export default function DeveloperHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
