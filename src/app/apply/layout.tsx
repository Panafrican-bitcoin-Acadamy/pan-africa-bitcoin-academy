import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply',
  description: 'Apply to join Pan-African Bitcoin Academy. Choose from upcoming cohorts (Beginner, Intermediate, Advanced) and start your Bitcoin education journey.',
  openGraph: {
    title: 'Apply | Pan-African Bitcoin Academy',
    description: 'Apply to join Pan-African Bitcoin Academy. Choose from upcoming cohorts and start your Bitcoin education journey.',
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

