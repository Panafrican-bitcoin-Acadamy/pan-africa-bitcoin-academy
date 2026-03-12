'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import * as bip39 from '@scure/bip39';
import { wordlist as wordlistEn } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';

const rawWordlist = wordlistEn as string | string[];
const wordlist = typeof rawWordlist === 'string' ? rawWordlist.trim().split(/\s+/) : rawWordlist;

const SESSION_MNEMONIC_KEY = 'ch17_multisig_mnemonic';

interface Chapter17MultisigAssignmentProps {
  assignmentId: string;
}

type Step = 1 | 2 | 3 | 4;

interface PartnerKey {
  name: string;
  xpub: string;
  fingerprint: string;
}

function deriveXpubFromMnemonic(mnemonic: string): { xpub: string; fingerprint: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = HDKey.fromMasterSeed(seed);
  const account = master.derive("m/84'/0'/0'");
  const xpub = account.publicExtendedKey;
  const fpNum = account.fingerprint;
  const fingerprint = (fpNum >>> 0).toString(16).padStart(8, '0');
  return { xpub, fingerprint };
}

function encodePartnerKey(name: string, xpub: string, fingerprint: string): string {
  return `MSKEY:${name}:${xpub}`;
}

function parsePartnerKey(input: string): PartnerKey | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('MSKEY:')) return null;
  const parts = trimmed.split(':');
  if (parts.length < 3) return null;
  const [, name, xpub] = parts;
  if (!name?.trim() || !xpub?.trim()) return null;
  try {
    const node = HDKey.fromExtendedKey(xpub.trim());
    const fpNum = node.fingerprint;
    const fingerprint = (fpNum >>> 0).toString(16).padStart(8, '0');
    return { name: name.trim(), xpub: xpub.trim(), fingerprint };
  } catch {
    return null;
  }
}

function buildMultisigDescriptor(xpub1: string, xpub2: string): string {
  const sorted = [xpub1, xpub2].sort();
  return `wsh(sortedmulti(2,${sorted[0]},${sorted[1]}))`;
}

export function Chapter17MultisigAssignment({ assignmentId }: Chapter17MultisigAssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');

  const [step, setStep] = useState<Step>(1);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<string[]>(Array(12).fill(''));
  const [seedSaved, setSeedSaved] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const displayName = profile?.name?.trim() || (isAdminAuth && adminEmail ? 'Instructor' : 'Student');

  const [myXpub, setMyXpub] = useState('');
  const [myFingerprint, setMyFingerprint] = useState('');
  const [myKeyString, setMyKeyString] = useState('');
  const [partnerKeyInput, setPartnerKeyInput] = useState('');
  const [partnerKey, setPartnerKey] = useState<PartnerKey | null>(null);
  const [partnerKeyError, setPartnerKeyError] = useState<string | null>(null);

  const [descriptor, setDescriptor] = useState('');
  const [signStep, setSignStep] = useState<'create' | 'alice' | 'bob' | 'broadcast'>('create');
  const [showMultisigCheckAnimation, setShowMultisigCheckAnimation] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const generateMnemonic = useCallback(() => {
    const m = bip39.generateMnemonic(wordlist, 128);
    setMnemonic(m);
    setMnemonicWords(m.split(' '));
    setVerifyInputs(Array(12).fill(''));
    setSeedSaved(false);
    setVerifyError(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_MNEMONIC_KEY, m);
    }
  }, []);

  useEffect(() => {
    if (step === 1 && !mnemonic) {
      generateMnemonic();
    }
  }, [step, mnemonic, generateMnemonic]);

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
      if (!email) {
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const data = await response.json();
      const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
      if (thisAssignment) {
        setAssignment(thisAssignment);
        if (thisAssignment.submission) {
          setSubmissionStatus(thisAssignment.submission);
          setSubmitted(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const entered = verifyInputs.map((w) => w.toLowerCase().trim()).join(' ');
    if (entered !== mnemonic) {
      setVerifyError('Words do not match. Check order and spelling.');
      return;
    }
    setVerifyError(null);
    const { xpub, fingerprint } = deriveXpubFromMnemonic(mnemonic);
    setMyXpub(xpub);
    setMyFingerprint(fingerprint);
    setMyKeyString(encodePartnerKey(displayName, xpub, fingerprint));
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_MNEMONIC_KEY);
    }
    setMnemonic('');
    setMnemonicWords([]);
    setStep(2);
  };

  const handlePartnerKeySubmit = () => {
    const parsed = parsePartnerKey(partnerKeyInput);
    if (!parsed) {
      setPartnerKeyError('Invalid format. Use MSKEY:Name:xpub...');
      return;
    }
    setPartnerKeyError(null);
    setPartnerKey(parsed);
    setDescriptor(buildMultisigDescriptor(myXpub, parsed.xpub));
    setStep(3);
    setShowMultisigCheckAnimation(true);
  };

  useEffect(() => {
    if (!showMultisigCheckAnimation) return;
    const t = setTimeout(() => setShowMultisigCheckAnimation(false), 2200);
    return () => clearTimeout(t);
  }, [showMultisigCheckAnimation]);

  const handleInputChange = (index: number, value: string) => {
    const next = [...verifyInputs];
    next[index] = value;
    setVerifyInputs(next);
    setVerifyError(null);
  };

  const copyMyKey = () => {
    const str = encodePartnerKey(displayName, myXpub, myFingerprint);
    navigator.clipboard.writeText(str);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const answerData = {
        step,
        studentName: displayName,
        partnerName: partnerKey?.name,
        descriptor,
        policy: '2-of-2',
        completed: true,
      };
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          assignmentId,
          answer: JSON.stringify(answerData),
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to submit' }));
        throw new Error(err.error || 'Failed to submit');
      }
      const data = await response.json();
      setSubmitted(true);
      setSubmissionStatus(data.submission);
    } catch (err: any) {
      setError(err.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-3/4 mb-4" />
          <div className="h-32 bg-zinc-800 rounded mb-4" />
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

  if (submitted && submissionStatus) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner space-y-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: Multi-Sig Simulator</h3>
        <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
          <p className="text-green-200 font-medium mb-2">✓ Assignment Submitted</p>
          <p className="text-sm text-zinc-300">You completed the Multi-Sig simulator. Reward: {assignment?.reward_sats ?? 'TBD'} sats (after instructor review).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: Multi-Sig Simulator</h3>
        <p className="text-sm text-zinc-400 mb-2">
          Seed (local) → derive public key → share public key → verify partner key → construct multisig descriptor. Reward: {assignment?.reward_sats ?? 'TBD'} sats (after review).
        </p>
        <p className="text-xs text-amber-200/90 mb-4">
          Important: Seed phrase is generated in the browser only and never sent to the server. Only the derived public key (xpub) is used later.
        </p>
      </div>

      {/* Step 1 — Seed phrase creation and verification */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-zinc-200">Step 1 — Seed phrase creation and verification</h4>
          <p className="text-sm text-zinc-400">Generate a 12-word BIP39 mnemonic, write it down, then re-enter the words to continue. Only the derived xpub will be used. Your key package will use your profile name: <strong className="text-zinc-200">{displayName}</strong>.</p>

          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-300">12-word mnemonic (BIP39)</span>
              <button type="button" onClick={generateMnemonic} className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                Generate new seed
              </button>
            </div>
            {!seedSaved ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-zinc-950 rounded border border-zinc-700 font-mono text-sm text-zinc-200">
                  {mnemonicWords.map((word, i) => (
                    <span key={i}>{i + 1}. {word}</span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSeedSaved(true)}
                  className="mt-3 w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-black"
                >
                  I have written this down — continue
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-3">Re-enter the 12 words in order to verify.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={verifyInputs[i]}
                      onChange={(e) => handleInputChange(i, e.target.value)}
                      placeholder={`${i + 1}`}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-500"
                    />
                  ))}
                </div>
                {verifyError && <p className="mt-2 text-sm text-red-400">{verifyError}</p>}
                <button
                  type="button"
                  onClick={handleVerify}
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black"
                >
                  Verify and continue to Step 2
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Pair key exchange */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-zinc-200">Step 2 — Pair key exchange</h4>
          <p className="text-sm text-zinc-400">Share your public key package with a partner. Paste your partner&apos;s key below. Format: MSKEY:Name:xpub...</p>

          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm text-zinc-300 mb-2">Your multisig partner key (safe to share — this is not your seed):</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 break-all text-xs text-cyan-200 bg-zinc-950 px-2 py-2 rounded border border-zinc-700">
                {myKeyString || encodePartnerKey(displayName, myXpub, myFingerprint)}
              </code>
              <button type="button" onClick={copyMyKey} className="rounded bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 text-xs text-zinc-200">
                Copy
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Fingerprint (this key): {myFingerprint}</p>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <label className="block text-sm text-zinc-300 mb-2">Paste your partner&apos;s key</label>
            <input
              type="text"
              value={partnerKeyInput}
              onChange={(e) => {
                setPartnerKeyInput(e.target.value);
                setPartnerKeyError(null);
              }}
              placeholder="MSKEY:PartnerName:xpub6..."
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-500"
            />
            {partnerKeyError && <p className="mt-2 text-sm text-red-400">{partnerKeyError}</p>}
            <button
              type="button"
              onClick={handlePartnerKeySubmit}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Validate and continue to Step 3
            </button>
          </div>
        </div>
      )}

      {/* Green "CHECK multisig created" animation — pops in then pops off, then Step 3 shows */}
      {step === 3 && showMultisigCheckAnimation && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes ch17-multisig-check-pop {
              0% { opacity: 0; transform: scale(0.5); }
              25% { opacity: 1; transform: scale(1.15); }
              50% { opacity: 1; transform: scale(1); }
              70% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.85); }
            }
          `}} />
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-emerald-500"
            style={{ animation: 'ch17-multisig-check-pop 2.2s ease-in-out forwards' }}
          >
            <div className="text-center">
              <p className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-lg">CHECK</p>
              <p className="mt-2 text-xl font-bold text-white/95">multisig created</p>
            </div>
          </div>
        </>
      )}

      {/* Step 3 — Multisig wallet construction (visible after animation) */}
      {step === 3 && partnerKey && !showMultisigCheckAnimation && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-zinc-200">Step 3 — Multisig wallet construction</h4>

          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <p className="text-green-200 font-medium mb-2">Multisig wallet created</p>
            <p className="text-sm text-zinc-300 mb-2">You are creating a multisig with <strong className="text-zinc-100">{partnerKey.name}</strong>.</p>
            <p className="text-sm text-zinc-400">Policy: 2-of-2 signatures required.</p>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-2">Participants</p>
            <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
              <li>You ({displayName})</li>
              <li>{partnerKey.name}</li>
            </ul>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-2">Descriptor (Electrum-style)</p>
            <code className="block break-all text-xs text-cyan-200 bg-zinc-950 px-3 py-2 rounded border border-zinc-700">
              {descriptor}
            </code>
            <p className="text-xs text-zinc-500 mt-2">
              Receive addresses are derived by your wallet from this descriptor (e.g. path m/84&apos;/0&apos;/0&apos;/0/0). Seed phrase is never shared; only public keys are.
            </p>
          </div>

          {/* Signing simulation */}
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-3">Signing simulation (educational)</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSignStep('create')}
                className={`rounded px-3 py-1.5 text-xs ${signStep === 'create' ? 'bg-cyan-600 text-black' : 'bg-zinc-700 text-zinc-300'}`}
              >
                Create tx
              </button>
              <button
                type="button"
                onClick={() => setSignStep('alice')}
                className={`rounded px-3 py-1.5 text-xs ${signStep === 'alice' ? 'bg-cyan-600 text-black' : 'bg-zinc-700 text-zinc-300'}`}
              >
                {displayName} signs (1/2)
              </button>
              <button
                type="button"
                onClick={() => setSignStep('bob')}
                className={`rounded px-3 py-1.5 text-xs ${signStep === 'bob' ? 'bg-cyan-600 text-black' : 'bg-zinc-700 text-zinc-300'}`}
              >
                {partnerKey.name} signs (2/2)
              </button>
              <button
                type="button"
                onClick={() => setSignStep('broadcast')}
                className={`rounded px-3 py-1.5 text-xs ${signStep === 'broadcast' ? 'bg-green-600 text-black' : 'bg-zinc-700 text-zinc-300'}`}
              >
                Broadcast
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {signStep === 'create' && 'Transaction created → waiting for signatures.'}
              {signStep === 'alice' && '1/2 signatures collected.'}
              {signStep === 'bob' && '2/2 signatures collected — ready to broadcast.'}
              {signStep === 'broadcast' && 'Simulated broadcast. Both keys were required to sign.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit assignment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
