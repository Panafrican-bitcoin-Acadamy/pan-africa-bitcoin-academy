'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';
import { Calendar } from '@/components/Calendar';
import { useSession } from '@/hooks/useSession';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  experience_level: string | null;
  preferred_cohort_id: string | null;
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
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);
  const [selectedEventForUpload, setSelectedEventForUpload] = useState<string>('');

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
    if (!confirm(`Approve application for ${email}?`)) return;
    setProcessing(applicationId);
    try {
      const res = await fetchWithAuth('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Application for ${email} approved successfully!`);
        await fetchApplications();
        await fetchOverview();
      } else {
        alert(`Error: ${data.error || 'Failed to approve application'}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve application');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setProcessing(applicationId);
    try {
      const res = await fetchWithAuth('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, rejectedReason: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Application rejected successfully!');
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
    () =>
      applications.filter((app) => {
        if (filter === 'all') return true;
        return app.status?.toLowerCase() === filter;
      }),
    [applications, filter],
  );

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
      alert('Cohort created successfully!');
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
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Email</label>
              <input
                type="email"
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
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? 'bg-cyan-400 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} (
                {applications.filter((a) => (f === 'all' ? true : a.status.toLowerCase() === f)).length})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredApplications.length === 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
                No {filter !== 'all' ? filter : ''} applications found.
              </div>
            )}
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50">
                      {app.first_name} {app.last_name}
                    </h3>
                    <p className="text-sm text-zinc-400">{app.email}</p>
                    {app.phone && <p className="text-sm text-zinc-500">{app.phone}</p>}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(app.status)}`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {app.country && (
                    <div>
                      <span className="text-zinc-500">Country:</span>{' '}
                      <span className="text-zinc-200">{app.country}</span>
                    </div>
                  )}
                  {app.city && (
                    <div>
                      <span className="text-zinc-500">City:</span>{' '}
                      <span className="text-zinc-200">{app.city}</span>
                    </div>
                  )}
                  {app.preferred_cohort_id && (
                    <div>
                      <span className="text-zinc-500">Cohort:</span>{' '}
                      <span className="text-zinc-200">
                        {cohorts.find((c) => c.id === app.preferred_cohort_id)?.name || 'N/A'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">Applied:</span>{' '}
                    <span className="text-zinc-200">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {app.status.toLowerCase() === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleApprove(app.id, app.email)}
                      disabled={processing === app.id}
                      className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
                    >
                      {processing === app.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={processing === app.id}
                      className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
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
                <input
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
                  placeholder="Sessions"
                  value={cohortForm.sessions}
                  onChange={(e) => setCohortForm({ ...cohortForm, sessions: e.target.value })}
                />
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

        {/* Calendar - Events, Cohorts & Activities */}
        <div className="max-w-md">
          <Calendar cohortId={null} showCohorts={true} />
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

        {/* Student progress */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-50">Student Progress</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Cohort</th>
                  <th className="px-3 py-2">Chapters</th>
                  <th className="px-3 py-2">Attendance</th>
                  <th className="px-3 py-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800">
                    <td className="px-3 py-2 text-zinc-50">{p.name}</td>
                    <td className="px-3 py-2 text-zinc-400">{p.email}</td>
                    <td className="px-3 py-2 text-zinc-400">{p.cohortName || p.cohortId || '—'}</td>
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
          </div>
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

