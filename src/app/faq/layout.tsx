import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'FAQ - Bitcoin Education Questions | PanAfrican Bitcoin Academy',
  description: 'Frequently asked questions about PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy. Learn about our Bitcoin education program, requirements, and how to apply.',
  keywords: [
    "Bitcoin academy FAQ",
    "Bitcoin education questions",
    "Learn Bitcoin",
    "Bitcoin tutorials for beginners",
    "PanAfrican Bitcoin Academy",
    "Bitcoin education Africa",
  ],
  openGraph: {
    title: 'FAQ - Bitcoin Education Questions | PanAfrican Bitcoin Academy',
    description: 'Frequently asked questions about PanAfrican Bitcoin Academy - first Eritrea based Bitcoin academy.',
    url: '/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

