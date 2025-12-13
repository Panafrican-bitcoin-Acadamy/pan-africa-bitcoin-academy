import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Apply to PanAfrican Bitcoin Academy - Join Bitcoin Education Program',
  description: 'Apply to PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Join our comprehensive Bitcoin education program with clear lessons, real security, and developer pathways.',
  keywords: [
    "Bitcoin academy apply",
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "PanAfrican Bitcoin Academy",
    "Bitcoin education program",
    "Join Bitcoin academy",
  ],
  openGraph: {
    title: 'Apply to PanAfrican Bitcoin Academy - Join Bitcoin Education Program',
    description: 'Apply to PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Join our comprehensive Bitcoin education program.',
    url: '/apply',
  },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
