'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen w-full bg-black flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="rounded-xl border border-red-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <div className="text-center mb-6">
                <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">
                  Application Error
                </h1>
              </div>

              <div className="space-y-4 mb-6">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm text-red-200">
                    A critical error occurred while loading the application. This might be due to a network issue, outdated cache, or a temporary server problem.
                  </p>
                </div>

                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-sm text-orange-200">
                    <strong>What you can do:</strong> Try refreshing the page, clearing your browser cache, or check your internet connection. If the problem persists, please contact support.
                  </p>
                </div>

                {error.digest && (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-400 font-mono">
                      Error ID: {error.digest}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black transition hover:brightness-110"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

