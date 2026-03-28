import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Join us on mentoring | PanAfrican Bitcoin Academy',
  description: 'Join us on mentoring at PanAfrican Bitcoin Academy — mentor, volunteer, or guest lecture. Help grow Bitcoin education in Africa.',
  keywords: [
    "Bitcoin mentoring",
    "Bitcoin mentor",
    "Bitcoin guidance",
    "Bitcoin education Africa",
    "PanAfrican Bitcoin Academy",
  ],
  alternates: {
    canonical: '/mentorship',
  },
  openGraph: {
    title: 'Join us on mentoring | PanAfrican Bitcoin Academy',
    description: 'Join us on mentoring — mentor, volunteer, or guest lecture and help grow Bitcoin education in Africa.',
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

