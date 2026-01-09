'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  // Determine user-friendly error message
  const getErrorMessage = () => {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Chunk loading errors
    if (errorMessage.includes('chunk') || errorMessage.includes('failed to load')) {
      return {
        title: 'Loading Error',
        message: 'The page failed to load properly. This might be due to a network issue or outdated cache.',
        suggestion: 'Please try refreshing the page or clearing your browser cache.',
      };
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestion: 'Try refreshing the page or check your network settings.',
      };
    }
    
    // Generic errors
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while loading the page.',
      suggestion: 'Please try refreshing the page. If the problem persists, contact support.',
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl border border-red-500/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <div className="text-center mb-6">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">
              {errorInfo.title}
            </h1>
          </div>

          <div className="space-y-4 mb-6">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-200">
                {errorInfo.message}
              </p>
            </div>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-sm text-orange-200">
                <strong>What you can do:</strong> {errorInfo.suggestion}
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
            
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-base font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

