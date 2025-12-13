import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Impact & Results - PanAfrican Bitcoin Academy',
  description: 'See the impact of PanAfrican Bitcoin Academy. Students trained, countries reached, and Bitcoin education outcomes across Africa.',
  keywords: [
    "Bitcoin education impact",
    "Bitcoin academy results",
    "Bitcoin education Africa",
    "PanAfrican Bitcoin Academy",
  ],
  openGraph: {
    title: 'Impact & Results - PanAfrican Bitcoin Academy',
    description: 'See the impact of PanAfrican Bitcoin Academy across Africa.',
    url: '/impact',
  },
};

export default function ImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

