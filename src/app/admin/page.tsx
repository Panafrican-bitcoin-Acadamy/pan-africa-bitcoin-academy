'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/hooks/useSession';
import EmailComposer from '@/components/EmailComposer';

// Lazy load heavy admin components
const SessionExpiredModal = dynamic(() => import('@/components/SessionExpiredModal').then(mod => ({ default: mod.SessionExpiredModal })), {
  ssr: false,
  loading: () => null,
});

const Calendar = dynamic(() => import('@/components/Calendar').then(mod => ({ default: mod.Calendar })), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50">
      <div className="text-zinc-400">Loading calendar...</div>
    </div>
  ),
});

interface Application {
  id: string; // This ID is used as student identifier across all databases
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  experience_level: string | null;
  preferred_cohort_id: string | null;
  preferred_language: string | null;
  status: string;
  created_at: string;
  birth_date: string | null;
}

interface Cohort {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  level?: string | null;
  seats?: number | null;
  enrolled?: number | null;
}

interface EventItem {
  id: string;
  name: string;
  type: string;
  start_time: string;
  end_time: string | null;
  cohort_id: string | null;
}

interface OverviewSummary {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalStudents: number;
  totalCohorts: number;
  upcomingEventsCount: number;
}

interface ProgressItem {
  id: string;
  name: string;
  email: string;
  status: string;
  cohortId: string | null;
  cohortName: string | null;
  studentId: string | null;
  completedChapters: number;
  unlockedChapters: number;
  totalChapters?: number;
  lecturesAttended?: number;
  totalLiveLectures?: number;
  attendancePercent?: number;
  overallProgress?: number;
}

interface AdminSession {
  email: string;
  role: string | null;
}

interface MentorshipApp {
  id: string;
  name: string;
  email: string;
  country: string | null;
  whatsapp: string | null;
  role: string | null;
  status: string;
  created_at: string;
}

const statusClasses: Record<string, string> = {
  approved: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  default: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
};

export default function AdminDashboardPage() {
  const { isAuthenticated, email, role, loading: authLoading, showSessionExpired, setShowSessionExpired, logout, checkSession } = useSession('admin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  const admin: AdminSession | null = isAuthenticated && email ? { email, role: role || null } : null;

  const [applications, setApplications] = useState<Application[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [mentorships, setMentorships] = useState<MentorshipApp[]>([]);
  const [liveClassEvents, setLiveClassEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [cohortFilter, setCohortFilter] = useState<string | null>(null); // Filter by cohort
  const [attendanceSort, setAttendanceSort] = useState<'asc' | 'desc' | null>(null); // Sort by attendance
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);
  const [regeneratingSessions, setRegeneratingSessions] = useState<string | null>(null);
  const [selectedEventForUpload, setSelectedEventForUpload] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'students' | 'events' | 'mentorships' | 'attendance' | 'exam'>('overview');
  const [examAccessList, setExamAccessList] = useState<any[]>([]);
  const [loadingExamAccess, setLoadingExamAccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [eventForm, setEventForm] = useState({
    name: '',
    type: 'live-class',
    start_time: '',
    end_time: '',
    description: '',
    link: '',
    cohort_id: 'for_all',
    chapter_number: '',
  });

  const [cohortForm, setCohortForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    seats_total: '',
    level: 'Beginner',
    status: 'Upcoming',
    sessions: '',
  });

  // Load data once when authenticated (no auto-refresh)
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && admin && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [isAuthenticated, admin]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchWithAuth = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    if (res.status === 401) {
      // Session expired - trigger session check to properly handle logout
      await checkSession();
      throw new Error('Unauthorized');
    }
    return res;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Promise.allSettled to prevent one failure from blocking others
      // No error messages - if data doesn't load, user can refresh manually
      await Promise.allSettled([
        fetchApplications(),
        fetchCohorts(),
        fetchOverview(),
        fetchEvents(),
        fetchProgress(),
        fetchLiveClassEvents(),
        fetchMentorships(),
        fetchExamAccess(),
      ]);
    } catch (err: any) {
      // Silently fail - user can refresh page if needed
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const res = await fetchWithAuth('/api/admin/overview');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load overview');
    setOverview(data.summary);
  };

  const fetchApplications = async () => {
    const res = await fetchWithAuth('/api/admin/applications');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch applications');
    setApplications(data.applications || []);
  };

  const fetchCohorts = async () => {
    try {
    const res = await fetchWithAuth('/api/cohorts');
    const data = await res.json();
    if (data.cohorts) setCohorts(data.cohorts);
      // Don't throw if cohorts missing - it's not critical
    } catch (err) {
      // Silently fail for cohorts - not critical
      setCohorts([]);
    }
  };

  const fetchEvents = async () => {
    try {
    const res = await fetchWithAuth('/api/events');
    const data = await res.json();
    if (data.events) setEvents(data.events);
      // Don't throw if events missing - it's not critical
    } catch (err) {
      // Silently fail for events - not critical
      setEvents([]);
    }
  };

  const fetchProgress = async () => {
    const res = await fetchWithAuth('/api/admin/students/progress');
    const data = await res.json();
    if (data.progress) setProgress(data.progress);
  };

  const fetchMentorships = async () => {
    const res = await fetchWithAuth('/api/admin/mentorships');
    const data = await res.json();
    if (data.applications) setMentorships(data.applications);
  };

  const fetchExamAccess = async () => {
    try {
      setLoadingExamAccess(true);
      const res = await fetchWithAuth('/api/admin/exam/access-list');
      const data = await res.json();
      if (data.students) setExamAccessList(data.students);
    } catch (err) {
      console.error('Error fetching exam access:', err);
    } finally {
      setLoadingExamAccess(false);
    }
  };

  const grantExamAccess = async (studentId: string) => {
    try {
      const res = await fetchWithAuth('/api/admin/exam/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, adminId: admin?.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant access');
      alert(data.message || 'Exam access granted');
      await fetchExamAccess();
    } catch (err: any) {
      alert(err.message || 'Failed to grant exam access');
    }
  };

  const revokeExamAccess = async (studentId: string) => {
    if (!confirm('Are you sure you want to revoke exam access?')) return;
    try {
      const res = await fetchWithAuth('/api/admin/exam/revoke-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke access');
      alert(data.message || 'Exam access revoked');
      await fetchExamAccess();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke exam access');
    }
  };

  const fetchLiveClassEvents = async () => {
    const res = await fetchWithAuth('/api/admin/events/live-classes');
    const data = await res.json();
    if (data.events) setLiveClassEvents(data.events);
  };

  const handleAttendanceUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file || !selectedEventForUpload) {
      setError('Please select an event and CSV file');
      return;
    }

    setUploadingAttendance(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', selectedEventForUpload);

      const res = await fetchWithAuth('/api/admin/attendance/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload attendance');
      }

      alert(`Success! Processed ${data.processed} records, matched ${data.matched} students.${data.totalErrors > 0 ? ` ${data.totalErrors} errors.` : ''}`);
      form.reset();
      setSelectedEventForUpload('');
      fetchProgress(); // Refresh progress data
    } catch (err: any) {
      setError(err.message || 'Failed to upload attendance');
    } finally {
      setUploadingAttendance(false);
    }
  };

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Login failed';
        const errorDetails = data.details ? `: ${data.details}` : '';
        setAuthError(`${errorMsg}${errorDetails}`);
        console.error('Admin login error:', data);
        return;
      }
      setLoginForm({ email: '', password: '' }); // Clear form
      // Session is managed by useSession hook - check session to mark activity
      // Wait a bit for cookie to be set, then check session
      setTimeout(() => {
        checkSession();
      }, 100);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setApplications([]);
    setOverview(null);
    setEvents([]);
    setCohorts([]);
    setProgress([]);
    setMentorships([]);
  };

  const handleApprove = async (applicationId: string, email: string) => {
    // Defer confirm to next tick to prevent blocking click handler
    if (!confirm(`Approve application for ${email}?`)) return;
    
    // Set processing state immediately for responsive UI
    setProcessing(applicationId);
    
    try {
      const res = await fetchWithAuth('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        let message = `Application for ${email} approved successfully!`;
        if (data.emailSent) {
          message += `\n\n✅ Approval email sent to ${email}`;
        } else {
          // Always show email status, even if not sent
          if (data.emailError) {
            message += `\n\n⚠️ Email not sent: ${data.emailError}`;
            message += `\n\nCheck server console for details.`;
          } else {
            message += `\n\n⚠️ Email status unknown - check server console for details.`;
          }
        }
        
        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setNotification({ type: 'success', message: `Application for ${email} approved successfully!` });
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Approval response:', data);
        }
        
        // Fetch data in parallel for better performance
        Promise.all([
          fetchApplications(),
          fetchOverview()
        ]).catch(err => console.error('Error refreshing data:', err));
        
        // Show alert after a short delay to not block UI
        setTimeout(() => alert(message), 50);
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to approve application';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        const hint = data.hint ? `\n\nHint: ${data.hint}` : '';
        const code = data.code ? `\n\nError Code: ${data.code}` : '';
        
        startTransition(() => {
          setNotification({ type: 'error', message: errorMsg });
        });
        
        setTimeout(() => alert(`Error: ${errorMsg}${details}${hint}${code}`), 50);
        console.error('Approval error:', data);
      }
    } catch (err: any) {
      startTransition(() => {
        setNotification({ type: 'error', message: err.message || 'Failed to approve application' });
      });
      setTimeout(() => alert(err.message || 'Failed to approve application'), 50);
    } finally {
      // Clear processing state immediately
      setProcessing(null);
    }
  };

  const handleReject = async (applicationId: string, email: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    setProcessing(applicationId);
    try {
      const res = await fetchWithAuth('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, rejectedReason: reason || null }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let message = `Application for ${email} rejected successfully!`;
        if (data.emailSent) {
          message += `\n\n✅ Rejection email sent to ${email}`;
        } else if (data.emailError) {
          message += `\n\n⚠️ Email not sent: ${data.emailError}`;
        }
        alert(message);
        await fetchApplications();
        await fetchOverview();
      } else {
        alert(`Error: ${data.error || 'Failed to reject application'}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setProcessing(null);
    }
  };


  const filteredApplications = useMemo(
    () => {
      const filtered = applications.filter((app) => {
        // Filter by status
        const statusMatch = filter === 'all' || app.status?.toLowerCase() === filter;
        // Filter by cohort
        const cohortMatch = !cohortFilter || app.preferred_cohort_id === cohortFilter;
        return statusMatch && cohortMatch;
      });
      
      // Sort pending applications by created_at (oldest first - first registered to last)
      if (filter === 'pending' || filter === 'all') {
        return [...filtered].sort((a, b) => {
          // For pending applications, sort by created_at ascending (oldest first)
          if (a.status?.toLowerCase() === 'pending' && b.status?.toLowerCase() === 'pending') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          // Keep pending applications first, then others
          if (a.status?.toLowerCase() === 'pending') return -1;
          if (b.status?.toLowerCase() === 'pending') return 1;
          // For non-pending, sort by created_at descending (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }
      
      // For other filters (approved/rejected), sort by created_at descending (newest first)
      return [...filtered].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    [applications, filter, cohortFilter],
  );

  // Filter and sort student progress data
  const filteredAndSortedProgress = useMemo(() => {
    if (!progress || progress.length === 0) return [];
    
    let filtered = [...progress];
    
    // Filter by cohort
    if (cohortFilter) {
      filtered = filtered.filter(p => p.cohortId === cohortFilter);
    }
    
    // Sort by attendance
    if (attendanceSort) {
      filtered.sort((a, b) => {
        const aPercent = a.attendancePercent ?? 0;
        const bPercent = b.attendancePercent ?? 0;
        return attendanceSort === 'desc' 
          ? bPercent - aPercent // High to low
          : aPercent - bPercent; // Low to high
      });
    }
    
    return filtered;
  }, [progress, cohortFilter, attendanceSort]);

  const createEvent = async () => {
    setCreatingEvent(true);
    try {
      const res = await fetchWithAuth('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventForm,
          cohort_id: eventForm.cohort_id === 'for_all' ? null : eventForm.cohort_id,
          for_all: eventForm.cohort_id === 'for_all',
          chapter_number: eventForm.type === 'live-class' && eventForm.chapter_number ? parseInt(eventForm.chapter_number) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      alert('Event created successfully!');
      await fetchEvents();
      await fetchOverview();
      setEventForm({
        name: '',
        type: 'live-class',
        start_time: '',
        end_time: '',
        description: '',
        link: '',
        cohort_id: 'for_all',
        chapter_number: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const createCohort = async () => {
    setCreatingCohort(true);
    try {
      const res = await fetchWithAuth('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cohortForm,
          seats_total: cohortForm.seats_total ? Number(cohortForm.seats_total) : null,
          sessions: cohortForm.sessions ? Number(cohortForm.sessions) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create cohort');
      alert('Cohort created successfully! Sessions have been auto-generated.');
      await fetchCohorts();
      await fetchOverview();
      setCohortForm({
        name: '',
        start_date: '',
        end_date: '',
        seats_total: '',
        level: 'Beginner',
        status: 'Upcoming',
        sessions: '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create cohort');
    } finally {
      setCreatingCohort(false);
    }
  };

  const regenerateSessions = async (cohortId: string) => {
    if (!confirm('This will delete all existing sessions for this cohort and regenerate them based on the current start/end dates. Continue?')) {
      return;
    }
    setRegeneratingSessions(cohortId);
    try {
      const res = await fetchWithAuth('/api/cohorts/generate-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate sessions');
      alert(`Sessions regenerated successfully! ${data.sessionsGenerated || 0} sessions created.`);
      await fetchCohorts();
      await fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate sessions');
    } finally {
      setRegeneratingSessions(null);
    }
  };


  const updateMentorshipStatus = async (id: string, status: string) => {
    try {
      const res = await fetchWithAuth('/api/admin/mentorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      alert(`Mentorship application ${status.toLowerCase()} successfully!`);
      await fetchMentorships();
    } catch (err: any) {
      alert(err.message || 'Failed to update mentorship status');
    }
  };

  const getStatusClass = (status: string) =>
    statusClasses[status?.toLowerCase()] || statusClasses.default;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black p-8 text-center text-zinc-400">
        Checking admin session...
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-black p-6 sm:p-8">
        <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Admin Login</h1>
            <p className="text-sm text-zinc-400">Access is restricted to admin users.</p>
          </div>
          {authError && (
            <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {authError}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin} autoComplete="on">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-black p-8 text-center text-zinc-400">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500">Signed in as {admin.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overview && [
            { label: 'Applications', value: overview.totalApplications, accent: 'cyan' },
            { label: 'Pending', value: overview.pendingApplications, accent: 'yellow' },
            { label: 'Students', value: overview.totalStudents, accent: 'green' },
            { label: 'Cohorts', value: overview.totalCohorts, accent: 'blue' },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow"
            >
              <p className="text-sm text-zinc-400">{card.label}</p>
              <p className="text-2xl font-semibold text-zinc-50">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      filter === f
                        ? 'bg-cyan-400 text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} (
                    {applications.filter((a) => {
                      const statusMatch = f === 'all' || a.status.toLowerCase() === f;
                      const cohortMatch = !cohortFilter || a.preferred_cohort_id === cohortFilter;
                      return statusMatch && cohortMatch;
                    }).length})
                  </button>
                ))}
              </div>
              <select
                value={cohortFilter || ''}
                onChange={(e) => setCohortFilter(e.target.value || null)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">All Cohorts</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
            </div>


            {filteredApplications.length === 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
                No {filter !== 'all' ? filter : ''} applications found{cohortFilter ? ` for selected cohort` : ''}.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-zinc-50 truncate">
                        {app.first_name} {app.last_name}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">{app.email}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusClass(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs mb-2">
                    {app.preferred_cohort_id && (
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">Cohort:</span>
                        <span className="text-zinc-200 truncate">
                          {cohorts.find((c) => c.id === app.preferred_cohort_id)?.name || 'N/A'}
                        </span>
                      </div>
                    )}
                    {app.country && (
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">Country:</span>
                        <span className="text-zinc-200">{app.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">Applied:</span>
                      <span className="text-zinc-200">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {app.status.toLowerCase() === 'pending' && (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleApprove(app.id, app.email)}
                        disabled={processing === app.id}
                        className="flex-1 rounded bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
                      >
                        {processing === app.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(app.id, app.email)}
                        disabled={processing === app.id}
                        className="flex-1 rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        {/* Create Cohort and Create Event - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-lg font-semibold text-zinc-50">Create Cohort</h3>
              <div className="mt-3 space-y-3">
                <input
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Cohort name"
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={cohortForm.start_date}
                  onChange={(e) => setCohortForm({ ...cohortForm, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={cohortForm.end_date}
                  onChange={(e) => setCohortForm({ ...cohortForm, end_date: e.target.value })}
                />
                <input
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Seats"
                  value={cohortForm.seats_total}
                  onChange={(e) => setCohortForm({ ...cohortForm, seats_total: e.target.value })}
                />
                <div className="text-xs text-zinc-400">
                  Sessions are automatically generated (3 per week, excluding Sundays) when you provide start and end dates.
                </div>
                <select
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={cohortForm.level}
                  onChange={(e) => setCohortForm({ ...cohortForm, level: e.target.value })}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <select
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={cohortForm.status}
                  onChange={(e) => setCohortForm({ ...cohortForm, status: e.target.value })}
                >
                  <option>Upcoming</option>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
                <button
                  onClick={createCohort}
                  disabled={creatingCohort || !cohortForm.name}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {creatingCohort ? 'Saving...' : 'Create Cohort'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-lg font-semibold text-zinc-50">Create Event</h3>
              <div className="mt-3 space-y-3">
                <input
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Event name"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                />
                <select
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                >
                  <option value="live-class">Live Class</option>
                  <option value="assignment">Assignment</option>
                  <option value="community">Community</option>
                  <option value="workshop">Workshop</option>
                  <option value="deadline">Deadline</option>
                  <option value="quiz">Quiz</option>
                  <option value="cohort">Cohort</option>
                </select>
                {eventForm.type === 'live-class' && (
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                    placeholder="Chapter number (1-20, optional)"
                    value={eventForm.chapter_number}
                    onChange={(e) => setEventForm({ ...eventForm, chapter_number: e.target.value })}
                  />
                )}
                <input
                  type="datetime-local"
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
                <input
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Link (optional)"
                  value={eventForm.link}
                  onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
                />
                <textarea
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
                <select
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  value={eventForm.cohort_id}
                  onChange={(e) => setEventForm({ ...eventForm, cohort_id: e.target.value })}
                >
                  <option value="for_all">For everyone</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={createEvent}
                  disabled={creatingEvent || !eventForm.name || !eventForm.start_time}
                  className="w-full rounded-lg bg-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {creatingEvent ? 'Saving...' : 'Create Event'}
                </button>
            </div>
          </div>
        </div>

        {/* Email Composition and Calendar - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Email Composition Interface */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <h2 className="text-lg font-semibold text-zinc-50 mb-2">Email Composition</h2>
            <p className="text-xs text-zinc-400 mb-3">
              Send professional emails to students, applicants, or other recipients.
            </p>
            <div className="rounded-lg">
              <EmailComposer />
            </div>
          </div>

          {/* Calendar - Events, Cohorts & Activities */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <h2 className="text-lg font-semibold text-zinc-50 mb-2">Calendar</h2>
            <div className="rounded-lg">
              <Calendar cohortId={null} showCohorts={true} />
            </div>
          </div>
        </div>

        {/* Mentorship applications */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-50">Mentorship Applications</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">Applied</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {mentorships.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-800">
                    <td className="px-3 py-2 text-zinc-50">{m.name}</td>
                    <td className="px-3 py-2 text-zinc-400">{m.email}</td>
                    <td className="px-3 py-2 text-zinc-400">{m.role || '—'}</td>
                    <td className="px-3 py-2 text-zinc-400">{m.country || '—'}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full border px-2 py-1 text-xs ${getStatusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => updateMentorshipStatus(m.id, 'Approved')}
                        className="rounded border border-green-500/40 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateMentorshipStatus(m.id, 'Rejected')}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mentorships.length === 0 && (
              <p className="p-3 text-sm text-zinc-400">No mentorship applications yet.</p>
            )}
          </div>
        </div>

        {/* Attendance Upload */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-50">Upload Attendance (Google Meet CSV)</h3>
          <form onSubmit={handleAttendanceUpload} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Select Event</label>
                <select
                  value={selectedEventForUpload}
                  onChange={(e) => setSelectedEventForUpload(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
                  required
                >
                  <option value="">Choose event...</option>
                  {liveClassEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.start_time ? `(${new Date(e.start_time).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-300">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 file:mr-4 file:rounded file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:text-zinc-50"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={uploadingAttendance}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadingAttendance ? 'Uploading...' : 'Upload Attendance'}
            </button>
            <p className="text-xs text-zinc-400">
              CSV should include: Email, Name, Join Time, Leave Time, Duration (minutes)
            </p>
          </form>
        </div>

        {/* Student Database */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-50">Student Database</h3>
              {(cohortFilter || attendanceSort) && (
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                  {cohortFilter && (
                    <span>
                      Filtered: <span className="text-cyan-400">
                        {progress?.find(p => p.cohortId === cohortFilter)?.cohortName || 
                         cohorts?.find(c => c.id === cohortFilter)?.name || 
                         'Cohort'}
                      </span>
                    </span>
                  )}
                  {attendanceSort && (
                    <span>
                      Sorted by Attendance: <span className="text-cyan-400">{attendanceSort === 'desc' ? 'High to Low' : 'Low to High'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {(cohortFilter || attendanceSort) && (
              <div className="flex items-center gap-2">
                {cohortFilter && (
                  <button
                    onClick={() => setCohortFilter(null)}
                    className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    Clear Filter
                  </button>
                )}
                {attendanceSort && (
                  <button
                    onClick={() => setAttendanceSort(null)}
                    className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    Clear Sort
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th 
                    className="px-3 py-2 cursor-pointer hover:bg-zinc-800 transition select-none"
                    title="Click to filter by cohort"
                    onClick={() => {
                      // Get unique cohorts from progress (by ID)
                      if (!progress || progress.length === 0) return;
                      const uniqueCohorts = Array.from(new Set(progress.map(p => p.cohortId).filter(Boolean))) as string[];
                      if (uniqueCohorts.length === 0) return;
                      
                      // Cycle through: null -> first cohort -> second cohort -> ... -> null
                      if (!cohortFilter) {
                        setCohortFilter(uniqueCohorts[0]);
                      } else {
                        const currentIndex = uniqueCohorts.indexOf(cohortFilter);
                        if (currentIndex < uniqueCohorts.length - 1) {
                          setCohortFilter(uniqueCohorts[currentIndex + 1]);
                        } else {
                          setCohortFilter(null);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Cohort
                      {cohortFilter && (
                        <span 
                          className="text-cyan-400 text-xs" 
                          title={`Filtered: ${progress?.find(p => p.cohortId === cohortFilter)?.cohortName || cohorts?.find(c => c.id === cohortFilter)?.name || cohortFilter}`}
                        >
                          ●
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2">Chapters</th>
                  <th 
                    className="px-3 py-2 cursor-pointer hover:bg-zinc-800 transition select-none"
                    title="Click to sort by attendance"
                    onClick={() => {
                      // Cycle through: null -> desc (high to low) -> asc (low to high) -> null
                      if (!attendanceSort) {
                        setAttendanceSort('desc'); // High to low
                      } else if (attendanceSort === 'desc') {
                        setAttendanceSort('asc'); // Low to high
                      } else {
                        setAttendanceSort(null); // No sort
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Attendance
                      {attendanceSort && (
                        <span className="text-cyan-400 text-xs" title={attendanceSort === 'desc' ? 'High to Low' : 'Low to High'}>
                          {attendanceSort === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProgress.map((p) => (
                  <tr 
                    key={p.id} 
                    className={`border-b border-zinc-800 ${cohortFilter && p.cohortId === cohortFilter ? 'bg-zinc-800/30' : ''}`}
                  >
                    <td className="px-3 py-2 text-zinc-50">{p.name}</td>
                    <td className="px-3 py-2 text-zinc-400">{p.email}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      {p.cohortName || p.cohortId || '—'}
                      {cohortFilter && p.cohortId === cohortFilter && (
                        <span className="ml-2 text-cyan-400 text-xs">●</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-green-300">{p.completedChapters}</span>
                      <span className="text-zinc-500">/{p.totalChapters || 20}</span>
                    </td>
                    <td className="px-3 py-2">
                      {p.lecturesAttended !== undefined && p.totalLiveLectures !== undefined ? (
                        <span>
                          <span className="text-blue-300">{p.lecturesAttended}</span>
                          <span className="text-zinc-500">/{p.totalLiveLectures}</span>
                          <span className="ml-2 text-xs text-zinc-400">({p.attendancePercent}%)</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.overallProgress !== undefined ? (
                        <span className="font-medium text-yellow-300">{p.overallProgress}%</span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {progress.length === 0 && (
              <p className="p-3 text-sm text-zinc-400">No progress data yet.</p>
            )}
            {progress.length > 0 && filteredAndSortedProgress.length === 0 && (
              <p className="p-3 text-sm text-zinc-400">No students found for the selected cohort filter.</p>
            )}
          </div>
        </div>

        {/* Exam Management Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-zinc-50 mb-4">Final Exam Management</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Grant or revoke exam access for students who have completed Chapter 21.
          </p>

          {loadingExamAccess ? (
            <div className="text-center py-8 text-zinc-400">Loading exam access list...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-900 text-left text-zinc-300">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Cohort</th>
                    <th className="px-3 py-2">Chapter 21</th>
                    <th className="px-3 py-2">Access</th>
                    <th className="px-3 py-2">Exam Score</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examAccessList
                    .filter((student) => student.chapter21Completed)
                    .map((student) => (
                      <tr key={student.id} className="border-b border-zinc-800">
                        <td className="px-3 py-2 text-zinc-50">{student.name || '—'}</td>
                        <td className="px-3 py-2 text-zinc-400">{student.email}</td>
                        <td className="px-3 py-2 text-zinc-400">
                          {student.cohortName || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-green-500">✓ Completed</span>
                        </td>
                        <td className="px-3 py-2">
                          {student.hasExamAccess ? (
                            <span className="text-green-500">✓ Granted</span>
                          ) : (
                            <span className="text-zinc-500">Not granted</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {student.examCompleted ? (
                            <span className="font-semibold text-orange-500">
                              {student.examScore}/50
                            </span>
                          ) : (
                            <span className="text-zinc-500">Not taken</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {student.examCompleted ? (
                            <span className="text-zinc-500 text-xs">Completed</span>
                          ) : student.hasExamAccess ? (
                            <button
                              onClick={() => revokeExamAccess(student.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => grantExamAccess(student.id)}
                              className="text-green-400 hover:text-green-300 text-xs"
                            >
                              Grant Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {examAccessList.filter((s) => s.chapter21Completed).length === 0 && (
                <p className="p-3 text-sm text-zinc-400 text-center">
                  No students have completed Chapter 21 yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session Expired Modal - only show when session expired and admin is logged out */}
      {showSessionExpired && !admin && (
      <SessionExpiredModal
          isOpen={showSessionExpired && !admin}
          onClose={async () => {
            // Logout and show login form
            await handleLogout();
          setShowSessionExpired(false);
        }}
        userType="admin"
      />
      )}
    </div>
  );
}

