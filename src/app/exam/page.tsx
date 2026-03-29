'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { examQuestions } from '@/content/examQuestions';
import { PageContainer } from '@/components/PageContainer';
import { CheckCircle2, Lock, AlertCircle, Loader2, X } from 'lucide-react';

const TOTAL_QUESTIONS = examQuestions.length;
const PASS_MARK = Math.ceil(TOTAL_QUESTIONS * 0.7);
/** Two-hour exam limit (non-admin students). */
const EXAM_TIME_LIMIT_MS = 2 * 60 * 60 * 1000;

function examTimerStorageKey(email: string) {
  const safe = email.toLowerCase().trim().replace(/[^a-z0-9@._-]+/g, '_');
  return `paba_final_exam_start_${safe}`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function ExamTimeExpiredModal({
  onOk,
  okPending,
}: {
  onOk: () => void;
  okPending?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-time-expired-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900 p-6 text-center shadow-2xl shadow-black/50 sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
          <Lock className="h-7 w-7 text-red-400" aria-hidden />
        </div>
        <h2 id="exam-time-expired-title" className="text-lg font-bold text-white sm:text-xl">
          Time is up
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Your 2-hour exam session has ended. Tap <strong className="text-zinc-200">OK</strong> to send a retake request to
          your administrators and go to your <strong className="text-zinc-200">dashboard</strong>. When they approve,
          open the final exam again: you <strong className="text-zinc-200">start over from question 1</strong> with a new
          2-hour timer (answers from this attempt are not kept).
        </p>
        <p className="mt-4 text-base font-medium leading-relaxed text-cyan-200" lang="ti-ER">
          ካልኣይ ግዜ ፈተና ውሰድ
        </p>
        <button
          type="button"
          onClick={onOk}
          disabled={okPending}
          className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[8rem] sm:px-10"
        >
          {okPending ? 'Sending request…' : 'OK'}
        </button>
      </div>
    </div>
  );
}

function ExamSubmitCelebration({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      className="exam-submit-backdrop-in fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="exam-submit-card-in relative w-full max-w-md rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 text-center shadow-[0_0_60px_rgba(16,185,129,0.15)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/50">
          <CheckCircle2 className="exam-submit-check-pop h-12 w-12 text-emerald-400" strokeWidth={2.25} />
        </div>
        <p className="text-lg font-semibold tracking-tight text-white">Final exam submitted</p>
        <p className="mt-2 text-base font-medium text-emerald-300/95">Good job!</p>
        <p className="mt-4 text-xs text-zinc-500">Your score is saved. Check your email and dashboard for details.</p>
      </div>
    </div>
  );
}

interface ExamAccess {
  hasAccess: boolean;
  isRegistered: boolean;
  isEnrolled: boolean;
  isAdmin?: boolean;
  chapter21Completed: boolean;
  hasAdminAccess: boolean;
  examCompleted: boolean;
  examScore?: number | null;
  examTimerResetAt?: string | null;
  message: string;
}

interface ExamResult {
  completed: boolean;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  submittedAt?: string;
  message?: string;
}

export default function ExamPage() {
  const { isAuthenticated: isStudentAuth, profile, loading: authLoading } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const router = useRouter();
  const [accessCheck, setAccessCheck] = useState<ExamAccess | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [validationBanner, setValidationBanner] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [celebrateSubmit, setCelebrateSubmit] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [timeExpiredOkPending, setTimeExpiredOkPending] = useState(false);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const dismissCelebrate = useCallback(() => setCelebrateSubmit(false), []);

  // Determine if user is authenticated (either as student or admin)
  const isAuthenticated = isStudentAuth || isAdminAuth;
  const userEmail = profile?.email || adminEmail || null;
  const loading = authLoading || adminLoading;

  const handleTimeExpiredOk = useCallback(async () => {
    if (!accessCheck?.isAdmin) {
      setTimeExpiredOkPending(true);
      try {
        await fetch('/api/exam/retake-request', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'time_expired' }),
        });
      } catch {
        /* Still go to dashboard; if the request failed, student can contact support */
      } finally {
        setTimeExpiredOkPending(false);
      }
    }
    router.push('/dashboard');
  }, [accessCheck?.isAdmin, router]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/apply');
      return;
    }

    if (isAuthenticated && userEmail) {
      checkExamAccess();
    }
  }, [isAuthenticated, loading, userEmail]);

  // 2-hour countdown (students only); persisted so refresh does not reset the clock.
  useEffect(() => {
    if (!userEmail || !accessCheck) return;
    if (!accessCheck.hasAccess || accessCheck.examCompleted || accessCheck.isAdmin) {
      return;
    }

    const key = examTimerStorageKey(userEmail);
    const resetAtMs = accessCheck.examTimerResetAt
      ? new Date(accessCheck.examTimerResetAt).getTime()
      : 0;
    const resetValid = Number.isFinite(resetAtMs) && resetAtMs > 0;

    let startStr = localStorage.getItem(key);
    let startMs = startStr ? parseInt(startStr, 10) : NaN;

    if (resetValid && (!Number.isFinite(startMs) || startMs < resetAtMs)) {
      startStr = String(Date.now());
      try {
        localStorage.setItem(key, startStr);
      } catch {
        /* private mode */
      }
      startMs = parseInt(startStr, 10);
      setTimeExpired(false);
      // Admin approved a new session: treat as a blank exam from question 1
      setAnswers({});
      setValidationErrors([]);
      setValidationBanner(null);
      setSubmitError(null);
    } else if (!startStr) {
      startStr = String(Date.now());
      try {
        localStorage.setItem(key, startStr);
      } catch {
        /* private mode */
      }
      startMs = parseInt(startStr, 10);
    }

    const startMsFinal =
      Number.isFinite(startMs) && !Number.isNaN(startMs) ? startMs : Date.now();

    let intervalId: number | undefined;
    const tick = () => {
      const elapsed = Date.now() - startMsFinal;
      const rem = EXAM_TIME_LIMIT_MS - elapsed;
      if (rem <= 0) {
        setRemainingMs(0);
        setTimeExpired(true);
        if (intervalId !== undefined) window.clearInterval(intervalId);
        return;
      }
      setRemainingMs(rem);
    };

    tick();
    intervalId = window.setInterval(tick, 1000);
    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [
    userEmail,
    accessCheck?.hasAccess,
    accessCheck?.examCompleted,
    accessCheck?.isAdmin,
    accessCheck?.examTimerResetAt,
  ]);

  const checkExamAccess = async () => {
    if (!userEmail) return;

    try {
      setCheckingAccess(true);
      const response = await fetch('/api/exam/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      setAccessCheck(data);

      // If exam already completed, fetch results
      if (data.examCompleted && data.examScore !== null) {
        fetchExamResults();
      }
    } catch (error) {
      console.error('Error checking exam access:', error);
      setAccessCheck({
        hasAccess: false,
        isRegistered: false,
        isEnrolled: false,
        chapter21Completed: false,
        hasAdminAccess: false,
        examCompleted: false,
        message: 'Failed to check exam access',
      });
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchExamResults = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch('/api/exam/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      setExamResult(data);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: answer,
    }));
    setValidationErrors((prev) => prev.filter((id) => id !== questionId));
    setValidationBanner(null);
    setSubmitError(null);
  };

  const validateAnswers = (): number[] => {
    const errors: number[] = [];
    for (const q of examQuestions) {
      const answer = answers[q.id.toString()];
      if (!answer || !['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
        errors.push(q.id);
      }
    }
    return errors;
  };

  const scrollToQuestion = (questionId: number) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the question briefly
      element.classList.add('ring-2', 'ring-orange-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-orange-500');
      }, 2000);
    }
  };

  const handleSubmit = async () => {
    if (!userEmail) return;

    if (!accessCheck?.isAdmin && (timeExpired || (remainingMs !== null && remainingMs <= 0))) {
      setTimeExpired(true);
      setSubmitError('Time is up. You can no longer submit this session.');
      return;
    }

    // Validate all answers
    const errors = validateAnswers();
    if (errors.length > 0) {
      setValidationErrors(errors);
      scrollToQuestion(errors[0]);
      const unansweredList = errors.slice(0, 12).map((q) => `Q${q}`).join(', ');
      const more = errors.length > 12 ? ` … +${errors.length - 12} more` : '';
      setValidationBanner(
        `Please answer all ${TOTAL_QUESTIONS} questions before submitting. Unanswered: ${unansweredList}${more}`,
      );
      return;
    }

    setValidationBanner(null);

    const confirmed = window.confirm(
      'Are you sure you want to submit your exam? You cannot change your answers after submission.',
    );

    if (!confirmed) return;

    setSubmitError(null);

    try {
      setSubmitting(true);
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          answers,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setSubmitError(data.message || data.error);
        if (Array.isArray(data.missingQuestions) && data.missingQuestions.length > 0) {
          const missing = data.missingQuestions as number[];
          setValidationErrors(missing);
          scrollToQuestion(missing[0]);
        }
        return;
      }

      setAccessCheck((prev) =>
        prev
          ? {
              ...prev,
              examCompleted: true,
              examScore: data.score ?? null,
              hasAccess: prev.isAdmin ? prev.hasAccess : false,
            }
          : null,
      );

      setExamResult({
        completed: true,
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage,
        submittedAt: data.submittedAt,
        message: data.message,
      });
      setCelebrateSubmit(true);
      if (!accessCheck?.isAdmin && userEmail) {
        try {
          localStorage.removeItem(examTimerStorageKey(userEmail));
        } catch {
          /* ignore */
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting exam:', error);
      setSubmitError('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = examQuestions.filter((q) => {
    const a = answers[q.id.toString()];
    return a && ['A', 'B', 'C', 'D'].includes(a.toUpperCase());
  }).length;

  /** Shown only after submit (or server) validation — which numbers are still missing */
  const missingQuestionIds = [...validationErrors].sort((a, b) => a - b);

  if (loading || checkingAccess) {
    return (
      <PageContainer title="Final Exam" subtitle="Loading…">
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-orange-500" />
          <p className="text-zinc-400">Loading exam...</p>
        </div>
      </PageContainer>
    );
  }

  if (!accessCheck) {
    return (
      <PageContainer title="Final Exam" subtitle="Access check failed">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="text-zinc-300">Failed to load exam access information.</p>
          <Link
            href="/dashboard"
            className="mt-6 text-sm font-semibold text-orange-400 hover:text-orange-300"
          >
            Back to dashboard →
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!accessCheck.hasAccess) {
    return (
      <PageContainer title="Final Exam" subtitle="Certification assessment">
        <div className="mx-auto max-w-lg rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-8 text-center">
          <Lock className="mx-auto mb-6 h-16 w-16 text-orange-500" />
          <h2 className="mb-4 text-xl font-bold text-white">Exam locked</h2>
          <p className="mb-6 text-zinc-400">{accessCheck.message}</p>

          {!accessCheck.chapter21Completed && (
            <div className="mb-4 rounded-lg bg-black/30 p-4">
              <p className="mb-2 text-sm text-zinc-300">Complete Chapter 21 (wrap-up) first.</p>
              <Link
                href="/chapters"
                className="text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                Go to chapters →
              </Link>
            </div>
          )}

          {!accessCheck.hasAdminAccess && accessCheck.chapter21Completed && (
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-sm text-zinc-300">
                Waiting for admin approval. Contact your administrator if this persists.
              </p>
            </div>
          )}

          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-semibold text-zinc-400 hover:text-zinc-200"
          >
            ← Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (accessCheck.examCompleted && examResult?.completed && !accessCheck.isAdmin) {
    const passed = (examResult.score ?? 0) >= PASS_MARK;
    return (
      <>
        <PageContainer title="Final Exam" subtitle="Your result">
          <div className="mx-auto max-w-xl rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.06)]">
            <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-emerald-500" />
            <h2 className="mb-2 text-2xl font-bold text-white">Exam completed</h2>
            <p
              className={`mb-6 text-sm font-medium ${passed ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {passed ? `Passed (70%+ — ${PASS_MARK}/${TOTAL_QUESTIONS}+)` : `Below passing — need ${PASS_MARK}/${TOTAL_QUESTIONS}+ (70%)`}
            </p>
            <div className="mb-2 text-5xl font-bold text-orange-500 sm:text-6xl">
              {examResult.score}/{examResult.totalQuestions}
            </div>
            <div className="mb-6 text-xl text-zinc-400">{examResult.percentage}%</div>
            <p className="mb-8 text-sm text-zinc-400">
              Submitted {new Date(examResult.submittedAt || '').toLocaleString()}
            </p>
            <p className="mb-6 text-xs text-zinc-500">
              A confirmation email was sent if your inbox allows it. Your dashboard shows this score under certification.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Back to dashboard
            </Link>
          </div>
        </PageContainer>
        <ExamSubmitCelebration show={celebrateSubmit} onDismiss={dismissCelebrate} />
      </>
    );
  }

  const submitDisabled =
    submitting ||
    timeExpired ||
    (!accessCheck?.isAdmin && remainingMs !== null && remainingMs <= 0);

  return (
    <>
    <PageContainer
      title="Final Exam"
      subtitle={
        accessCheck?.isAdmin
          ? `${TOTAL_QUESTIONS} multiple choice · 70% to pass (${PASS_MARK}+ correct) · admin: no time limit`
          : `${TOTAL_QUESTIONS} multiple choice · 70% to pass (${PASS_MARK}+ correct) · 2-hour time limit`
      }
    >
      <div className="relative">
        <div
          className={`transition-[filter] duration-300 ${
            timeExpired ? 'pointer-events-none select-none blur-md brightness-[0.65]' : ''
          }`}
        >
      <div className="relative mx-auto max-w-6xl max-sm:pl-3 max-sm:pr-3 pb-8 pr-4 sm:pl-5 sm:pr-7 lg:pl-6 lg:pr-10">
        {submitError ? (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-xl border border-red-500/40 bg-red-950/50 p-4 text-sm text-red-100"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="flex-1 leading-relaxed">{submitError}</p>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="rounded p-1 text-red-300 hover:bg-red-500/20"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {validationBanner ? (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="flex-1 leading-relaxed">{validationBanner}</p>
            <button
              type="button"
              onClick={() => setValidationBanner(null)}
              className="rounded p-1 text-red-300 hover:bg-red-500/20"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Timer + dashboard (thin vertical progress is fixed mid-screen on the left) */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
          <div className="min-w-0">
            {accessCheck?.isAdmin ? (
              <p className="text-xs text-zinc-500">Admin preview — no exam time limit</p>
            ) : remainingMs !== null ? (
              <p
                className={`font-mono text-lg font-bold tabular-nums sm:text-xl ${
                  remainingMs <= 15 * 60 * 1000 ? 'text-amber-400' : 'text-cyan-200'
                }`}
              >
                {formatCountdown(remainingMs)}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Preparing timer…</p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-medium text-zinc-500 hover:text-zinc-300"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="min-w-0 space-y-5">
          {/* Questions */}
          <div className="space-y-4">
          {examQuestions.map((question) => {
            const questionId = question.id;
            const selectedAnswer = answers[questionId.toString()];
            const hasError = validationErrors.includes(questionId);

            return (
              <div
                key={questionId}
                ref={(el) => {
                  questionRefs.current[questionId] = el;
                }}
                className={`rounded-xl border bg-zinc-950/60 p-4 sm:p-5 ${
                  hasError
                    ? 'border-red-500/70 ring-1 ring-red-500/30'
                    : 'border-zinc-800/90 hover:border-cyan-500/20'
                } transition-colors`}
              >
                <div className="mb-2.5 flex items-start gap-2.5">
                  <span className="text-base font-bold tabular-nums text-cyan-400 sm:text-lg">{questionId}.</span>
                  <p className="flex-1 text-sm leading-snug text-zinc-100 sm:text-base sm:leading-relaxed">
                    {question.question}
                  </p>
                  {hasError && (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>

                <div className="ml-0 space-y-1.5 sm:ml-7">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const optionText = question.options[option];
                    const isSelected = selectedAnswer === option;

                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors sm:gap-2.5 sm:p-2.5 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/15 shadow-[0_0_16px_rgba(249,115,22,0.1)]'
                            : 'border-transparent bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/70'
                        } ${hasError && !isSelected ? 'border-red-500/40' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${questionId}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(questionId, option)}
                          className="h-4 w-4 shrink-0 text-orange-500 focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="w-5 shrink-0 text-sm font-semibold text-zinc-300">{option}.</span>
                        <span className="flex-1 text-sm text-zinc-300">{optionText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>

          {/* Mobile: sits in page flow directly under the last question. sm+: pins to viewport bottom while scrolling. */}
          <div
            className="z-20 mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/95 px-4 py-4 shadow-lg backdrop-blur-md max-sm:mb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:static max-sm:shadow-md sm:sticky sm:bottom-0 sm:px-6 sm:py-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-sm">
                <div className="hidden sm:block">
                  {answeredCount === TOTAL_QUESTIONS ? (
                    <span className="font-semibold text-emerald-400">✓ All questions answered — ready to submit</span>
                  ) : missingQuestionIds.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-red-400">
                        Missing {missingQuestionIds.length} answer{missingQuestionIds.length !== 1 ? 's' : ''} — tap to jump
                      </span>
                      <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                        {missingQuestionIds.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => scrollToQuestion(id)}
                            className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                          >
                            Q{id}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="font-semibold text-orange-400">
                      {TOTAL_QUESTIONS - answeredCount} question{TOTAL_QUESTIONS - answeredCount !== 1 ? 's' : ''}{' '}
                      remaining — submit to see which are missing
                    </span>
                  )}
                </div>
                {missingQuestionIds.length > 0 ? (
                  <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto sm:hidden">
                    {missingQuestionIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => scrollToQuestion(id)}
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-200 hover:bg-red-500/20"
                      >
                        Q{id}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-700 max-sm:py-3.5 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit exam'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Fixed mid-viewport on the left: floating pill, no labels; stays put while scrolling */}
        <div
          className="pointer-events-none fixed top-1/2 z-30 block -translate-y-1/2 left-[max(0.5rem,env(safe-area-inset-left))] sm:left-[max(1rem,env(safe-area-inset-left))] lg:left-6"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={TOTAL_QUESTIONS}
          aria-label={`Exam progress, ${answeredCount} of ${TOTAL_QUESTIONS} answered`}
        >
          <div className="rounded-full bg-zinc-950/75 p-[3px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-cyan-500/20 backdrop-blur-md sm:p-1">
          <div className="relative h-20 w-0.5 overflow-hidden rounded-full bg-zinc-800/95 shadow-inner ring-1 ring-zinc-700/50 sm:h-36 sm:w-1.5 sm:ring-zinc-700/60">
            <div
              className="absolute top-0 left-0 right-0 rounded-full bg-gradient-to-b from-orange-600 via-orange-500/90 to-cyan-500 transition-[height] duration-300 ease-out"
              style={{
                height: `${TOTAL_QUESTIONS ? Math.max(6, (answeredCount / TOTAL_QUESTIONS) * 100) : 0}%`,
              }}
            />
          </div>
          </div>
        </div>
        </div>
      </div>
        {timeExpired ? (
          <ExamTimeExpiredModal onOk={() => void handleTimeExpiredOk()} okPending={timeExpiredOkPending} />
        ) : null}
      </div>
    </PageContainer>
    <ExamSubmitCelebration show={celebrateSubmit} onDismiss={dismissCelebrate} />
    </>
  );
}
