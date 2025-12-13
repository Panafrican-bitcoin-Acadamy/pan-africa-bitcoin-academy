import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Mentorship Program - Bitcoin Mentorship | PanAfrican Bitcoin Academy',
  description: 'Join the Bitcoin mentorship program at PanAfrican Bitcoin Academy. Get guidance from experienced Bitcoin mentors and advance your Bitcoin knowledge.',
  keywords: [
    "Bitcoin mentorship",
    "Bitcoin mentor",
    "Bitcoin guidance",
    "Bitcoin education Africa",
    "PanAfrican Bitcoin Academy",
  ],
  openGraph: {
    title: 'Mentorship Program - Bitcoin Mentorship | PanAfrican Bitcoin Academy',
    description: 'Join the Bitcoin mentorship program. Get guidance from experienced Bitcoin mentors.',
    url: '/mentorship',
  },
};

export default function MentorshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

