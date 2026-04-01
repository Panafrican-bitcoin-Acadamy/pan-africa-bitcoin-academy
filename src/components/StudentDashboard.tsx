'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { chaptersContent } from '@/content/chaptersContent';
import { Download, Book, FileText, Calendar as CalendarIcon, Video, FileCheck, Users, GraduationCap, Clock, ExternalLink, TrendingDown, RotateCcw, X, BookOpen } from 'lucide-react';
// Lazy load heavy components
const Calendar = lazy(() => import('./Calendar').then(mod => ({ default: mod.Calendar })));
const CertificateImageSection = lazy(() => import('./CertificateImageSection').then(mod => ({ default: mod.CertificateImageSection })));

interface UserData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
    status: string;
    photoUrl?: string;
    studentId?: string;
  };
  isRegistered: boolean;
  student: {
    progressPercent: number;
    assignmentsCompleted: number;
    projectsCompleted: number;
    liveSessionsAttended: number;
    attendancePercent?: number;
    chaptersCompleted?: number;
    totalChapters?: number;
    completedChapterNumbers?: number[];
    chapters?: Array<{
      chapterNumber: number;
      chapterSlug: string;
      isCompleted: boolean;
      isUnlocked: boolean;
    }>;
    satsPaid?: number;
    satsPending?: number;
    achievements?: Array<{
      id: string;
      title: string;
      icon: string;
      description: string;
      unlocked: boolean;
      satsReward: number;
      earnedAt: string | null;
    }>;
  } | null;
  cohort: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    status: string;
    level?: string;
    sessions?: number;
  } | null;
  cohortEnrollments: any[];
}

function TestimonialSection() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/testimonials/submit', { credentials: 'include' })
      .then(r => {
        if (!r.ok) { setLoaded(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data?.testimonial) {
          setExisting(data.testimonial);
          setComment(data.testimonial.testimonial || '');
          setRating(data.testimonial.rating || 0);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) { setMessage({ type: 'error', text: 'Please select a star rating' }); return; }
    if (comment.trim().length < 10) { setMessage({ type: 'error', text: 'Please write at least 10 characters' }); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimonial: comment.trim(), rating }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Testimonial submitted!' });
        setExisting({ testimonial: comment.trim(), rating, is_approved: false });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit' });
      }
    } catch { setMessage({ type: 'error', text: 'Something went wrong' }); }
    setSubmitting(false);
  };

  if (!loaded) return null;

  return (
    <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
      <h2 className="text-lg font-semibold text-zinc-50 mb-1">Rate Your Experience / <span className="text-zinc-300">ትምህርቲ ከመይ ኔሩ ሓሳብኩም ሃቡና።</span></h2>
      <p className="text-sm text-zinc-400 mb-4">Share your feedback about the academy. Your testimonial may be featured on our website.</p>

      {existing?.is_approved && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-400">
          Your testimonial is approved and visible on the website.
        </div>
      )}
      {existing && !existing.is_approved && (
        <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 text-sm text-yellow-400">
          Your testimonial is pending admin review.
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm text-zinc-300 mb-2 block">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <svg className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-zinc-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm text-zinc-400 self-center">{rating}/5</span>}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-zinc-300 mb-2 block">Your Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience at the academy..."
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
        />
        <p className="text-xs text-zinc-500 mt-1">{comment.length}/2000</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(249,115,22,0.2)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : existing ? 'Update Testimonial' : 'Submit Testimonial'}
      </button>
    </div>
  );
}

interface StudentDashboardProps {
  userData?: UserData | null;
}

export function StudentDashboard({ userData }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'certification' | 'leaderboard'>('overview');
  const [studentData, setStudentData] = useState<any | null>(null);
  const [satsTotals, setSatsTotals] = useState<{ paid: number; pending: number }>({ paid: 0, pending: 0 });
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [storedProfileEmail, setStoredProfileEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', country: '', city: '' });
  const [chapterStatus, setChapterStatus] = useState<Record<number, { isUnlocked: boolean; isCompleted: boolean }>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedUpcomingItem, setSelectedUpcomingItem] = useState<any | null>(null);
  const [expandedStudyMaterial, setExpandedStudyMaterial] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [withdrawalRequested, setWithdrawalRequested] = useState(false);
  const [requestedPendingSnapshot, setRequestedPendingSnapshot] = useState<number | null>(null);
  const WITHDRAW_REQUEST_SNAPSHOT_KEY = 'withdrawalRequestedPendingSnapshot';
  const [feedbackNotificationsOpen, setFeedbackNotificationsOpen] = useState(false);
  const [seenFeedbackMap, setSeenFeedbackMap] = useState<Record<string, string>>({});
  const [highlightedFeedbackAssignmentId, setHighlightedFeedbackAssignmentId] = useState<string | null>(null);
  const feedbackNotificationsRef = useRef<HTMLDivElement | null>(null);
  const FEEDBACK_SEEN_STORAGE_KEY = 'assignmentFeedbackSeenMap';

  const INF_ENABLED_KEY = 'inflationTrackerEnabled';
  const INF_YEAR_KEY = 'inflationYear';
  const INF_LOGIN_COUNTED_SESSION_KEY = 'inflationLoginCounted';
  const INF_BASE_YEAR = 1971;

  const [inflationTrackingEnabled, setInflationTrackingEnabled] = useState(false);
  const [inflationYear, setInflationYear] = useState(INF_BASE_YEAR);
  const [showInflationResetConfirm, setShowInflationResetConfirm] = useState(false);
  const inflationResetConfirmRef = useRef<HTMLDivElement | null>(null);

  const resetInflationTracker = () => {
    localStorage.setItem(INF_ENABLED_KEY, 'true');
    localStorage.setItem(INF_YEAR_KEY, String(INF_BASE_YEAR));
    sessionStorage.setItem(INF_LOGIN_COUNTED_SESSION_KEY, 'true');
    setInflationYear(INF_BASE_YEAR);
    window.dispatchEvent(new Event('inflationTrackerEnabledChanged'));
  };

  // Check localStorage for withdrawal request snapshot on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const requestedSnapshotRaw = localStorage.getItem(WITHDRAW_REQUEST_SNAPSHOT_KEY);
      if (requestedSnapshotRaw) {
        const requestedSnapshot = Number(requestedSnapshotRaw);
        if (!Number.isNaN(requestedSnapshot) && requestedSnapshot > 0) {
          setRequestedPendingSnapshot(requestedSnapshot);
        }
      }
    }
  }, []);

  // Inflation tracker: show Start button until the user starts tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const enabled = localStorage.getItem(INF_ENABLED_KEY) === 'true';
      setInflationTrackingEnabled(enabled);
      const savedYearRaw = localStorage.getItem(INF_YEAR_KEY);
      const savedYear = savedYearRaw ? Number(savedYearRaw) : INF_BASE_YEAR;
      setInflationYear(Number.isNaN(savedYear) ? INF_BASE_YEAR : savedYear);
    } catch {
      setInflationTrackingEnabled(false);
      setInflationYear(INF_BASE_YEAR);
    }

    const handler = () => {
      try {
        const enabled = localStorage.getItem(INF_ENABLED_KEY) === 'true';
        setInflationTrackingEnabled(enabled);
        const savedYearRaw = localStorage.getItem(INF_YEAR_KEY);
        const savedYear = savedYearRaw ? Number(savedYearRaw) : INF_BASE_YEAR;
        setInflationYear(Number.isNaN(savedYear) ? INF_BASE_YEAR : savedYear);
      } catch {
        // ignore
      }
    };

    window.addEventListener('inflationTrackerEnabledChanged', handler);
    return () => window.removeEventListener('inflationTrackerEnabledChanged', handler);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedUpcomingItem(null);
    };
    if (selectedUpcomingItem) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedUpcomingItem]);

  useEffect(() => {
    if (!showInflationResetConfirm) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!inflationResetConfirmRef.current?.contains(target)) {
        setShowInflationResetConfirm(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInflationResetConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showInflationResetConfirm]);

  // Load feedback-read state for notification badge
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(FEEDBACK_SEEN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setSeenFeedbackMap(parsed);
        }
      }
    } catch {
      // Ignore malformed localStorage data
    }
  }, []);

  // Close feedback notification popover on outside click
  useEffect(() => {
    if (!feedbackNotificationsOpen) return;
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!feedbackNotificationsRef.current?.contains(target)) {
        setFeedbackNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [feedbackNotificationsOpen]);

  // Keep withdrawal lock only for the same pending snapshot.
  // If pending drops to 0 OR changes to a different amount, unlock request button.
  useEffect(() => {
    const currentPending = userData?.student?.satsPending ?? satsTotals.pending ?? 0;
    if (!requestedPendingSnapshot) {
      setWithdrawalRequested(false);
      return;
    }

    const samePendingSnapshot = currentPending > 0 && currentPending === requestedPendingSnapshot;
    setWithdrawalRequested(samePendingSnapshot);

    if (!samePendingSnapshot) {
      setRequestedPendingSnapshot(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(WITHDRAW_REQUEST_SNAPSHOT_KEY);
      }
    }
  }, [userData?.student?.satsPending, satsTotals.pending, requestedPendingSnapshot]);

  useEffect(() => {
    let mounted = true;
    
    // If userData is provided from dashboard, use it
    if (userData) {
      if (mounted) {
        // Set student data from userData if registered
        if (userData.isRegistered && userData.student) {
          setStudentData({
            name: userData.profile.name,
            email: userData.profile.email,
            progress: userData.student.progressPercent,
            assignmentsCompleted: userData.student.assignmentsCompleted,
            projectsCompleted: userData.student.projectsCompleted,
            liveSessions: userData.student.liveSessionsAttended,
            cohort: userData.cohort?.name || '',
            status: userData.profile.status,
            photoUrl: userData.profile.photoUrl,
          });
        } else {
          // User is logged in but not registered as student
          setStudentData({
            name: userData.profile.name,
            email: userData.profile.email,
            progress: 0,
            assignmentsCompleted: 0,
            projectsCompleted: 0,
            liveSessions: 0,
            cohort: userData.cohort?.name || '',
            status: userData.profile.status,
            photoUrl: userData.profile.photoUrl,
          });
        }
      }
    }

    // Fallback: load stored email (from auth modal) if userData not provided
    try {
      const stored = localStorage.getItem('profileEmail');
      if (stored) {
        setStoredProfileEmail(stored);
        setProfileEmail(stored);
      }
    } catch {
      // ignore
    }
    const fetchStudent = async () => {
      try {
        const emailToUse = storedProfileEmail || profileEmail;
        if (!emailToUse) {
          // No email available - clear data
          if (mounted) {
            setStudentData(null);
          }
          return;
        }
        
        const url = `/api/students?email=${encodeURIComponent(emailToUse)}`;
        const res = await fetch(url);
        if (!res.ok) {
          // Silently fail - user can refresh page if needed
          if (mounted) {
            setStudentData(null);
          }
          return;
        }
        const data = await res.json();
        const students: any[] = data.students || [];
        // If no students found, that's okay - user might not be enrolled yet
        if (students.length === 0) {
          if (mounted) {
            setStudentData(null);
          }
          return;
        }
        const first = students.find((s) => s?.name) || students[0];
        if (mounted) {
          setStudentData(first || null);
        }
      } catch (err: any) {
        // Silently fail - user can refresh page if needed
        if (mounted) {
          setStudentData(null);
        }
      }
    };

    const fetchSatsTotals = async () => {
      try {
        // Get student email or ID for filtering
        const emailToUse = userData?.profile?.email || storedProfileEmail || profileEmail;
        const studentIdToUse = userData?.profile?.id;
        
        // Build query string
        let url = '/api/sats?';
        if (studentIdToUse) {
          url += `studentId=${encodeURIComponent(studentIdToUse)}`;
        } else if (emailToUse) {
          url += `email=${encodeURIComponent(emailToUse)}`;
        } else {
          // No identifier available - return zeros
          if (mounted) {
            setSatsTotals({ paid: 0, pending: 0 });
          }
          return;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load sats (${res.status})`);
        }
        const data = await res.json();
        if (mounted) {
          setSatsTotals({
            paid: data.totalPaid ?? 0,
            pending: data.totalPending ?? 0,
          });
        }
      } catch (err) {
        // Keep fallback zeros; no user-facing error needed here
        if (mounted) {
          setSatsTotals({ paid: 0, pending: 0 });
        }
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) {
          // Silently fail - user can refresh page if needed
          if (mounted) {
            setLeaderboardData([]);
          }
          return;
        }
        const data = await res.json();
        if (mounted && Array.isArray(data.leaderboard)) {
          setLeaderboardData(data.leaderboard);
        }
      } catch (err) {
        // Silently fail - user can refresh page if needed
        if (mounted) {
          setLeaderboardData([]);
        }
      }
    };

    // Only fetch if userData not provided
    if (!userData) {
      Promise.all([fetchStudent(), fetchSatsTotals(), fetchLeaderboard()]).finally(() => {
        if (mounted) setLoading(false);
      });
    } else {
      // If userData provided, still fetch sats and leaderboard
      Promise.all([fetchSatsTotals(), fetchLeaderboard()]).finally(() => {
        if (mounted) setLoading(false);
      });
    }
    
    // Listen for profile modal open event from Navbar
    const handleOpenProfileModal = () => {
      const emailToUse = storedProfileEmail || profileEmail;
      if (emailToUse) {
        setProfileModalOpen(true);
        setProfileError(null);
        setProfileData(null);
        setProfileEmail(emailToUse);
        fetchProfileByEmail(emailToUse);
      }
    };

    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    // Check URL params for profile modal
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openProfile') === 'true') {
        handleOpenProfileModal();
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }
    }
    
    return () => {
      mounted = false;
      window.removeEventListener('openProfileModal', handleOpenProfileModal);
    };
  }, [userData]); // Only re-run when userData changes, not profileEmail/storedProfileEmail

  // Fetch chapter status once when email changes - no auto-refresh (user can refresh page if needed)
  useEffect(() => {
    const fetchChapterStatus = async () => {
      const email = userData?.profile?.email || storedProfileEmail || profileEmail;
      if (!email) return;

      try {
        const response = await fetch('/api/chapters/unlock-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (data.chapters) {
          setChapterStatus(data.chapters);
        }
      } catch (error) {
        // Silently fail - user can refresh page if needed
      }
    };

    fetchChapterStatus();
  }, [userData, storedProfileEmail, profileEmail]);

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      const email = userData?.profile?.email || storedProfileEmail || profileEmail;
      if (!email) {
        setAssignments([]);
        return;
      }

      try {
        setLoadingAssignments(true);
        const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
        
        if (response.ok) {
          const data = await response.json();
          setAssignments(data.assignments || []);
        } else {
          // Silently fail - assignments are optional
          setAssignments([]);
        }
      } catch (error) {
        // Silently fail - assignments are optional
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };

    const fetchSessions = async () => {
      const email = userData?.profile?.email || storedProfileEmail || profileEmail;
      const cohortId = userData?.cohort?.id;
      
      if (!email && !cohortId) {
        setSessions([]);
        return;
      }

      try {
        setLoadingSessions(true);
        // Build URL - prefer cohortId if available, otherwise use email
        const url = cohortId 
          ? `/api/sessions?cohortId=${encodeURIComponent(cohortId)}`
          : `/api/sessions?email=${encodeURIComponent(email!)}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          // Transform sessions to match expected format
          const transformedSessions = (data.sessions || []).map((session: any) => {
            const cohortName = session.cohorts?.name || 'Cohort';
            const sessionDate = new Date(session.session_date);
            return {
              id: session.id,
              title: `${cohortName} - Session ${session.session_number}${session.topic ? `: ${session.topic}` : ''}`,
              date: sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              time: session.duration_minutes ? `${session.duration_minutes} min` : '60 min',
              link: session.link || null, // Get link from database
              session_date: session.session_date,
            };
          });
          setSessions(transformedSessions);
        } else {
          // Silently fail - sessions are optional
          setSessions([]);
        }
      } catch (error) {
        // Silently fail - sessions are optional
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    const fetchEvents = async () => {
      const cohortId = userData?.cohort?.id;
      
      try {
        setLoadingEvents(true);
        // Fetch events - include both cohort-specific and "for everyone" events
        const url = cohortId 
          ? `/api/events?cohort_id=${encodeURIComponent(cohortId)}`
          : '/api/events';
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          // Transform events to match expected format
          const transformedEvents = (data.events || []).map((event: any) => {
            const startTime = event.date ? new Date(event.date) : new Date();
            return {
              id: event.id,
              title: event.title || event.name || 'Untitled Event',
              type: event.type || 'community',
              date: startTime,
              dateString: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: event.time || '',
              description: event.description || '',
              link: event.link || null,
              image_url: event.image_url || null,
              image_alt_text: event.image_alt_text || '',
              chapter_title: event.chapter_title || '',
              chapter_slug: event.chapter_slug || '',
              topic_detail: event.topic_detail || '',
              topic_theory: event.topic_theory || '',
              topic_practice: event.topic_practice || '',
              topic_live_session: event.topic_live_session || '',
              topic_quiz: event.topic_quiz || '',
              topic_learn: Array.isArray(event.topic_learn) ? event.topic_learn : [],
              is_registration_enabled: !!event.is_registration_enabled,
              cohort_id: event.cohort_id || null,
            };
          });
          setEvents(transformedEvents);
        } else {
          console.warn('Failed to fetch events:', response.status);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchAssignments();
    fetchSessions();
    fetchEvents();
  }, [userData, storedProfileEmail, profileEmail]);

  const fetchProfileByEmail = async (lookupEmail: string) => {
    if (!lookupEmail) {
      setProfileError('Email is required');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileData(null);
      const res = await fetch('/api/profile/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      if (data.valid && data.profile) {
        setProfileData(data.profile);
      } else {
        setProfileError('Profile not found for this email.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to load profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fallbackStudent = {
    name: 'Student',
    cohort: '',
    role: 'Student',
    courseProgress: 0,
    chaptersCompleted: 0,
    totalChapters: 21,
    assignmentsCompleted: 0,
    totalAssignments: 4,
    satsEarned: 0,
    attendanceRate: 0,
    attendancePercent: 0,
  };

  const student = studentData || fallbackStudent;
  // Default achievements fallback (will be replaced by API data)
  const defaultAchievements = [
    { id: 'wallet_created', title: 'Completed First Wallet', icon: '🎖', unlocked: false },
    { id: 'first_transaction', title: 'Sent First Sats', icon: '🏆', unlocked: false },
    { id: 'three_assignments', title: '3 Assignments Done', icon: '🎯', unlocked: false },
    { id: 'lightning_user', title: 'Lightning User', icon: '⚡', unlocked: false },
    { id: 'recovery_master', title: 'Recovery Master', icon: '🔐', unlocked: false },
  ];

  // No fallback live sessions - show empty list if no sessions available
  // Use achievements from userData if available, otherwise use defaults
  const achievements = (userData?.student?.achievements && userData.student.achievements.length > 0)
    ? userData.student.achievements
    : defaultAchievements;
  // Use fetched sessions from database, fallback to student.liveSessions if available
  const liveSessions = sessions.length > 0 
    ? sessions 
    : (student.liveSessions && student.liveSessions.length > 0)
      ? student.liveSessions
      : [];

  // Combine sessions and events, filter for upcoming items, and sort by date
  const getUpcomingItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transform sessions to match event format
    const sessionItems = liveSessions
      .filter((session: any) => {
        // Handle both session_date (from API) and date (from transformed sessions)
        const sessionDateStr = session.session_date || session.date;
        if (!sessionDateStr) return false;
        try {
          const sessionDate = new Date(sessionDateStr);
          if (isNaN(sessionDate.getTime())) return false;
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() >= today.getTime();
        } catch {
          return false;
        }
      })
      .map((session: any) => {
        const sessionDateStr = session.session_date || session.date;
        const sessionDate = new Date(sessionDateStr);
        return {
          id: `session-${session.id}`,
          title: session.title,
          type: 'live-class',
          date: sessionDate,
          dateString: session.date || sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: session.time || '',
          description: session.topic || `Cohort session ${session.session_number}`,
          link: session.link || null,
        };
      });

    // Filter events for upcoming
    const eventItems = (events || [])
      .filter((event: any) => {
        if (!event || !event.date) return false;
        try {
          const eventDate = new Date(event.date);
          if (isNaN(eventDate.getTime())) return false;
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() >= today.getTime();
        } catch {
          return false;
        }
      })
      .map((event: any) => ({
        ...event,
        dateString: event.dateString || new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));

    // Add cohort start date as an upcoming item
    const cohortItems: any[] = [];
    if (userData?.cohort?.startDate) {
      try {
        const cohortStartDate = new Date(userData.cohort.startDate);
        if (!isNaN(cohortStartDate.getTime())) {
          cohortStartDate.setHours(0, 0, 0, 0);
          if (cohortStartDate.getTime() >= today.getTime()) {
            cohortItems.push({
              id: `cohort-start-${userData.cohort.id}`,
              title: `${userData.cohort.name} - Orientation & Start`,
              type: 'cohort',
              date: cohortStartDate,
              dateString: cohortStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: '',
              description: `Welcome to ${userData.cohort.name}! Orientation session and cohort kickoff.`,
              link: null,
            });
          }
        }
      } catch (error) {
        console.warn('Error parsing cohort start date:', error);
      }
    }

    // Combine and sort by date
    const allItems = [...sessionItems, ...eventItems, ...cohortItems].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return allItems.slice(0, 5); // Show up to 5 upcoming items
  };

  const upcomingItems = getUpcomingItems();

  // Event type icons and colors
  const getEventTypeConfig = (type: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
      'live-class': {
        icon: Video,
        color: 'text-blue-300',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      },
      'assignment': {
        icon: FileCheck,
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
      },
      'community': {
        icon: Users,
        color: 'text-purple-300',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
      },
      'workshop': {
        icon: GraduationCap,
        color: 'text-cyan-300',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
      },
      'deadline': {
        icon: Clock,
        color: 'text-red-300',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      },
      'quiz': {
        icon: FileText,
        color: 'text-orange-300',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
      },
      'cohort': {
        icon: GraduationCap,
        color: 'text-green-300',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
      },
    };

    return configs[type] || {
      icon: CalendarIcon,
      color: 'text-zinc-300',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/30',
    };
  };
  
  // Build chapters list from chaptersContent with completion status (using same logic as chapters page)
  const chapters = chaptersContent.map((chapter) => {
    // Use chapter status from API (same as chapters page)
    const status = chapterStatus[chapter.number];
    const isCompleted = status?.isCompleted || false;
    const isUnlocked = status?.isUnlocked || (chapter.number === 1); // Chapter 1 always unlocked for enrolled students
    
    return {
      id: `chapter-${chapter.number}`,
      number: chapter.number,
      title: chapter.title,
      slug: chapter.slug,
      duration: chapter.duration,
      status: isCompleted ? 'completed' : isUnlocked ? 'in-progress' : 'locked',
      link: `/chapters/${chapter.slug}`,
      isCompleted,
      isUnlocked,
    };
  });

  const chapterNumberBySlug = new Map(chaptersContent.map((c) => [c.slug, c.number]));
  const byChapterOrder = (a: any, b: any) => {
    const aNum = a?.chapterSlug ? chapterNumberBySlug.get(a.chapterSlug) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bNum = b?.chapterSlug ? chapterNumberBySlug.get(b.chapterSlug) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    if (aNum !== bNum) return aNum - bNum;
    return String(a?.title || '').localeCompare(String(b?.title || ''));
  };
  const pendingOrOverdueAssignments = assignments
    .filter((a: any) => a.status === 'pending' || a.status === 'overdue')
    .sort(byChapterOrder);
  const completedAssignments = assignments
    // Treat any submitted assignment as "done" for dashboard organization
    .filter((a: any) => a.status === 'completed' || a.status === 'submitted' || Boolean(a?.submission))
    .sort(byChapterOrder);
  const completedAssignmentsWithFeedback = completedAssignments.filter(
    (assignment: any) => Boolean(assignment?.submission?.feedback && String(assignment.submission.feedback).trim().length > 0)
  );
  const feedbackNotifications = completedAssignmentsWithFeedback.map((assignment: any) => {
    const submissionId = String(assignment?.submission?.id || assignment.id);
    const feedback = String(assignment?.submission?.feedback || '').trim();
    const feedbackKey = `${submissionId}:${feedback}`;
    const isUnread = seenFeedbackMap[submissionId] !== feedbackKey;
    return {
      assignmentId: String(assignment.id),
      submissionId,
      title: assignment.title,
      chapterSlug: assignment.chapterSlug || null,
      feedback,
      feedbackKey,
      isUnread,
    };
  });
  const unreadFeedbackCount = feedbackNotifications.filter((item) => item.isUnread).length;
  const studyMaterials = [
    {
      id: 'whitepaper',
      title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
      author: 'Satoshi Nakamoto (2008)',
      description: 'The original Bitcoin paper. Core reading to understand Bitcoin architecture and purpose.',
      href: 'https://bitcoin.org/bitcoin.pdf',
      action: 'Open PDF',
      external: true,
    },
    {
      id: 'little-book',
      title: 'The Little Book of Bitcoin',
      author: 'Bitcoin Collective',
      description: 'Short and beginner-friendly introduction to Bitcoin ideas and practical usage.',
      href: 'https://www.littlebitcoinbook.com/',
      action: 'Read / Download',
      external: true,
    },
    {
      id: 'tigrigna',
      title: 'The Little Book of Bitcoin in Tigrigna',
      author: 'ትግርኛ ትርጉም',
      description: 'Simple intro in Tigrigna for sovereignty, wallet basics, and self-custody.',
      href: '/chapters',
      action: 'Get from Chapters',
      external: false,
    },
    {
      id: 'mastering',
      title: 'Mastering Bitcoin',
      author: 'Andreas M. Antonopoulos',
      description: 'Technical deep dive into Bitcoin internals, transactions, scripts, and networking.',
      href: 'https://github.com/bitcoinbook/bitcoinbook',
      action: 'Read Online',
      external: true,
    },
    {
      id: 'programming',
      title: 'Programming Bitcoin',
      author: 'Jimmy Song',
      description: 'Hands-on coding approach to Bitcoin using Python and protocol-level exercises.',
      href: 'https://programmingbitcoin.com/',
      action: 'Get the Book',
      external: true,
    },
    {
      id: 'devdocs',
      title: 'Bitcoin Developer Docs',
      author: 'developer.bitcoin.org',
      description: 'Official reference docs for developers building on Bitcoin.',
      href: 'https://developer.bitcoin.org/',
      action: 'Browse Docs',
      external: true,
    },
  ];

  const markFeedbackAsRead = (submissionId: string, feedbackKey: string) => {
    const next = { ...seenFeedbackMap, [submissionId]: feedbackKey };
    setSeenFeedbackMap(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FEEDBACK_SEEN_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const handleFeedbackNotificationClick = (item: { assignmentId: string; submissionId: string; feedbackKey: string }) => {
    markFeedbackAsRead(item.submissionId, item.feedbackKey);
    setFeedbackNotificationsOpen(false);
    setActiveTab('overview');
    setHighlightedFeedbackAssignmentId(item.assignmentId);

    setTimeout(() => {
      const target = document.getElementById(`completed-feedback-${item.assignmentId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };
  
  // Assignments are now fetched from API and stored in state
  const resources = student.resources || [];
  const leaderboard = leaderboardData;
  
  // Calculate chapters completed from chapterStatus (dynamic, updates in real-time)
  // Use userData if available, otherwise fallback to chapterStatus
  const chaptersCompleted = userData?.student?.chaptersCompleted ?? 
    Object.values(chapterStatus).filter((status) => status.isCompleted === true).length;

  const totalChapters = 21;
  
  // Calculate course progress from completed chapters (dynamic)
  const courseProgress = Math.round((chaptersCompleted / totalChapters) * 100);
  
  // Get attendance from userData if available, otherwise from student data
  const attendance = userData?.student?.attendancePercent ?? student.attendancePercent ?? student.attendanceRate ?? 0;
  
  // Get assignments completed from userData if available
  const assignmentsCompleted = userData?.student?.assignmentsCompleted ?? student.assignmentsCompleted ?? 0;
  
  // Get sats earned - prefer userData, then satsTotals
  const satsEarned = userData?.student?.satsPaid ?? satsTotals.paid ?? 0;
  const satsPending = userData?.student?.satsPending ?? satsTotals.pending ?? 0;
  
  // Certification requirements
  const totalAssignments = 4;
  const requiredAttendance = 80; // 80%
  const requiredSats = 500;
  
  // Check each requirement
  const hasCompletedAllChapters = chaptersCompleted >= totalChapters;
  const hasCompletedAllAssignments = assignmentsCompleted >= totalAssignments;
  const hasMetAttendance = attendance >= requiredAttendance;
  const hasEarnedEnoughSats = satsEarned >= requiredSats;
  const [examResult, setExamResult] = useState<{ score: number; totalQuestions: number; percentage: number; submittedAt: string } | null>(null);
  const [examAccess, setExamAccess] = useState<{ hasAccess: boolean; chapter21Completed: boolean; hasAdminAccess: boolean; examCompleted: boolean; isAdmin?: boolean } | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);

  // Fetch exam results and access
  useEffect(() => {
    if (userData?.profile?.email) {
      fetchExamData();
    }
  }, [userData?.profile?.email]);

  const handleWithdraw = async () => {
    if (satsPending === 0) {
      setWithdrawMessage({
        type: 'error',
        text: 'You have no pending sats to withdraw. Complete assignments and chapters to earn sats!',
      });
      return;
    }

    setWithdrawing(true);
    setWithdrawMessage(null);

    try {
      const response = await fetch('/api/sats/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setWithdrawMessage({
          type: 'success',
          text: data.message || 'Withdrawal request submitted successfully! You will receive your sats via Lightning Network soon.',
        });
        const snapshot = Number(data.pendingSnapshotSats ?? satsPending);
        if (!Number.isNaN(snapshot) && snapshot > 0) {
          setRequestedPendingSnapshot(snapshot);
          setWithdrawalRequested(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem(WITHDRAW_REQUEST_SNAPSHOT_KEY, String(snapshot));
          }
        }
      } else if (response.status === 409 && data?.alreadyRequested) {
        // Server-side dedupe: lock only for current pending snapshot
        const snapshot = Number(data.pendingSnapshotSats ?? satsPending);
        if (!Number.isNaN(snapshot) && snapshot > 0) {
          setRequestedPendingSnapshot(snapshot);
          setWithdrawalRequested(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem(WITHDRAW_REQUEST_SNAPSHOT_KEY, String(snapshot));
          }
        }
        setWithdrawMessage({
          type: 'success',
          text: data.message || 'You already requested withdrawal for your current pending sats.',
        });
      } else {
        setWithdrawalRequested(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(WITHDRAW_REQUEST_SNAPSHOT_KEY);
        }
        setWithdrawMessage({
          type: 'error',
          text: data.error || 'Failed to submit withdrawal request. Please try again.',
        });
      }
    } catch (error: any) {
      setWithdrawMessage({
        type: 'error',
        text: error.message || 'Failed to submit withdrawal request. Please try again.',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const fetchExamData = async () => {
    if (!userData?.profile?.email) return;
    setLoadingExam(true);
    try {
      const [accessRes, resultsRes] = await Promise.all([
        fetch('/api/exam/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.profile.email }),
        }),
        fetch('/api/exam/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.profile.email }),
        }),
      ]);

      const accessData = await accessRes.json();
      const resultsData = await resultsRes.json();

      setExamAccess({
        hasAccess: accessData.hasAccess || false,
        chapter21Completed: accessData.chapter21Completed || false,
        hasAdminAccess: accessData.hasAdminAccess || false,
        examCompleted: accessData.examCompleted || false,
        isAdmin: accessData.isAdmin || false,
      });

      if (resultsData.completed) {
        setExamResult({
          score: resultsData.score,
          totalQuestions: resultsData.totalQuestions,
          percentage: resultsData.percentage,
          submittedAt: resultsData.submittedAt,
        });
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoadingExam(false);
    }
  };

  const examPassMark = examResult
    ? Math.max(1, Math.ceil(examResult.totalQuestions * 0.7))
    : Math.ceil(50 * 0.7);
  const hasPassedFinalAssessment = examResult
    ? examResult.score >= examPassMark
    : false;
  
  // Calculate certification progress (20% per requirement)
  const certificationRequirements = [
    hasCompletedAllChapters,
    hasCompletedAllAssignments,
    hasMetAttendance,
    hasEarnedEnoughSats,
    hasPassedFinalAssessment,
  ];
  const completedRequirements = certificationRequirements.filter(Boolean).length;
  const certificationProgress = Math.round((completedRequirements / 5) * 100);
  const hasMetPreExamCriteria =
    hasCompletedAllChapters && hasCompletedAllAssignments && hasEarnedEnoughSats;
  const canTakeExam = !!(
    examAccess?.hasAccess &&
    (examAccess?.isAdmin ? true : hasMetPreExamCriteria)
  );

  return (
    <>
      <div className="min-h-screen bg-black/95">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileModal
          open={profileModalOpen}
          onClose={() => {
            // Immediate update for modal visibility (critical)
            setProfileModalOpen(false);
            // Defer non-critical state update to avoid blocking UI
            setTimeout(() => {
              setIsEditingProfile(false);
            }, 0);
          }}
          loading={profileLoading}
          error={profileError}
          profile={profileData}
          isRegistered={!!studentData}
          profileImage={profileImage}
          onImageChange={setProfileImage}
          onUpdate={async (updatedData: any) => {
            try {
              // If profileImage is a URL (already uploaded), use it; otherwise don't send it
              const updatePayload: any = { 
                email: storedProfileEmail || profileEmail, 
                ...updatedData 
              };
              
              // Only include photoUrl if it's a URL (not base64)
              if (profileImage && profileImage.startsWith('http')) {
                updatePayload.photoUrl = profileImage;
              }
              
              const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
              });
              if (!res.ok) throw new Error('Failed to update profile');
              const data = await res.json();
              setProfileData(data.profile);
              if (data.profile.photoUrl) {
                setProfileImage(data.profile.photoUrl);
              }
              setIsEditingProfile(false);
              alert('Profile updated successfully!');
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            }
          }}
        />

        {loading && (
          <div className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-cyan-100">
            Loading student data...
          </div>
        )}

        {/* Welcome + Inflation Tracker */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              Welcome back, {userData?.profile?.name || student.name || 'Student'} 👋
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              {userData?.isRegistered
                ? `Your journey to Bitcoin sovereignty continues.${userData?.cohort ? ` You're enrolled in ${userData.cohort.name}.` : ''}`
                : 'Your journey to Bitcoin sovereignty continues.'}
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[360px]">
            <div className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1 rounded-lg border border-orange-400/25 bg-black/80 px-3 py-2.5 shadow-[0_0_16px_rgba(249,115,22,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-orange-300" />
                    <h3 className="text-sm font-semibold text-zinc-100">Inflation Tracker</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {inflationTrackingEnabled
                      ? `Tracking is ON · Year ${inflationYear}`
                      : 'Tracking is OFF'}
                  </p>
                </div>

                {!inflationTrackingEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetInflationTracker();
                      setInflationTrackingEnabled(true);
                    }}
                    className="whitespace-nowrap rounded-md bg-gradient-to-r from-orange-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-black shadow-[0_0_12px_rgba(249,115,22,0.2)] transition hover:brightness-110"
                  >
                    Start
                  </button>
                ) : (
                  <div className="relative" ref={inflationResetConfirmRef}>
                    <button
                      type="button"
                      onClick={() => setShowInflationResetConfirm((prev) => !prev)}
                      className="whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restart
                      </span>
                    </button>
                    {showInflationResetConfirm && (
                      <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-orange-400/30 bg-zinc-900 p-3 text-xs shadow-xl">
                        <p className="text-zinc-200">Are you sure you want to reset the tracker?</p>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInflationResetConfirm(false)}
                            className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-zinc-300 transition hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resetInflationTracker();
                              setShowInflationResetConfirm(false);
                            }}
                            className="rounded-md border border-orange-400/40 bg-orange-500/20 px-2.5 py-1 font-semibold text-orange-200 transition hover:bg-orange-500/30"
                          >
                            Yes, reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative" ref={feedbackNotificationsRef}>
                <button
                  type="button"
                  onClick={() => setFeedbackNotificationsOpen((prev) => !prev)}
                  aria-label="Open assignment feedback notifications"
                  className="relative inline-flex h-full items-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-lg transition hover:bg-cyan-500/25"
                >
                  <span aria-hidden="true">🔔</span>
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                    {unreadFeedbackCount}
                  </span>
                </button>
                {feedbackNotificationsOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-[min(92vw,26rem)] rounded-lg border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-100">Notifications</p>
                      <span className="text-xs text-zinc-400">{unreadFeedbackCount} notification{unreadFeedbackCount === 1 ? '' : 's'}</span>
                    </div>
                    {feedbackNotifications.length === 0 ? (
                      <p className="text-sm text-zinc-400">0 notification</p>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {feedbackNotifications.map((item) => (
                          <button
                            key={item.submissionId}
                            type="button"
                            onClick={() => handleFeedbackNotificationClick(item)}
                            className={`w-full rounded-md border px-3 py-2 text-left transition ${
                              item.isUnread
                                ? 'border-orange-400/40 bg-orange-500/10 hover:bg-orange-500/20'
                                : 'border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                              {item.isUnread && (
                                <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-300">{item.feedback}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'overview'
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('certification')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'certification'
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Certification
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'leaderboard'
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Layout: Next Action + Calendar on top */}
            <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
              {/* Left side: Next Action Block + Progress Overview + Achievements & Sats */}
              <div className="lg:col-span-2 space-y-6">
                {/* Next Action Block */}
                <div className="rounded-xl border-2 border-orange-400/50 bg-gradient-to-r from-orange-500/20 via-orange-400/15 to-cyan-400/20 p-6 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-orange-200">Your Next Step</h2>
                      {(() => {
                        // Determine next action based on student progress
                        const pendingAssignments = assignments.filter((a: any) => a.status === 'pending' || a.status === 'overdue');
                        const nextChapter = chapters.find((ch) => !ch.isCompleted && ch.isUnlocked);
                        
                        // Find upcoming sessions (handle both date strings and Date objects)
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const upcomingSessions = liveSessions.filter((s: any) => {
                          if (!s.date) return false;
                          try {
                            const sessionDate = typeof s.date === 'string' ? new Date(s.date) : s.date;
                            sessionDate.setHours(0, 0, 0, 0);
                            return sessionDate >= now;
                          } catch {
                            return false;
                          }
                        }).slice(0, 1);

                        // Priority: Pending assignments > Next chapter > Upcoming session > Default
                        if (pendingAssignments.length > 0) {
                          const count = pendingAssignments.length;
                          return (
                            <p className="mt-2 text-lg text-zinc-100">
                              {count === 1 
                                ? 'Complete 1 pending assignment to earn 500 sats.'
                                : `Complete ${count} pending assignments to earn sats rewards.`}
                            </p>
                          );
                        } else if (nextChapter) {
                          return (
                            <p className="mt-2 text-lg text-zinc-100">
                              Continue with Chapter {nextChapter.number}: {nextChapter.title}
                            </p>
                          );
                        } else if (upcomingSessions.length > 0) {
                          const session = upcomingSessions[0];
                          return (
                            <p className="mt-2 text-lg text-zinc-100">
                              Upcoming session: {session.title}
                              {session.time && ` • ${session.time}`}
                            </p>
                          );
                        } else {
                          return (
                            <p className="mt-2 text-lg text-zinc-100">
                              Check assignments and upcoming events.
                            </p>
                          );
                        }
                      })()}
                    </div>
                    <Link
                      href="#assignments"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById('assignments');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 whitespace-nowrap sm:ml-4"
                    >
                      View Tasks
                    </Link>
                  </div>
                </div>
                
                {/* Achievements & Sats Wallet */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-xl border border-yellow-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <h2 className="mb-4 text-xl font-semibold text-zinc-50">Achievements</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((achievement: any) => (
                        <div
                          key={achievement.id}
                          className={`rounded-lg border p-3 text-center ${
                            achievement.unlocked
                              ? 'border-yellow-500/50 bg-yellow-500/10'
                              : 'border-zinc-700 bg-zinc-900/50 opacity-50'
                          }`}
                        >
                          <div className="mb-1 text-2xl">{achievement.icon}</div>
                          <div className="text-xs font-medium text-zinc-300">{achievement.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                    <h2 className="mb-4 text-xl font-semibold text-zinc-50">Sats Wallet</h2>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                        <div className="text-sm text-zinc-400">Total Earned</div>
                        <div className="text-2xl font-bold text-orange-300">
                          {satsEarned} sats
                        </div>
                      </div>
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="text-sm text-zinc-400">Pending Rewards</div>
                        <div className="text-xl font-semibold text-yellow-300">
                            {satsPending} sats
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleWithdraw}
                        disabled={withdrawing || satsPending === 0 || withdrawalRequested}
                        className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {withdrawing
                          ? 'Submitting Request...'
                          : withdrawalRequested
                          ? 'Already Requested (Current Pending)'
                          : 'Withdraw (LNURL)'}
                      </button>
                      {withdrawMessage && (
                        <div className={`mt-2 rounded-lg border p-3 text-sm ${
                          withdrawMessage.type === 'success'
                            ? 'border-green-500/30 bg-green-500/10 text-green-200'
                            : 'border-red-500/30 bg-red-500/10 text-red-200'
                        }`}>
                          {withdrawMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Right side: Calendar */}
              <div id="calendar" className="lg:col-span-1 scroll-mt-8">
                <Suspense fallback={<div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50"><div className="text-zinc-400">Loading calendar...</div></div>}>
                  <Calendar 
                    cohortId={userData?.cohort?.id || null}
                    studentId={userData?.profile?.id || null}
                    email={userData?.profile?.email || storedProfileEmail || profileEmail || undefined}
                  />
                </Suspense>
              </div>
            </div>

            {/* Second Row: Progress Overview and Upcoming Events */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Progress Overview - takes 2 columns */}
              <div className="lg:col-span-2 rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Progress Overview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Course Progress</span>
                          <span className="font-semibold text-orange-400">{courseProgress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all"
                            style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">📘</div>
                      <div className="text-sm text-zinc-400">Chapters</div>
                      <div className="text-lg font-semibold text-cyan-300">
                            {chaptersCompleted}/{totalChapters}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">🛠</div>
                      <div className="text-sm text-zinc-400">Assignments</div>
                      <div className="text-lg font-semibold text-orange-300">
                            {assignmentsCompleted}/{student.totalAssignments ?? 4}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">⚡</div>
                      <div className="text-sm text-zinc-400">Sats Earned</div>
                          <div className="text-lg font-semibold text-yellow-300">{satsEarned}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">🎓</div>
                      <div className="text-sm text-zinc-400">Attendance</div>
                          <div className="text-lg font-semibold text-purple-300">{attendance}%</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Upcoming Events - takes 1 column, positioned next to Progress */}
              <div className="lg:col-span-1 rounded-xl border border-purple-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-50">Upcoming</h2>
                  {upcomingItems.length > 0 && (
                    <Link
                      href="#calendar"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById('calendar');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="text-xs text-purple-300 hover:text-purple-200 transition"
                    >
                      View All
                    </Link>
                  )}
                </div>
                {loadingEvents || loadingSessions ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 animate-pulse">
                        <div className="h-4 w-20 bg-zinc-700 rounded mb-2"></div>
                        <div className="h-5 w-full bg-zinc-700 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-zinc-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingItems.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {upcomingItems.map((item: any) => {
                      const config = getEventTypeConfig(item.type);
                      const Icon = config.icon;
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedUpcomingItem(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedUpcomingItem(item);
                            }
                          }}
                          className={`cursor-pointer rounded-lg border ${config.borderColor} ${config.bgColor} p-3 transition hover:brightness-110`}
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <Icon className={`h-4 w-4 ${config.color} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="mb-1 flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium ${config.color}`}>
                                  {item.dateString}
                                </span>
                                {item.time && (
                                  <>
                                    <span className="text-zinc-500">•</span>
                                    <span className="text-xs text-zinc-400">{item.time}</span>
                                  </>
                                )}
                              </div>
                              <div className="mb-1 text-sm font-semibold text-zinc-100 line-clamp-1">
                                {item.title}
                              </div>
                              {item.description && (
                                <div className="mb-2 text-xs text-zinc-400 line-clamp-2">
                                  {item.description}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUpcomingItem(item);
                                }}
                                className={`mt-2 inline-flex items-center gap-1.5 rounded ${config.bgColor} border ${config.borderColor} px-2.5 py-1 text-xs font-medium ${config.color} transition hover:brightness-110`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-6 text-center">
                    <CalendarIcon className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400 mb-1">No upcoming events</p>
                    <p className="text-xs text-zinc-500">Check back later for new sessions and events</p>
                  </div>
                )}
              </div>
            </div>

            {selectedUpcomingItem && createPortal(
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                onClick={() => setSelectedUpcomingItem(null)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-upcoming-modal-title"
              >
                <div
                  className="relative z-[100000] w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border-2 border-zinc-600 bg-zinc-900 shadow-2xl flex flex-col sm:flex-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedUpcomingItem(null)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 transition hover:bg-zinc-600"
                    aria-label="Close details"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {selectedUpcomingItem.image_url ? (
                    <div className="flex w-full sm:w-[44%] sm:min-w-0 sm:shrink-0 items-center justify-center bg-zinc-950 p-4 sm:rounded-l-xl sm:border-r border-b sm:border-b-0 border-zinc-700/50">
                      <img
                        src={selectedUpcomingItem.image_url}
                        alt={selectedUpcomingItem.image_alt_text || selectedUpcomingItem.title}
                        className="max-h-[200px] w-full object-contain object-center sm:max-h-80"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 pt-12 sm:pt-5">
                    <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                      <span className="font-medium text-zinc-200">{selectedUpcomingItem.dateString}</span>
                      {selectedUpcomingItem.time && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span>{selectedUpcomingItem.time}</span>
                        </>
                      )}
                    </div>

                    <h3 id="dashboard-upcoming-modal-title" className="mb-2 pr-10 text-xl font-bold text-zinc-50">
                      {selectedUpcomingItem.title}
                    </h3>

                    {(selectedUpcomingItem.chapter_title ||
                      selectedUpcomingItem.topic_detail ||
                      selectedUpcomingItem.topic_theory ||
                      selectedUpcomingItem.topic_practice ||
                      selectedUpcomingItem.topic_live_session ||
                      selectedUpcomingItem.topic_quiz ||
                      (selectedUpcomingItem.topic_learn && selectedUpcomingItem.topic_learn.length > 0)) && (
                      <div className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-3.5">
                        {selectedUpcomingItem.chapter_title && (
                          <p className="mb-2 text-sm font-semibold text-cyan-300">
                            Topic: {selectedUpcomingItem.chapter_title}
                          </p>
                        )}
                        {selectedUpcomingItem.topic_theory && (
                          <p className="mb-1.5 text-sm text-zinc-300">Theory: {selectedUpcomingItem.topic_theory}</p>
                        )}
                        {selectedUpcomingItem.topic_practice && (
                          <p className="mb-1.5 text-sm text-zinc-300">Practice: {selectedUpcomingItem.topic_practice}</p>
                        )}
                        {selectedUpcomingItem.topic_live_session && (
                          <p className="mb-1.5 text-sm text-zinc-300">Live: {selectedUpcomingItem.topic_live_session}</p>
                        )}
                        {selectedUpcomingItem.topic_quiz && (
                          <p className="mb-1.5 text-sm text-zinc-300">Quiz: {selectedUpcomingItem.topic_quiz}</p>
                        )}
                        {selectedUpcomingItem.topic_detail && (
                          <p className="text-sm leading-relaxed text-zinc-300">{selectedUpcomingItem.topic_detail}</p>
                        )}
                        {selectedUpcomingItem.topic_learn && selectedUpcomingItem.topic_learn.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
                            {selectedUpcomingItem.topic_learn.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <p className="mb-4 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {selectedUpcomingItem.description || 'No additional details.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-300">
                        {selectedUpcomingItem.type}
                      </span>

                      {selectedUpcomingItem.chapter_slug && (
                        <Link
                          href={`/chapters/${selectedUpcomingItem.chapter_slug}`}
                          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/22"
                        >
                          <BookOpen className="h-4 w-4" />
                          View chapter{selectedUpcomingItem.chapter_title ? `: ${selectedUpcomingItem.chapter_title}` : ''}
                        </Link>
                      )}

                      {selectedUpcomingItem.link && selectedUpcomingItem.link !== '#' && selectedUpcomingItem.link.trim() !== '' && (
                        <a
                          href={selectedUpcomingItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/25"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open link
                        </a>
                      )}

                      {selectedUpcomingItem.is_registration_enabled && !selectedUpcomingItem.cohort_id && (
                        <Link
                          href={`/events/${selectedUpcomingItem.id}/register`}
                          className="inline-flex items-center gap-2 rounded-md border border-green-500/35 bg-green-500/12 px-3 py-1.5 text-sm font-medium text-green-200 transition hover:bg-green-500/22"
                        >
                          Register
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Study Materials */}
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Study Materials</h2>
              <p className="mb-6 text-sm text-zinc-400">
                Download essential Bitcoin resources and books to deepen your understanding.
              </p>
              <div className="space-y-2">
                {studyMaterials.map((material) => {
                  const isOpen = expandedStudyMaterial === material.id;
                  return (
                    <div key={material.id} className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40">
                      <button
                        type="button"
                        onClick={() => setExpandedStudyMaterial((prev) => (prev === material.id ? null : material.id))}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-900/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100">{material.title}</p>
                          <p className="text-xs text-zinc-400">{material.author}</p>
                        </div>
                        <span
                          className={`text-lg leading-none text-zinc-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        >
                          ⌄
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-zinc-800/80 px-4 py-3">
                          <p className="mb-3 text-sm text-zinc-300">{material.description}</p>
                          {material.external ? (
                            <a
                              href={material.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/22"
                            >
                              <Download className="h-4 w-4" />
                              {material.action}
                            </a>
                          ) : (
                            <Link
                              href={material.href}
                              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/22"
                            >
                              <Download className="h-4 w-4" />
                              {material.action}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignments & Tasks */}
            <div id="assignments" className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Assignments & Tasks</h2>
              {loadingAssignments ? (
                <div className="py-8 text-center text-zinc-400">Loading assignments...</div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-orange-300">Due Soon</h3>
                    <div className="space-y-2">
                      {pendingOrOverdueAssignments.length > 0 ? (
                        pendingOrOverdueAssignments.map((assignment: any) => (
                            <Link
                              key={assignment.id}
                              href={assignment.chapterSlug ? `/chapters/${assignment.chapterSlug}` : (assignment.link || '/dashboard')}
                              className="block rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 transition hover:border-orange-500/50 hover:bg-orange-500/20"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <span className="font-medium text-zinc-100">{assignment.title}</span>
                                  {assignment.dueDate && (
                                    <span className="ml-2 text-sm text-orange-300">
                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {assignment.status === 'overdue' && (
                                  <span className="text-xs text-red-400">Overdue</span>
                                )}
                              </div>
                            </Link>
                          ))
                      ) : (
                        <p className="text-sm text-zinc-500">No assignments due soon</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-green-300">Completed</h3>
                    <div className="space-y-2">
                      {completedAssignments.length > 0 ? (
                        completedAssignments.map((assignment: any) => (
                            <div
                              key={assignment.id}
                              id={`completed-feedback-${assignment.id}`}
                              className={`rounded-lg border border-green-500/30 bg-green-500/10 p-4 transition ${
                                highlightedFeedbackAssignmentId === String(assignment.id)
                                  ? 'ring-2 ring-orange-400/70 shadow-[0_0_18px_rgba(249,115,22,0.3)]'
                                  : 'hover:border-green-500/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400">✔</span>
                                  <Link
                                    href={assignment.chapterSlug ? `/chapters/${assignment.chapterSlug}` : (assignment.link || '/dashboard')}
                                    className="font-medium text-zinc-100 hover:text-cyan-200"
                                  >
                                    {assignment.title}
                                  </Link>
                                </div>
                                {assignment.submission?.pointsEarned > 0 && (
                                  <span className="text-sm text-green-300">
                                    +{assignment.submission.pointsEarned} pts
                                  </span>
                                )}
                              </div>
                              {assignment.submission?.feedback && (
                                <div className="mt-3 rounded-md border border-blue-400/30 bg-blue-500/10 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Admin Feedback</p>
                                  <p className="mt-1 text-sm text-zinc-200">{assignment.submission.feedback}</p>
                                </div>
                              )}
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-zinc-500">No completed assignments yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rate Your Experience / Testimonial */}
            <TestimonialSection />

          </div>
        )}

        {activeTab === 'certification' && (
          <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Certification Progress</h2>
            <div className="space-y-6">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-6">
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Certification Progress</span>
                    <span className="font-semibold text-orange-400">{certificationProgress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${certificationProgress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-zinc-100 mb-3">Certification Requirements:</h3>
                  <ul className="space-y-3 text-sm">
                    {/* Complete all 20 chapters */}
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${hasCompletedAllChapters ? 'text-green-400' : 'text-red-400'}`}>
                          {hasCompletedAllChapters ? '✓' : '✗'}
                        </span>
                        <span className={hasCompletedAllChapters ? 'text-green-300' : 'text-zinc-400'}>
                          Complete all {totalChapters} chapters
                        </span>
                      </div>
                      <span className="text-zinc-500">
                        {chaptersCompleted}/{totalChapters}
                      </span>
                    </li>
                    
                    {/* Complete all 4 assignments */}
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${hasCompletedAllAssignments ? 'text-green-400' : 'text-red-400'}`}>
                          {hasCompletedAllAssignments ? '✓' : '✗'}
                        </span>
                        <span className={hasCompletedAllAssignments ? 'text-green-300' : 'text-zinc-400'}>
                          Complete all 4 assignments
                        </span>
                      </div>
                      <span className="text-zinc-500">
                        {assignmentsCompleted}/{totalAssignments}
                      </span>
                    </li>
                    
                    {/* Attend at least 80% of live sessions */}
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${hasMetAttendance ? 'text-green-400' : 'text-red-400'}`}>
                          {hasMetAttendance ? '✓' : '✗'}
                        </span>
                        <span className={hasMetAttendance ? 'text-green-300' : 'text-zinc-400'}>
                          Attend at least 80% of live sessions
                        </span>
                      </div>
                      <span className="text-zinc-500">
                        {attendance}%
                      </span>
                    </li>
                    
                    {/* Earn at least 500 sats */}
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${hasEarnedEnoughSats ? 'text-green-400' : 'text-red-400'}`}>
                          {hasEarnedEnoughSats ? '✓' : '✗'}
                        </span>
                        <span className={hasEarnedEnoughSats ? 'text-green-300' : 'text-zinc-400'}>
                          Earn at least 500 sats
                        </span>
                      </div>
                      <span className="text-zinc-500">
                        {satsEarned} sats
                      </span>
                    </li>
                    
                    {/* Pass final assessment */}
                    <li className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${hasPassedFinalAssessment ? 'text-green-400' : 'text-red-400'}`}>
                          {hasPassedFinalAssessment ? '✓' : '✗'}
                        </span>
                        <span className={hasPassedFinalAssessment ? 'text-green-300' : 'text-zinc-400'}>
                          Pass final exam (70% required)
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                        {loadingExam ? (
                          <span className="text-xs text-zinc-500">Loading exam…</span>
                        ) : examResult ? (
                          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                            <span className={hasPassedFinalAssessment ? 'text-green-300 font-semibold' : 'text-red-400'}>
                              {examResult.score}/{examResult.totalQuestions} ({examResult.percentage}%)
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                hasPassedFinalAssessment
                                  ? 'border-green-500/40 bg-green-500/10 text-green-300'
                                  : 'border-red-500/40 bg-red-500/10 text-red-300'
                              }`}
                            >
                              {hasPassedFinalAssessment ? 'Passed' : 'Not Passed'}
                            </span>
                          </div>
                        ) : canTakeExam ? (
                          <Link
                            href="/exam"
                            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            Take Exam →
                          </Link>
                        ) : (
                          <span className="text-zinc-500 text-sm">
                            {hasMetPreExamCriteria
                              ? 'Reach Chapter 21 first'
                              : 'Complete all certification requirements first'}
                          </span>
                        )}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  disabled={certificationProgress < 100}
                  className={`rounded-lg px-6 py-3 font-semibold transition cursor-pointer ${
                    certificationProgress >= 100
                      ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-black hover:brightness-110'
                      : 'border border-zinc-700 bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {certificationProgress >= 100
                    ? 'Ask for Certificate'
                    : `Ask for Certificate (${certificationProgress}% Complete)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Leaderboard</h2>
            {loading && (
              <div className="mb-3 text-sm text-zinc-400">Loading leaderboard...</div>
            )}
            {!loading && leaderboard.length === 0 && (
              <div className="mb-3 text-sm text-zinc-400">No leaderboard data yet.</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sats</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Awards</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student: any) => (
                    <tr
                      key={student.rank || student.name}
                      className={`border-b border-zinc-800 ${
                        student.name?.toLowerCase?.() === 'sarah' ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-lg font-bold ${
                            student.rank === 1
                              ? 'text-yellow-400'
                              : student.rank === 2
                              ? 'text-zinc-300'
                              : student.rank === 3
                              ? 'text-orange-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          #{student.rank ?? '?'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">{student.name}</td>
                      <td className="px-4 py-3 text-orange-300">{student.sats ?? student.points ?? 0} sats</td>
                      <td className="px-4 py-3 text-cyan-300">{student.awards ?? student.assignments ?? 0}</td>
                      <td className="px-4 py-3 text-purple-300">{student.attendance ?? '--'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// Profile modal (fetch by email, read-only)
function ProfileModal({
  open,
  onClose,
  loading,
  error,
  profile,
  isRegistered,
  profileImage,
  onImageChange,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  profile: any | null;
  isRegistered: boolean;
  profileImage: string | null;
  onImageChange: (img: string | null) => void;
  onUpdate: (data: any) => Promise<void>;
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', country: '', city: '' });
  const [originalData, setOriginalData] = useState({ name: '', email: '', phone: '', country: '', city: '' });
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile) {
      const initialData = {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        city: profile.city || '',
      };
      setEditFormData(initialData);
      setOriginalData(initialData);
    }
  }, [profile]);

  useEffect(() => {
    // Store original image when modal opens (even if null)
    if (open) {
      setOriginalProfileImage(profileImage);
    }
  }, [open]);

  const hasFormChanges = isEditingProfile && (
    editFormData.name !== originalData.name ||
    editFormData.email !== originalData.email ||
    editFormData.phone !== originalData.phone ||
    editFormData.country !== originalData.country ||
    editFormData.city !== originalData.city
  );
  
  const hasImageChanges = profileImage !== originalProfileImage;
  
  const hasChanges = hasFormChanges || hasImageChanges;

  if (!open) return null;
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-50">Profile</h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            ×
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border-2 border-cyan-500/50"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-orange-500 text-base font-bold text-black">
                  {initials}
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-xs text-black hover:bg-cyan-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && profile?.email) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const result = event.target?.result as string;
                        onImageChange(result);
                        // Upload to Supabase Storage
                        try {
                          const res = await fetch('/api/profile/upload-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              email: profile.email,
                              imageData: result 
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            onImageChange(data.photoUrl);
                          }
                        } catch (err) {
                          console.error('Error uploading image:', err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">{profile?.name || 'Profile'}</div>
              <div className="text-xs text-zinc-400">{profile?.email || ''}</div>
            </div>
          </div>
          {loading && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center text-sm text-cyan-200">
              Loading profile...
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {error}
            </div>
          )}
          {profile && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold text-zinc-50">Profile Information</div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {isEditingProfile ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={editFormData.name || profile.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || profile.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Country</label>
                    <input
                      type="text"
                      value={editFormData.country || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                  {hasChanges && (
                    <button
                      onClick={async () => {
                        await onUpdate(editFormData);
                        setOriginalData(editFormData);
                        setOriginalProfileImage(profileImage);
                        setIsEditingProfile(false);
                      }}
                      className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div><span className="text-zinc-400">Name:</span> {profile.name || '—'}</div>
                  <div><span className="text-zinc-400">Email:</span> {profile.email || '—'}</div>
                  <div><span className="text-zinc-400">Status:</span> {profile.status || '—'}</div>
                  {!isRegistered && (
                    <div className="mt-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-xs text-orange-200">
                      You're not enrolled as a student yet. Apply to join a cohort!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Certificate Image Upload Section - Only show if student is registered */}
          {isRegistered && profile && (
            <Suspense fallback={null}>
              <CertificateImageSection profile={profile} />
            </Suspense>
          )}
          
          {!profile && !loading && !error && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-200">
              No profile data available.
            </div>
          )}
          {hasChanges && !isEditingProfile && (
            <button
              onClick={async () => {
                await onUpdate(editFormData);
                setOriginalData(editFormData);
                setOriginalProfileImage(profileImage);
              }}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Save Changes
            </button>
          )}
          <div className="flex flex-col gap-2">
            <button
              className="w-full rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-500/70 hover:bg-cyan-500/20"
              onClick={() => alert('Password change not implemented yet.')}
            >
              Change Password
            </button>
            {!isRegistered && (
              <Link
                href="/apply"
                className="w-full text-center rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:border-orange-500/70 hover:bg-orange-500/20"
              >
                Apply Now
              </Link>
            )}
          </div>
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-xs text-orange-200">
            To change password, please contact support or use your auth provider. Passwords are managed through Supabase Auth.
          </div>
        </div>
      </div>
    </div>
  );
}

