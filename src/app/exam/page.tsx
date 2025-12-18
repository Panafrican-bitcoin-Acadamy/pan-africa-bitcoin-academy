'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { examQuestions } from '@/content/examQuestions';
import { CheckCircle2, XCircle, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { AdminModeBadge } from '@/components/AdminModeBadge';

interface ExamAccess {
  hasAccess: boolean;
  isRegistered: boolean;
  isEnrolled: boolean;
  isAdmin?: boolean;
  chapter21Completed: boolean;
  hasAdminAccess: boolean;
  examCompleted: boolean;
  examScore?: number | null;
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
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Determine if user is authenticated (either as student or admin)
  const isAuthenticated = isStudentAuth || isAdminAuth;
  const userEmail = profile?.email || adminEmail || null;
  const loading = authLoading || adminLoading;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/apply');
      return;
    }

    if (isAuthenticated && userEmail) {
      checkExamAccess();
    }
  }, [isAuthenticated, loading, userEmail]);

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
    // Clear validation error for this question
    setValidationErrors((prev) => prev.filter((id) => id !== questionId));
  };

  const validateAnswers = (): number[] => {
    const errors: number[] = [];
    for (let i = 1; i <= 50; i++) {
      const answer = answers[i.toString()];
      if (!answer || !['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
        errors.push(i);
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

    // Validate all answers
    const errors = validateAnswers();
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      scrollToQuestion(errors[0]);
      
      // Show detailed message with unanswered questions
      const unansweredList = errors.map(q => `Question ${q}`).join(', ');
      alert(`Please answer all questions before submitting.\n\nUnanswered questions: ${unansweredList}\n\n(${errors.length} question${errors.length > 1 ? 's' : ''} remaining)`);
      return;
    }

    // Confirm submission
    const confirmed = window.confirm(
      'Are you sure you want to submit your exam? You cannot change your answers after submission.'
    );

    if (!confirmed) return;

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
        alert(`Error: ${data.error}`);
        if (data.missingQuestions) {
          setValidationErrors(data.missingQuestions);
          scrollToQuestion(data.missingQuestions[0]);
        }
        return;
      }

      // Success - show results
      setExamResult({
        completed: true,
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage,
        submittedAt: data.submittedAt,
        message: data.message,
      });
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingAccess) {
    return (
      <>
        <AdminModeBadge />
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-zinc-400">Loading exam...</p>
          </div>
        </div>
      </>
    );
  }

  if (!accessCheck) {
    return (
      <>
        <AdminModeBadge />
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-zinc-300">Failed to load exam access information.</p>
          </div>
        </div>
      </>
    );
  }

  // Show access denied screen
  if (!accessCheck.hasAccess) {
    return (
      <>
        <AdminModeBadge />
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Exam Locked</h1>
            <p className="text-zinc-400 mb-6">{accessCheck.message}</p>
            
            {!accessCheck.chapter21Completed && (
              <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-zinc-300 mb-2">📚 Complete Chapter 21 first</p>
                <button
                  onClick={() => router.push('/chapters')}
                  className="text-orange-500 hover:text-orange-400 underline"
                >
                  Go to Chapters →
                </button>
              </div>
            )}

            {!accessCheck.hasAdminAccess && accessCheck.chapter21Completed && (
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <p className="text-sm text-zinc-300">
                  ⏳ Waiting for admin approval. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Show exam results if already completed (but allow admins to retake)
  if (accessCheck.examCompleted && examResult?.completed && !accessCheck.isAdmin) {
    return (
      <>
        <AdminModeBadge />
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Exam Completed</h1>
              <div className="text-6xl font-bold text-orange-500 mb-2">
                {examResult.score}/{examResult.totalQuestions}
              </div>
              <div className="text-2xl text-zinc-400 mb-6">{examResult.percentage}%</div>
              <p className="text-zinc-300 mb-8">
                Submitted on {new Date(examResult.submittedAt || '').toLocaleString()}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show exam form
  return (
    <>
      <AdminModeBadge />
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          {/* Header */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Final Exam</h1>
                <p className="text-zinc-400">50 Multiple Choice Questions</p>
              </div>
              {accessCheck.isAdmin && (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg px-4 py-2">
                  <p className="text-orange-400 text-sm font-semibold">👑 Admin Mode</p>
                  <p className="text-orange-300/70 text-xs">Testing Access</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Answered: {Object.keys(answers).length} / 50
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
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
                className={`bg-zinc-800/50 border rounded-lg p-6 ${
                  hasError ? 'border-red-500' : 'border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-lg font-semibold text-orange-500">
                    {questionId}.
                  </span>
                  <p className="text-white text-lg flex-1">{question.question}</p>
                  {hasError && (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-3 ml-8">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const optionText = question.options[option];
                    const isSelected = selectedAnswer === option;

                    return (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-500/20 border-2 border-orange-500'
                            : 'bg-zinc-900/50 border-2 border-transparent hover:bg-zinc-900/70'
                        } ${hasError ? 'border-red-500' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${questionId}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(questionId, option)}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="font-semibold text-zinc-300 w-6">{option}.</span>
                        <span className="text-zinc-300 flex-1">{optionText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>

          {/* Submit Section */}
          <div className="mt-8 bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {Object.keys(answers).length === 50 ? (
                  <span className="text-green-500 font-semibold">✓ All questions answered</span>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-orange-500 font-semibold">
                      ⚠ {50 - Object.keys(answers).length} question{50 - Object.keys(answers).length > 1 ? 's' : ''} remaining
                    </span>
                    {validationErrors.length > 0 && (
                      <span className="text-red-400 text-xs mt-1">
                        Unanswered: {validationErrors.slice(0, 5).map(q => `Q${q}`).join(', ')}{validationErrors.length > 5 ? ` +${validationErrors.length - 5} more` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Exam'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
