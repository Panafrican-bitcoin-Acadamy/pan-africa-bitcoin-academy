'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'student' | 'admin';
}

export function SessionExpiredModal({ isOpen, onClose, userType = 'student' }: SessionExpiredModalProps) {

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Block all interaction - modal cannot be dismissed except via OK button
      // No Escape key, no backdrop clicks
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOK = () => {
    // Call onClose which will handle logout and show login form
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      // Block backdrop clicks - modal can only be closed via OK button
    >
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-orange-500/30 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
            <AlertCircle className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">Session Expired</h2>
            <p className="text-sm text-zinc-400">
              {userType === 'admin' ? 'Admin' : 'Your'} session has expired due to inactivity
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-zinc-300">
          <p>
            {userType === 'admin'
              ? 'Your admin session has expired. Please log in again to continue.'
              : 'Your session has expired due to inactivity. Please sign in again to continue.'}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleOK}
            className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}





import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'student' | 'admin';
}

export function SessionExpiredModal({ isOpen, onClose, userType = 'student' }: SessionExpiredModalProps) {

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Block all interaction - modal cannot be dismissed except via OK button
      // No Escape key, no backdrop clicks
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOK = () => {
    // Call onClose which will handle logout and show login form
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      // Block backdrop clicks - modal can only be closed via OK button
    >
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-orange-500/30 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
            <AlertCircle className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">Session Expired</h2>
            <p className="text-sm text-zinc-400">
              {userType === 'admin' ? 'Admin' : 'Your'} session has expired due to inactivity
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-zinc-300">
          <p>
            {userType === 'admin'
              ? 'Your admin session has expired. Please log in again to continue.'
              : 'Your session has expired due to inactivity. Please sign in again to continue.'}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleOK}
            className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}




