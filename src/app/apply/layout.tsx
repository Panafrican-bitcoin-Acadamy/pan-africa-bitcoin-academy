import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Apply to PanAfrican Bitcoin Academy - Join Bitcoin Education Program',
  description: 'Apply to PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Join our comprehensive Bitcoin education program in Eritrea, Uganda, and across Africa. Convert Bitcoin to Nakfa, join Eritrean Bitcoiners.',
  keywords: [
    "Bitcoin academy apply",
    "Bitcoin education Africa",
    "Learn Bitcoin",
    "PanAfrican Bitcoin Academy",
    "Bitcoin education program",
    "Join Bitcoin academy",
    "Eritrea Bitcoin academy",
    "Eritrean Bitcoiners",
    "Asmara Bitcoin education",
    "Uganda Bitcoin education",
    "Bitcoin Nakfa",
    "convert Bitcoin to Nakfa",
    "Eritrea investment",
    "Bitcoin in Eritrea",
  ],
  alternates: {
    canonical: '/apply',
  },
  openGraph: {
    title: 'Apply to PanAfrican Bitcoin Academy - Join Bitcoin Education Program',
    description: 'Apply to PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy in Asmara. Join our comprehensive Bitcoin education program in Eritrea, Uganda, and across Africa.',
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
