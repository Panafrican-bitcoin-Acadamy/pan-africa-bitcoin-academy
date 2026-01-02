'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

interface Chapter6AssignmentProps {
  assignmentId: string;
}

// Bitcoin address validation functions
function isValidBitcoinAddress(address: string): boolean {
  if (!address || address.trim().length === 0) return false;
  
  const trimmed = address.trim();
  
  // Legacy addresses (P2PKH): starts with 1, length 26-35
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // Bech32 addresses (SegWit): starts with bc1, length 14-74
  const bech32Regex = /^bc1[a-z0-9]{13,72}$/i;
  
  // Taproot addresses: starts with bc1p, length 62
  const taprootRegex = /^bc1p[a-z0-9]{58}$/i;
  
  // P2SH addresses: starts with 3, length 26-35
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  return legacyRegex.test(trimmed) || 
         bech32Regex.test(trimmed) || 
         taprootRegex.test(trimmed) || 
         p2shRegex.test(trimmed);
}

function isValidLightningInvoice(invoice: string): boolean {
  if (!invoice || invoice.trim().length === 0) return false;
  
  const trimmed = invoice.trim();
  
  // Lightning invoice starts with lnbc (mainnet) or lntb/lntbs (testnet)
  // or could be a lightning address like user@domain.com
  const lightningInvoiceRegex = /^(lnbc|lntb|lntbs)[0-9a-z]{1,1900}$/i;
  const lightningAddressRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return lightningInvoiceRegex.test(trimmed) || lightningAddressRegex.test(trimmed);
}

export function Chapter6Assignment({ assignmentId }: Chapter6AssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  
  // Part A (formerly Part B) - Address Validation
  const [validationOnChain, setValidationOnChain] = useState('');
  const [validationLightning, setValidationLightning] = useState('');
  const [reflection, setReflection] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onChainError, setOnChainError] = useState<string | null>(null);
  const [lightningError, setLightningError] = useState<string | null>(null);

  useEffect(() => {
    if ((isAuthenticated && profile?.email) || (isAdminAuth && adminEmail)) {
      checkSubmissionStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, profile, isAdminAuth, adminEmail]);

  const checkSubmissionStatus = async () => {
    try {
      setLoading(true);
      const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
      if (!email) return;
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
        if (thisAssignment?.submission) {
          setSubmissionStatus(thisAssignment.submission);
          setSubmitted(true);
          if (thisAssignment.submission.answer) {
            try {
              const answerData = JSON.parse(thisAssignment.submission.answer);
              setValidationOnChain(answerData.validationOnChain || '');
              setValidationLightning(answerData.validationLightning || '');
              setReflection(answerData.reflection || '');
            } catch (e) {
              // Legacy format, ignore
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking submission status:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateOnChainAddress = (address: string) => {
    if (!address.trim()) {
      setOnChainError(null);
      return;
    }
    
    // Check if it's a valid address
    if (isValidBitcoinAddress(address)) {
      setOnChainError(null);
    } else {
      setOnChainError('Invalid Bitcoin address. Must be a valid on-chain address (starts with 1, 3, or bc1)');
    }
  };

  const validateLightningAddress = (invoice: string) => {
    if (!invoice.trim()) {
      setLightningError(null);
      return;
    }
    
    // Check if it's a valid lightning invoice or address
    if (isValidLightningInvoice(invoice)) {
      setLightningError(null);
    } else {
      setLightningError('Invalid Lightning invoice or address. Must start with lnbc/lntb/lntbs or be a Lightning address (user@domain.com)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    // Validate addresses before submission
    const onChainValid = isValidBitcoinAddress(validationOnChain);
    const lightningValid = isValidLightningInvoice(validationLightning);

    if (!validationOnChain.trim() || !validationLightning.trim()) {
      setError('Please provide both on-chain address and Lightning address/invoice.');
      return;
    }

    if (!onChainValid) {
      setError('Please enter a valid Bitcoin on-chain address in Input 1.');
      setOnChainError('Invalid Bitcoin address');
      return;
    }

    if (!lightningValid) {
      setError('Please enter a valid Lightning invoice or address in Input 2.');
      setLightningError('Invalid Lightning invoice or address');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const answerData = {
        validationOnChain,
        validationLightning,
        reflection: reflection.trim() || '', // Optional reflection
      };

      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          assignmentId,
          answer: JSON.stringify(answerData),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assignment');
      }

      setSubmitted(true);
      setSubmissionStatus(data.submission);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-zinc-800 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAdminAuth) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-5">
        <p className="text-zinc-400">Please log in to view and complete this assignment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: Create & Validate Bitcoin Addresses</h3>
        <p className="text-sm text-zinc-400 mb-4">Deliverable: Valid addresses + reflection | Reward: TBD (after instructor review)</p>
      </div>

      {submitted && submissionStatus ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <p className="text-green-200 font-medium mb-2">✓ Assignment Submitted</p>
            <p className="text-sm text-zinc-300 mb-3">Your submission is under instructor review.</p>
            {submissionStatus.status === 'graded' && submissionStatus.is_correct && (
              <p className="text-sm text-green-300 font-medium">✓ Approved!</p>
            )}
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmissionStatus(null);
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline px-2 py-1 min-h-[32px] touch-target"
          >
            Edit Submission
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Part A - Address Validation */}
          <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <h4 className="text-base font-semibold text-zinc-200">Part A — Address Validation</h4>
            <p className="text-sm text-zinc-400">Paste valid addresses in each field. Addresses will be validated when you submit.</p>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Input 1: On-chain address field
              </label>
              <textarea
                value={validationOnChain}
                onChange={(e) => {
                  setValidationOnChain(e.target.value);
                  validateOnChainAddress(e.target.value);
                }}
                onBlur={(e) => validateOnChainAddress(e.target.value)}
                rows={3}
                className={`w-full rounded-lg border px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition font-mono text-sm ${
                  onChainError 
                    ? 'border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20' 
                    : validationOnChain.trim() && isValidBitcoinAddress(validationOnChain)
                    ? 'border-green-500/50 bg-green-900/20 focus:border-green-500 focus:ring-green-500/20'
                    : 'border-zinc-700 bg-zinc-900 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                }`}
                placeholder="Paste a valid Bitcoin on-chain address (starts with 1, 3, or bc1)"
                required
              />
              {onChainError && (
                <p className="mt-1 text-xs text-red-400">{onChainError}</p>
              )}
              {validationOnChain.trim() && !onChainError && isValidBitcoinAddress(validationOnChain) && (
                <p className="mt-1 text-xs text-green-400">✓ Valid Bitcoin address</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Input 2: Lightning address / invoice field
              </label>
              <textarea
                value={validationLightning}
                onChange={(e) => {
                  setValidationLightning(e.target.value);
                  validateLightningAddress(e.target.value);
                }}
                onBlur={(e) => validateLightningAddress(e.target.value)}
                rows={3}
                className={`w-full rounded-lg border px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition font-mono text-sm ${
                  lightningError 
                    ? 'border-red-500/50 bg-red-900/20 focus:border-red-500 focus:ring-red-500/20' 
                    : validationLightning.trim() && isValidLightningInvoice(validationLightning)
                    ? 'border-green-500/50 bg-green-900/20 focus:border-green-500 focus:ring-green-500/20'
                    : 'border-zinc-700 bg-zinc-900 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                }`}
                placeholder="Paste a valid Lightning invoice (lnbc...) or Lightning address (user@domain.com)"
                required
              />
              {lightningError && (
                <p className="mt-1 text-xs text-red-400">{lightningError}</p>
              )}
              {validationLightning.trim() && !lightningError && isValidLightningInvoice(validationLightning) && (
                <p className="mt-1 text-xs text-green-400">✓ Valid Lightning invoice/address</p>
              )}
            </div>
          </div>

          {/* Reflection - Optional */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Reflection: What did you learn from this exercise? <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
              placeholder="Write your reflection (optional)..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 min-h-[48px] font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
}
