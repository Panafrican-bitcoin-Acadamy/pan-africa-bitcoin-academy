'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// CookieConsent is a client component - use dynamic import
const CookieConsent = dynamic(() => import("@/components/CookieConsent").then(mod => ({ default: mod.CookieConsent })), {
  ssr: false, // Client-side only since it uses localStorage
});

export function CookieConsentWrapper() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleRender = () => {
      if (cancelled) return;

      // Let above-the-fold content settle first (LCP protection).
      if ('requestIdleCallback' in window) {
        (window as Window & {
          requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
        }).requestIdleCallback(() => {
          if (!cancelled) setShouldRender(true);
        }, { timeout: 2500 });
      } else {
        fallbackTimer = setTimeout(() => {
          if (!cancelled) setShouldRender(true);
        }, 1800);
      }
    };

    if (document.readyState === 'complete') {
      scheduleRender();
    } else {
      window.addEventListener('load', scheduleRender, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleRender);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  if (!shouldRender) return null;
  return <CookieConsent />;
}








