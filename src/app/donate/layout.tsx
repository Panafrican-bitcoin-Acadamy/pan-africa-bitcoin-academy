import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Donate - Support Bitcoin Education in Africa | PanAfrican Bitcoin Academy',
  description: 'Support Bitcoin education in Africa. Donate to PanAfrican Bitcoin Academy to help us provide free Bitcoin education and training across the continent.',
  keywords: [
    "Donate Bitcoin",
    "Support Bitcoin education",
    "Bitcoin education Africa",
    "PanAfrican Bitcoin Academy",
  ],
  openGraph: {
    title: 'Donate - Support Bitcoin Education in Africa | PanAfrican Bitcoin Academy',
    description: 'Support Bitcoin education in Africa. Help us provide free Bitcoin education and training.',
    url: '/donate',
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

