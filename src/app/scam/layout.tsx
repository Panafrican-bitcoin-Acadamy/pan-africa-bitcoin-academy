import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Understanding Bitcoin Scams",
  description:
    "Educational resource on Bitcoin and crypto scams — from general to high-risk. Recognize and avoid fraud.",
  robots: "noindex, nofollow",
};

export default function ScamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
