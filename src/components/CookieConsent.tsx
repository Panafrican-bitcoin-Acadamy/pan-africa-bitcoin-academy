'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[999999] flex items-end justify-center p-4"
    >
      <div 
        className="w-full max-w-2xl rounded-t-2xl border-t border-x border-cyan-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl transition-all duration-300"
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-sm text-zinc-300 leading-relaxed flex-1">
              We use cookies to manage your session and provide authentication.
            </p>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-400/10 transition cursor-pointer flex items-center gap-1"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? (
                <>
                  <span>Less</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {showDetails && (
            <div className="mb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our cookies are secure and help us:
              </p>
              <ul className="text-sm text-zinc-400 space-y-2 ml-4 list-disc">
                <li>Keep you logged in securely</li>
                <li>Remember your preferences (like "Remember me")</li>
                <li>Maintain your session across pages</li>
              </ul>
              <p className="text-xs text-zinc-400 leading-relaxed mt-4">
                By clicking "Accept", you agree to our use of cookies. You can manage cookie preferences in your browser settings.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-1.5 font-medium text-black transition hover:brightness-110 cursor-pointer text-xs"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

