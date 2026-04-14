'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const SHOW_AFTER_PX = 380;

export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-zinc-950/95 text-cyan-300 shadow-lg shadow-black/40 backdrop-blur-sm transition-all duration-200 hover:border-orange-400/60 hover:bg-orange-950/90 hover:text-orange-300 hover:shadow-orange-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/70 active:scale-95 print:hidden sm:bottom-8 sm:right-8 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
      aria-label="Back to top"
      title="Back to top"
    >
      <ChevronUp className="h-6 w-6" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
