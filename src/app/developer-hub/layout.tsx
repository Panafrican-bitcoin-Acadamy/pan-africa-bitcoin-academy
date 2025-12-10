import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Hub',
  description: 'Comprehensive Bitcoin developer resources, learning paths, tools, communities, and opportunities. Start your journey as a Bitcoin developer with curated resources and guidance.',
  openGraph: {
    title: 'Developer Hub | Pan-African Bitcoin Academy',
    description: 'Comprehensive Bitcoin developer resources, learning paths, tools, and communities. Start your journey as a Bitcoin developer.',
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

