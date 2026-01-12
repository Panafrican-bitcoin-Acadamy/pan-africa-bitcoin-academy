'use client';

import dynamic from 'next/dynamic';

// CookieConsent is a client component - use dynamic import
const CookieConsent = dynamic(() => import("@/components/CookieConsent").then(mod => ({ default: mod.CookieConsent })), {
  ssr: false, // Client-side only since it uses localStorage
});

export function CookieConsentWrapper() {
  return <CookieConsent />;
}





