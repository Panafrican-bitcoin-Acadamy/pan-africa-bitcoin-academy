'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cookie } from 'lucide-react';

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      className="fixed inset-0 z-[999999] flex items-end justify-center p-4 sm:items-center sm:p-6"
      onClick={(e) => {
        // Don't close on backdrop click - user must accept
        e.stopPropagation();
      }}
    >
      <div 
        className="w-full max-w-lg rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cyan-400/20 p-2">
              <Cookie className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-50">Cookie Consent</h3>
          </div>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            We use cookies to manage your session and provide authentication. Our cookies are secure and help us:
          </p>
          <ul className="text-sm text-zinc-400 space-y-2 ml-4 list-disc">
            <li>Keep you logged in securely</li>
            <li>Remember your preferences (like "Remember me")</li>
            <li>Maintain your session across pages</li>
          </ul>
          <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="text-xs text-cyan-300 font-medium mb-2">🔒 Security Features:</p>
            <ul className="text-xs text-cyan-300/80 space-y-1 ml-4 list-disc">
              <li>HTTP-only cookies (not accessible via JavaScript)</li>
              <li>Encrypted with HMAC-SHA256 signatures</li>
              <li>HTTPS-only in production</li>
              <li>Automatic expiration based on your preferences</li>
            </ul>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed mt-4">
            By clicking "Accept", you agree to our use of cookies. You can manage cookie preferences in your browser settings.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 font-semibold text-black transition hover:brightness-110 cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

