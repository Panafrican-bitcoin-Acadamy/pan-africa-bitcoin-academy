'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/hooks/useSession';
import EmailComposer from '@/components/EmailComposer';
import { StudentProgressModal } from '@/components/StudentProgressModal';

// Cohort color palette - same as Calendar component
const cohortColors = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', dot: 'bg-blue-500/50' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', dot: 'bg-purple-500/50' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', dot: 'bg-cyan-500/50' },
  { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', dot: 'bg-green-500/50' },
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', dot: 'bg-yellow-500/50' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300', dot: 'bg-orange-500/50' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-300', dot: 'bg-pink-500/50' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-300', dot: 'bg-indigo-500/50' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-300', dot: 'bg-teal-500/50' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300', dot: 'bg-rose-500/50' },
];

// Get consistent color for a cohort based on its ID
function getCohortColor(cohortId: string | null | undefined): typeof cohortColors[0] {
  if (!cohortId) {
    return cohortColors[0]; // Default to first color
  }
  
  // Simple hash function to get consistent index from cohort ID
  let hash = 0;
  for (let i = 0; i < cohortId.length; i++) {
    hash = ((hash << 5) - hash) + cohortId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % cohortColors.length;
  return cohortColors[index];
}

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
  phone: string | null;
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
  const [rearrangingSessions, setRearrangingSessions] = useState<string | null>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionCohortFilter, setSessionCohortFilter] = useState<string | null>(null);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('all');
  const [sessionDateFilter, setSessionDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [selectedEventForUpload, setSelectedEventForUpload] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'students' | 'events' | 'mentorships' | 'attendance' | 'exam' | 'assignments'>('overview');
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  
  // Sidebar navigation structure
  const sidebarSections = [
    {
      id: 'students',
      label: 'Students',
      icon: '👥',
      subMenus: [
        { id: 'approved-students', label: 'Approved Students' },
        { id: 'pending-students', label: 'Pending Students' },
        { id: 'rejected-students', label: 'Rejected Students' },
        { id: 'student-database', label: 'Student Database' },
        { id: 'assignments-submissions', label: 'Assignment Submissions' },
        { id: 'blog-submissions', label: 'Blog Submissions' },
      ],
    },
    {
      id: 'cohorts',
      label: 'Cohorts',
      icon: '📚',
      subMenus: [
        { id: 'cohort-list', label: 'Cohort List' },
        { id: 'sessions', label: 'Sessions' },
        { id: 'cohort-analytics', label: 'Cohort Analytics' },
      ],
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: '✉️',
      subMenus: [
        { id: 'email-composition', label: 'Email Composition' },
        { id: 'calendar', label: 'Calendar' },
      ],
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: '📝',
      subMenus: [
        { id: 'final-exam-submissions', label: 'Final Exam Submissions' },
        { id: 'sats-database', label: 'Sats Database' },
      ],
    },
  ];
  
  // Get breadcrumbs based on current navigation
  const getBreadcrumbs = () => {
    if (!activeSection || !activeSubMenu) {
      return [{ label: 'Dashboard', path: null }];
    }
    
    try {
      const section = sidebarSections.find(s => s.id === activeSection);
      const subMenu = section?.subMenus?.find(sm => sm.id === activeSubMenu);
      
      return [
        { label: 'Dashboard', path: null },
        { label: section?.label || '', path: null },
        { label: subMenu?.label || '', path: null },
      ];
    } catch (error) {
      return [{ label: 'Dashboard', path: null }];
    }
  };
  
  // Handle sidebar navigation
  const handleSidebarNavigation = (sectionId: string, subMenuId: string) => {
    setActiveSection(sectionId);
    setActiveSubMenu(subMenuId);
    
    // Map sidebar selections to existing tab system
    const navigationMap: Record<string, string> = {
      'approved-students': 'students',
      'pending-students': 'applications',
      'rejected-students': 'applications',
      'student-database': 'students',
      'assignments-submissions': 'assignments',
      'blog-submissions': 'overview',
      'cohort-list': 'overview',
      'sessions': 'overview',
      'cohort-analytics': 'overview',
      'email-composition': 'overview',
      'calendar': 'overview',
      'final-exam-submissions': 'exam',
    };
    
    const mappedTab = navigationMap[subMenuId];
    if (mappedTab) {
      setActiveTab(mappedTab as any);
      // Set filters based on sub-menu
      if (subMenuId === 'pending-students') setFilter('pending');
      if (subMenuId === 'rejected-students') setFilter('rejected');
      if (subMenuId === 'approved-students') setFilter('approved');
    }
  };
  const [examAccessList, setExamAccessList] = useState<any[]>([]);
  const [loadingExamAccess, setLoadingExamAccess] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'submitted' | 'graded'>('submitted');
  const [satsRewards, setSatsRewards] = useState<any[]>([]);
  const [satsStatistics, setSatsStatistics] = useState<any>(null);
  const [loadingSats, setLoadingSats] = useState(false);
  const [satsStatusFilter, setSatsStatusFilter] = useState<string>('all');
  const [satsTypeFilter, setSatsTypeFilter] = useState<string>('all');
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const [blogSubmissions, setBlogSubmissions] = useState<any[]>([]);
  const [loadingBlogSubmissions, setLoadingBlogSubmissions] = useState(false);
  const [blogFilter, setBlogFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingBlog, setProcessingBlog] = useState<string | null>(null);
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; email: string; name: string } | null>(null);

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

  // Fetch sats rewards when sats-database submenu is active or filters change
  useEffect(() => {
    if (admin && activeSubMenu === 'sats-database') {
      fetchSatsRewards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, activeSubMenu, satsStatusFilter, satsTypeFilter]);

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
        fetchSubmissions(),
        fetchBlogSubmissions(),
        fetchSessions(),
        fetchSatsRewards(),
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

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetchWithAuth('/api/sessions?admin=true');
      const data = await res.json();
      if (data.sessions) {
        setAllSessions(data.sessions || []);
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setAllSessions([]);
    } finally {
      setLoadingSessions(false);
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
    try {
      const res = await fetchWithAuth('/api/admin/students/progress');
      const data = await res.json();
      if (!res.ok) {
        console.error('[Admin] Error fetching progress:', data.error || 'Unknown error');
        setProgress([]);
        return;
      }
      if (data.progress) {
        console.log(`[Admin] Loaded ${data.progress.length} student progress records`);
        // Debug: Log first student's chapter progress
        if (data.progress.length > 0) {
          const firstStudent = data.progress[0];
          console.log(`[Admin] Sample student progress:`, {
            name: firstStudent.name,
            email: firstStudent.email,
            completedChapters: firstStudent.completedChapters,
            unlockedChapters: firstStudent.unlockedChapters,
            totalChapters: firstStudent.totalChapters,
          });
        }
        setProgress(data.progress);
      } else {
        console.warn('[Admin] No progress data in response');
        setProgress([]);
      }
    } catch (err: any) {
      console.error('[Admin] Error fetching student progress:', err);
      setProgress([]);
    }
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

  const fetchSatsRewards = async () => {
    try {
      setLoadingSats(true);
      const params = new URLSearchParams();
      if (satsStatusFilter !== 'all') params.append('status', satsStatusFilter);
      if (satsTypeFilter !== 'all') params.append('reward_type', satsTypeFilter);
      
      const res = await fetchWithAuth(`/api/admin/sats?${params.toString()}`);
      const data = await res.json();
      if (data.rewards) {
        setSatsRewards(data.rewards);
        setSatsStatistics(data.statistics);
      }
    } catch (err) {
      console.error('Error fetching sats rewards:', err);
    } finally {
      setLoadingSats(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!admin) return;
    try {
      setLoadingSubmissions(true);
      const res = await fetchWithAuth(`/api/admin/assignments/submissions?email=${encodeURIComponent(admin.email)}&status=${submissionFilter === 'all' ? 'all' : submissionFilter}`);
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, isCorrect: boolean) => {
    if (!admin) return;
    setGradingSubmission(submissionId);
    try {
      const res = await fetchWithAuth('/api/admin/assignments/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: admin.email,
          submissionId,
          isCorrect,
          feedback: gradingFeedback[submissionId] || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grade submission');
      alert(data.message || (isCorrect ? 'Assignment approved!' : 'Assignment rejected.'));
      await fetchSubmissions();
      setGradingFeedback((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    } catch (err: any) {
      alert(err.message || 'Failed to grade submission');
    } finally {
      setGradingSubmission(null);
    }
  };

  const fetchBlogSubmissions = async () => {
    if (!admin) return;
    try {
      setLoadingBlogSubmissions(true);
      const res = await fetchWithAuth(`/api/admin/blog?type=submissions&status=${blogFilter === 'all' ? '' : blogFilter}`);
      const data = await res.json();
      if (data.submissions) setBlogSubmissions(data.submissions);
    } catch (err) {
      console.error('Error fetching blog submissions:', err);
    } finally {
      setLoadingBlogSubmissions(false);
    }
  };

  const handleApproveBlog = async (submissionId: string) => {
    if (!admin) return;
    setProcessingBlog(submissionId);
    try {
      const res = await fetchWithAuth('/api/admin/blog/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          isFeatured: false,
          isBlogOfMonth: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve blog');
      alert(data.message || 'Blog approved and published!');
      await fetchBlogSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to approve blog');
    } finally {
      setProcessingBlog(null);
    }
  };

  const handleRejectBlog = async (submissionId: string, reason?: string) => {
    if (!admin) return;
    const rejectionReason = reason || prompt('Reason for rejection (optional):');
    if (rejectionReason === null) return; // User cancelled
    
    setProcessingBlog(submissionId);
    try {
      const res = await fetchWithAuth('/api/admin/blog/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          rejectionReason: rejectionReason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject blog');
      alert(data.message || 'Blog rejected.');
      await fetchBlogSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to reject blog');
    } finally {
      setProcessingBlog(null);
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

  const fetchApplicationDetails = async (applicationId: string) => {
    if (applicationDetails[applicationId]) {
      // Already loaded, just toggle
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [applicationId]: true }));
    try {
      const res = await fetchWithAuth(`/api/admin/applications/${applicationId}`);
      const data = await res.json();
      if (res.ok) {
        setApplicationDetails((prev) => ({ ...prev, [applicationId]: data }));
      } else {
        console.error('Failed to fetch application details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const toggleApplicationDetails = (applicationId: string) => {
    if (expandedApplicationId === applicationId) {
      setExpandedApplicationId(null);
    } else {
      setExpandedApplicationId(applicationId);
      fetchApplicationDetails(applicationId);
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
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate sessions');
    } finally {
      setRegeneratingSessions(null);
    }
  };

  const rearrangeSessions = async (cohortId: string, cohortName: string) => {
    const startDate = prompt(`Rearrange sessions for ${cohortName}?\n\nEnter start date for Session 1 (YYYY-MM-DD):`);
    if (!startDate || !startDate.trim()) return;
    
    if (!confirm(`This will rearrange all sessions for ${cohortName} starting from ${startDate}.\n\nSchedule Pattern:\n- 3 working days per week: Monday, Wednesday, Friday\n- Sundays are always excluded\n- All sessions will be rescheduled (none removed)\n\nContinue?`)) {
      return;
    }
    
    setRearrangingSessions(cohortId);
    try {
      const res = await fetchWithAuth('/api/admin/cohorts/rearrange-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId, startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rearrange sessions');
      
      // Show detailed schedule in alert
      let scheduleText = `Sessions rearranged successfully!\n\n${data.sessionsUpdated || 0} sessions updated.\nStart: ${data.startDate}\nEnd: ${data.endDate}\n\nSchedule (first 15 sessions):\n`;
      if (data.schedule && data.schedule.length > 0) {
        data.schedule.slice(0, 15).forEach((s: any) => {
          scheduleText += `Session ${s.session_number}: ${s.date} (${s.day})\n`;
        });
        if (data.schedule.length > 15) {
          scheduleText += `... and ${data.schedule.length - 15} more sessions`;
        }
      }
      alert(scheduleText);
      await fetchCohorts();
      await fetchOverview();
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to rearrange sessions');
    } finally {
      setRearrangingSessions(null);
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
                type="password" name="password" autoComplete="current-password"
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
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Admin Panel</h2>
              <p className="text-xs text-zinc-500 truncate">{admin.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sidebarSections.map((section) => {
            const isSectionActive = activeSection === section.id;
            const hasActiveSubMenu = section.subMenus.some(sm => activeSubMenu === sm.id);
            
            return (
              <div key={section.id} className="mb-4">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSectionActive) {
                      setActiveSection(null);
                      setActiveSubMenu(null);
                    } else {
                      setActiveSection(section.id);
                      // Auto-select first sub-menu
                      if (section.subMenus.length > 0) {
                        handleSidebarNavigation(section.id, section.subMenus[0].id);
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isSectionActive || hasActiveSubMenu
                      ? 'bg-zinc-800 text-zinc-50'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{section.icon}</span>
                  {!sidebarCollapsed && <span className="flex-1 text-left">{section.label}</span>}
                  {!sidebarCollapsed && (
                    <span className={`transition-transform ${isSectionActive ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                  )}
                </button>
                
                {/* Sub-menus */}
                {!sidebarCollapsed && isSectionActive && (
                  <div className="mt-1 ml-4 space-y-0.5 border-l border-zinc-800 pl-3">
                    {section.subMenus.map((subMenu) => (
                      <button
                        key={subMenu.id}
                        type="button"
                        onClick={() => handleSidebarNavigation(section.id, subMenu.id)}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                          activeSubMenu === subMenu.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-500'
                            : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                        }`}
                      >
                        {subMenu.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-300 transition ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <span>🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-zinc-500">
              {getBreadcrumbs().map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span>›</span>}
                  <span className={index === getBreadcrumbs().length - 1 ? 'text-zinc-300 font-medium' : ''}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </nav>
            
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-zinc-50">
                  {activeSubMenu && activeSection
                    ? (() => {
                        const section = sidebarSections.find(s => s.id === activeSection);
                        const subMenu = section?.subMenus?.find(sm => sm.id === activeSubMenu);
                        return subMenu?.label || 'Admin Dashboard';
                      })()
                    : 'Admin Dashboard'}
                </h1>
                {activeSubMenu && activeSection && (
                  <p className="text-sm text-zinc-500 mt-1">
                    {sidebarSections.find(s => s.id === activeSection)?.label || ''}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                {error}
              </div>
            )}

            {/* Overview cards - show on dashboard or when no specific sub-menu is selected */}
            {(!activeSubMenu || (activeTab === 'overview' && !activeSubMenu)) && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {overview && [
            { label: 'Applications', value: overview.totalApplications, accent: 'cyan' },
            { label: 'Pending', value: overview.pendingApplications, accent: 'yellow' },
            { label: 'Approved', value: overview.approvedApplications, accent: 'green' },
            { label: 'Students', value: overview.totalStudents, accent: 'blue' },
            { label: 'Cohorts', value: overview.totalCohorts, accent: 'purple' },
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
            )}

            {/* Students Section - Pending/Rejected Students */}
            {(activeSubMenu === 'pending-students' || activeSubMenu === 'rejected-students' || (activeTab === 'applications' && (filter === 'pending' || filter === 'rejected'))) && (
              <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
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

                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleApplicationDetails(app.id)}
                      disabled={loadingDetails[app.id]}
                      className="flex-1 rounded bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loadingDetails[app.id] ? 'Loading...' : expandedApplicationId === app.id ? 'Hide Details' : 'View Details'}
                    </button>
                    {app.status.toLowerCase() === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id, app.email)}
                          disabled={processing === app.id}
                          className="flex-1 rounded bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {processing === app.id ? '...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id, app.email)}
                          disabled={processing === app.id}
                          className="flex-1 rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>

                  {/* Expanded Details Dropdown */}
                  {expandedApplicationId === app.id && applicationDetails[app.id] && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-zinc-500">Application ID:</span>
                          <p className="text-zinc-200 font-mono text-[10px] break-all">{app.id}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Status:</span>
                          <p className="text-zinc-200">{app.status}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">First Name:</span>
                          <p className="text-zinc-200">{app.first_name}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Last Name:</span>
                          <p className="text-zinc-200">{app.last_name}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Email:</span>
                          <p className="text-zinc-200 break-all">{app.email}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Phone:</span>
                          <p className="text-zinc-200">{app.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Country:</span>
                          <p className="text-zinc-200">{app.country || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">City:</span>
                          <p className="text-zinc-200">{app.city || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Experience Level:</span>
                          <p className="text-zinc-200">{app.experience_level || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Preferred Language:</span>
                          <p className="text-zinc-200">{app.preferred_language || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Birth Date:</span>
                          <p className="text-zinc-200">{app.birth_date ? new Date(app.birth_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Created At:</span>
                          <p className="text-zinc-200">{new Date(app.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Profile Data */}
                      {applicationDetails[app.id].profile && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Profile Data</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-zinc-500">Profile ID:</span>
                              <p className="text-zinc-200 font-mono text-[10px] break-all">{applicationDetails[app.id].profile.id}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Student ID:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.student_id || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Name:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.name}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Status:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.status}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Phone:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Country:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.country || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">City:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].profile.city || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Created At:</span>
                              <p className="text-zinc-200">{new Date(applicationDetails[app.id].profile.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Student Data */}
                      {applicationDetails[app.id].student && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Student Data</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-zinc-500">Student ID:</span>
                              <p className="text-zinc-200 font-mono text-[10px] break-all">{applicationDetails[app.id].student.id}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Status:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].student.status || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Created At:</span>
                              <p className="text-zinc-200">{new Date(applicationDetails[app.id].student.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cohort Enrollments */}
                      {applicationDetails[app.id].cohortEnrollments && applicationDetails[app.id].cohortEnrollments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Cohort Enrollments</h4>
                          {applicationDetails[app.id].cohortEnrollments.map((enrollment: any, idx: number) => (
                            <div key={idx} className="mb-2 p-2 bg-zinc-800/50 rounded">
                              <p className="text-zinc-200 font-medium">{enrollment.cohorts?.name || 'Unknown Cohort'}</p>
                              <p className="text-zinc-400 text-[10px]">Enrolled: {new Date(enrollment.enrolled_at).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chapter Progress */}
                      {applicationDetails[app.id].chapterProgress && applicationDetails[app.id].chapterProgress.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Chapter Progress</h4>
                          <div className="grid grid-cols-3 gap-1 text-[10px]">
                            {applicationDetails[app.id].chapterProgress.map((progress: any) => (
                              <div key={progress.chapter_number} className="p-1 bg-zinc-800/50 rounded">
                                <span className="text-zinc-400">Ch {progress.chapter_number}:</span>
                                <span className={progress.is_completed ? 'text-green-400' : progress.is_unlocked ? 'text-yellow-400' : 'text-zinc-500'}>
                                  {progress.is_completed ? '✓' : progress.is_unlocked ? '○' : '✗'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attendance */}
                      {applicationDetails[app.id].attendance && applicationDetails[app.id].attendance.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Attendance ({applicationDetails[app.id].attendance.length} records)</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {applicationDetails[app.id].attendance.slice(0, 5).map((att: any, idx: number) => (
                              <div key={idx} className="text-[10px] p-1 bg-zinc-800/50 rounded">
                                <span className="text-zinc-200">{att.events?.name || 'Unknown Event'}</span>
                                <span className="text-zinc-400 ml-2">{att.duration_minutes} min</span>
                              </div>
                            ))}
                            {applicationDetails[app.id].attendance.length > 5 && (
                              <p className="text-zinc-400 text-[10px]">+{applicationDetails[app.id].attendance.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sats Rewards */}
                      {applicationDetails[app.id].satsRewards && applicationDetails[app.id].satsRewards.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Sats Rewards ({applicationDetails[app.id].satsRewards.length} records)</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {applicationDetails[app.id].satsRewards.slice(0, 5).map((reward: any, idx: number) => (
                              <div key={idx} className="text-[10px] p-1 bg-zinc-800/50 rounded">
                                <span className="text-zinc-200">{reward.amount} sats</span>
                                <span className="text-zinc-400 ml-2">{reward.reward_type}</span>
                                <span className="text-zinc-500 ml-2">{new Date(reward.created_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                            {applicationDetails[app.id].satsRewards.length > 5 && (
                              <p className="text-zinc-400 text-[10px]">+{applicationDetails[app.id].satsRewards.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Achievements */}
                      {applicationDetails[app.id].achievements && applicationDetails[app.id].achievements.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Achievements ({applicationDetails[app.id].achievements.length})</h4>
                          <div className="space-y-1">
                            {applicationDetails[app.id].achievements.map((achievement: any, idx: number) => (
                              <div key={idx} className="text-[10px] p-1 bg-zinc-800/50 rounded">
                                <span className="text-zinc-200 font-medium">{achievement.badge_name}</span>
                                <span className="text-zinc-400 ml-2">{achievement.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preferred Cohort */}
                      {applicationDetails[app.id].preferredCohort && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">Preferred Cohort</h4>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-zinc-500">Name:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].preferredCohort.name}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Level:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].preferredCohort.level || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Start Date:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].preferredCohort.start_date ? new Date(applicationDetails[app.id].preferredCohort.start_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Status:</span>
                              <p className="text-zinc-200">{applicationDetails[app.id].preferredCohort.status || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
            )}

            {/* Cohort List Sub-menu - Manage Cohorts, Create Cohort, Create Event */}
            {activeSubMenu === 'cohort-list' && (
              <>
                {/* Manage Cohorts Section */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-zinc-50">Manage Cohorts</h3>
                  {cohorts.length === 0 ? (
                    <p className="text-sm text-zinc-400">No cohorts found.</p>
                  ) : (
                    <div className="space-y-3">
                      {cohorts.map((cohort) => (
                        <div
                          key={cohort.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-zinc-50">{cohort.name}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                                {cohort.startDate && (
                                  <span>Start: {new Date(cohort.startDate).toLocaleDateString()}</span>
                                )}
                                {cohort.endDate && (
                                  <span>End: {new Date(cohort.endDate).toLocaleDateString()}</span>
                                )}
                                {cohort.level && <span>Level: {cohort.level}</span>}
                                {cohort.status && (
                                  <span className={`px-2 py-0.5 rounded ${
                                    cohort.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                    cohort.status === 'Upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-zinc-500/20 text-zinc-400'
                                  }`}>
                                    {cohort.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => regenerateSessions(cohort.id)}
                                disabled={regeneratingSessions === cohort.id}
                                className="rounded border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Regenerate all sessions based on start/end dates"
                              >
                                {regeneratingSessions === cohort.id ? 'Regenerating...' : 'Regenerate Sessions'}
                              </button>
                              <button
                                type="button"
                                onClick={() => rearrangeSessions(cohort.id, cohort.name)}
                                disabled={rearrangingSessions === cohort.id}
                                className="rounded border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                title="Rearrange sessions to Mon/Wed/Fri pattern"
                              >
                                {rearrangingSessions === cohort.id ? 'Rearranging...' : 'Rearrange Sessions'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  type="button"
                  onClick={createCohort}
                  disabled={creatingCohort || !cohortForm.name}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
                  type="button"
                  onClick={createEvent}
                  disabled={creatingEvent || !eventForm.name || !eventForm.start_time}
                  className="w-full rounded-lg bg-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {creatingEvent ? 'Saving...' : 'Create Event'}
                </button>
            </div>
          </div>
        </div>
              </>
            )}

            {/* Cohort Analytics Sub-menu - Analytics Cards Only */}
            {activeSubMenu === 'cohort-analytics' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-zinc-50">Cohort Analytics</h3>
                  <p className="text-xs text-zinc-400 mt-1">Enrollment stats, completion rates, and participation metrics</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cohorts.map((cohort) => {
                    const cohortStudents = progress.filter(p => p.cohortId === cohort.id);
                    const activeStudents = cohortStudents.filter(p => p.status === 'Active').length;
                    const avgProgress = cohortStudents.length > 0
                      ? Math.round(cohortStudents.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / cohortStudents.length)
                      : 0;
                    const avgAttendance = cohortStudents.length > 0
                      ? Math.round(cohortStudents.reduce((sum, p) => sum + (p.attendancePercent || 0), 0) / cohortStudents.length)
                      : 0;
                    
                    return (
                      <div key={cohort.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <h4 className="text-sm font-semibold text-zinc-50 mb-3">{cohort.name}</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Enrolled:</span>
                            <span className="text-zinc-200 font-medium">{activeStudents}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Avg Progress:</span>
                            <span className="text-yellow-300 font-medium">{avgProgress}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Avg Attendance:</span>
                            <span className="text-blue-300 font-medium">{avgAttendance}%</span>
                          </div>
                          {cohort.seats && (
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Capacity:</span>
                              <span className="text-zinc-200">{activeStudents}/{cohort.seats}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cohorts.length === 0 && (
                  <p className="p-3 text-sm text-zinc-400 text-center">No cohorts found.</p>
                )}
              </div>
            )}

            {/* Sessions Sub-menu - Sessions List/Table View Only */}
            {activeSubMenu === 'sessions' && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-50">All Sessions</h3>
              <p className="text-xs text-zinc-400 mt-1">
                View and manage all cohort sessions in a structured format
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSessions}
              disabled={loadingSessions}
              className="rounded border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingSessions ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={sessionCohortFilter || ''}
              onChange={(e) => setSessionCohortFilter(e.target.value || null)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">All Cohorts</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>

            <select
              value={sessionStatusFilter}
              onChange={(e) => setSessionStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>

            <select
              value={sessionDateFilter}
              onChange={(e) => setSessionDateFilter(e.target.value as 'all' | 'upcoming' | 'past')}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Statistics */}
          {allSessions.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-xs text-zinc-400">Total Sessions</div>
                <div className="text-lg font-semibold text-zinc-50">{allSessions.length}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-xs text-zinc-400">Scheduled</div>
                <div className="text-lg font-semibold text-yellow-400">
                  {allSessions.filter((s) => s.status === 'scheduled').length}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-xs text-zinc-400">Completed</div>
                <div className="text-lg font-semibold text-green-400">
                  {allSessions.filter((s) => s.status === 'completed').length}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-xs text-zinc-400">Upcoming</div>
                <div className="text-lg font-semibold text-cyan-400">
                  {allSessions.filter((s) => {
                    const sessionDate = new Date(s.session_date);
                    return sessionDate >= new Date() && s.status === 'scheduled';
                  }).length}
                </div>
              </div>
            </div>
          )}

          {/* Sessions Table */}
          {loadingSessions ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
              Loading sessions...
            </div>
          ) : allSessions.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
              No sessions found. Sessions will appear here once cohorts are created with start/end dates.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-900 text-left text-zinc-300">
                  <tr>
                    <th className="px-3 py-2">Session #</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Cohort</th>
                    <th className="px-3 py-2">Topic</th>
                    <th className="px-3 py-2">Instructor</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {allSessions
                    .filter((session) => {
                      // Apply cohort filter
                      if (sessionCohortFilter && session.cohort_id !== sessionCohortFilter) {
                        return false;
                      }
                      // Apply status filter
                      if (sessionStatusFilter !== 'all' && session.status !== sessionStatusFilter) {
                        return false;
                      }
                      // Apply date filter
                      if (sessionDateFilter !== 'all') {
                        const sessionDate = new Date(session.session_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        sessionDate.setHours(0, 0, 0, 0);
                        if (sessionDateFilter === 'upcoming' && sessionDate < today) {
                          return false;
                        }
                        if (sessionDateFilter === 'past' && sessionDate >= today) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      // Sort by date, then by session number
                      const dateA = new Date(a.session_date).getTime();
                      const dateB = new Date(b.session_date).getTime();
                      if (dateA !== dateB) return dateA - dateB;
                      return (a.session_number || 0) - (b.session_number || 0);
                    })
                    .map((session) => {
                      const sessionDate = new Date(session.session_date);
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const dayName = dayNames[sessionDate.getDay()];
                      const isPast = sessionDate < new Date();
                      const isToday = sessionDate.toDateString() === new Date().toDateString();
                      
                      // Get cohort color
                      const cohortId = session.cohort_id || session.cohorts?.id;
                      const cohortColor = getCohortColor(cohortId);

                      return (
                        <tr
                          key={session.id}
                          className={`hover:bg-zinc-800/50 ${
                            isToday ? 'bg-cyan-500/10' : isPast ? 'opacity-75' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-zinc-300">{session.session_number || 'N/A'}</td>
                          <td className="px-3 py-2 text-zinc-300">
                            {sessionDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {isToday && (
                              <span className="ml-1 text-xs text-cyan-400">(Today)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-400">{dayName}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${cohortColor.dot}`} title={session.cohorts?.name || 'Unknown Cohort'}></div>
                              <span className={`text-zinc-300 ${cohortColor.text}`}>
                                {session.cohorts?.name || 'Unknown Cohort'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-zinc-300">
                            {session.topic || (
                              <span className="text-zinc-500 italic">No topic</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-300">
                            {session.instructor || (
                              <span className="text-zinc-500 italic">TBD</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-300">
                            {session.duration_minutes || 90} min
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                                session.status === 'completed'
                                  ? 'border-green-500/50 bg-green-500/20 text-green-400'
                                  : session.status === 'cancelled'
                                  ? 'border-red-500/50 bg-red-500/20 text-red-400'
                                  : session.status === 'rescheduled'
                                  ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
                                  : 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {session.status || 'scheduled'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {session.link ? (
                              <a
                                href={session.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-xs"
                              >
                                Join
                              </a>
                            ) : (
                              <span className="text-zinc-500 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
            )}

            {/* Communications Section */}
            {(activeSubMenu === 'email-composition' || activeSubMenu === 'calendar') && (
              <>
                {/* Email Composition and Calendar */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Email Composition Interface */}
                  {activeSubMenu === 'email-composition' && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                      <h2 className="text-lg font-semibold text-zinc-50 mb-2">Email Composition</h2>
                      <p className="text-xs text-zinc-400 mb-3">
                        Send professional emails to students, applicants, or other recipients.
                      </p>
                      <div className="rounded-lg">
                        <EmailComposer />
                      </div>
                    </div>
                  )}

                  {/* Calendar - Events, Cohorts & Activities */}
                  {activeSubMenu === 'calendar' && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-50">Calendar</h2>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                            Mon/Wed/Fri Only
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-red-400/50"></span>
                            Sundays Excluded
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3">
                        Sessions follow a 3-day-per-week pattern (Monday, Wednesday, Friday). Sundays are never scheduled.
                      </p>
                      <div className="rounded-lg">
                        <Calendar cohortId={null} showCohorts={true} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

                {/* Mentorship applications - Show in overview or cohorts section */}
                {(!activeSubMenu || activeSubMenu === 'cohort-list' || activeSubMenu === 'cohort-analytics') && (
                  <>
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
                        type="button"
                        onClick={() => updateMentorshipStatus(m.id, 'Approved')}
                        className="rounded border border-green-500/40 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10 transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateMentorshipStatus(m.id, 'Rejected')}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 transition cursor-pointer"
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
                  </>
                )}

            {/* Approved Students - Show filtered student database */}
            {activeSubMenu === 'approved-students' && (
              <>
                {/* Student Database - Filtered to approved students */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-zinc-50">Approved Students</h3>
                    <p className="text-xs text-zinc-400 mt-1">Students who have been approved and enrolled</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-zinc-900 text-left text-zinc-300">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Phone</th>
                          <th className="px-3 py-2">Cohort</th>
                          <th className="px-3 py-2">Progress</th>
                          <th className="px-3 py-2">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progress.filter(p => p.status === 'Active').map((p, idx) => (
                          <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-3 py-2 text-zinc-400">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setSelectedStudent({ id: p.id, email: p.email, name: p.name })}
                                className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                              >
                                {p.name}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-zinc-300">{p.email}</td>
                            <td className="px-3 py-2 text-zinc-400">{p.phone || '—'}</td>
                            <td className="px-3 py-2 text-zinc-300">{p.cohortName || '—'}</td>
                            <td className="px-3 py-2">
                              <span className="text-green-300">{p.completedChapters}</span>
                              <span className="text-zinc-500">/{p.totalChapters || 20}</span>
                            </td>
                            <td className="px-3 py-2">
                              {p.attendancePercent !== undefined ? (
                                <span className="text-blue-300">{p.attendancePercent}%</span>
                              ) : (
                                <span className="text-zinc-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {progress.filter(p => p.status === 'Active').length === 0 && (
                      <p className="p-3 text-sm text-zinc-400 text-center">No approved students found.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Student Database Section */}
            {(activeSubMenu === 'student-database' || activeSubMenu === 'assignments-submissions' || activeSubMenu === 'blog-submissions' || activeTab === 'students') && (
              <>
                {/* Student Database */}
                {(activeSubMenu === 'student-database' || activeTab === 'students') && (
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
                    type="button"
                    onClick={() => setCohortFilter(null)}
                    className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
                {attendanceSort && (
                  <button
                    type="button"
                    onClick={() => setAttendanceSort(null)}
                    className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
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
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      Name
                      <span className="text-xs text-zinc-500">(Click to view details)</span>
                    </div>
                  </th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
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
                {filteredAndSortedProgress.map((p, index) => (
                  <tr 
                    key={p.id} 
                    className={`border-b border-zinc-800 cursor-pointer transition hover:bg-zinc-800/50 ${cohortFilter && p.cohortId === cohortFilter ? 'bg-zinc-800/30' : ''}`}
                    onClick={() => setSelectedStudent({ id: p.id, email: p.email, name: p.name })}
                  >
                    <td className="px-3 py-2 text-zinc-400">{index + 1}</td>
                    <td className="px-3 py-2 text-zinc-50">{p.name}</td>
                    <td className="px-3 py-2 text-zinc-400">{p.email}</td>
                    <td className="px-3 py-2 text-zinc-400">{p.phone || '—'}</td>
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
                )}

                {/* Assignment Submissions Section */}
                {(activeSubMenu === 'assignments-submissions' || activeTab === 'assignments') && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-zinc-50">Assignment Submissions</h2>
                      <div className="flex gap-2">
                        {(['all', 'submitted', 'graded'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setSubmissionFilter(f);
                              setTimeout(() => fetchSubmissions(), 0);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                              submissionFilter === f
                                ? 'bg-cyan-400 text-black'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)} (
                            {submissions.filter((s) => {
                              if (f === 'all') return true;
                              return s.status === f;
                            }).length})
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">
                      Review and grade student assignment submissions. Approve to award sats rewards.
                    </p>

                    {loadingSubmissions ? (
                      <div className="text-center py-8 text-zinc-400">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400">No submissions found.</div>
                    ) : (
                      <div className="space-y-4">
                        {submissions
                          .filter((s) => {
                            if (submissionFilter === 'all') return true;
                            return s.status === submissionFilter;
                          })
                          .map((submission) => {
                            const assignment = submission.assignments;
                            const student = submission.profiles;
                            return (
                              <div
                                key={submission.id}
                                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                              >
                                <div className="mb-3 flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-zinc-50">
                                      {assignment?.title || 'Untitled Assignment'}
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                      Chapter {assignment?.chapter_number || 'N/A'} • {student?.name || student?.email || 'Unknown Student'}
                                    </p>
                                    {assignment?.reward_sats && (
                                      <p className="text-xs text-cyan-400 mt-1">
                                        Reward: {assignment.reward_sats} sats
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`rounded-full border px-2 py-1 text-xs ${
                                      submission.status === 'graded'
                                        ? submission.is_correct
                                          ? 'text-green-400 bg-green-500/10 border-green-500/30'
                                          : 'text-red-400 bg-red-500/10 border-red-500/30'
                                        : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                                    }`}
                                  >
                                    {submission.status === 'graded'
                                      ? submission.is_correct
                                        ? 'Approved'
                                        : 'Rejected'
                                      : 'Pending Review'}
                                  </span>
                                </div>

                                {assignment?.question && (
                                  <div className="mb-3 rounded bg-zinc-800/50 p-3">
                                    <p className="text-xs font-medium text-zinc-300 mb-1">Question:</p>
                                    <p className="text-sm text-zinc-200">{assignment.question}</p>
                                  </div>
                                )}

                                <div className="mb-3 rounded bg-zinc-800/50 p-3">
                                  <p className="text-xs font-medium text-zinc-300 mb-1">Student Answer:</p>
                                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{submission.answer}</p>
                                </div>

                                {submission.feedback && (
                                  <div className="mb-3 rounded bg-blue-500/10 border border-blue-500/30 p-3">
                                    <p className="text-xs font-medium text-blue-300 mb-1">Feedback:</p>
                                    <p className="text-sm text-blue-200">{submission.feedback}</p>
                                  </div>
                                )}

                                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                                  <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                                  {submission.graded_at && (
                                    <span>• Graded: {new Date(submission.graded_at).toLocaleString()}</span>
                                  )}
                                </div>

                                {submission.status === 'submitted' && (
                                  <div className="mt-4 space-y-2">
                                    <textarea
                                      placeholder="Optional feedback for student..."
                                      value={gradingFeedback[submission.id] || ''}
                                      onChange={(e) =>
                                        setGradingFeedback((prev) => ({
                                          ...prev,
                                          [submission.id]: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleGradeSubmission(submission.id, true)}
                                        disabled={gradingSubmission === submission.id}
                                        className="flex-1 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                      >
                                        {gradingSubmission === submission.id ? 'Grading...' : '✓ Approve'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleGradeSubmission(submission.id, false)}
                                        disabled={gradingSubmission === submission.id}
                                        className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                      >
                                        {gradingSubmission === submission.id ? 'Grading...' : '✗ Reject'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Blog Submissions Section */}
                {(activeSubMenu === 'blog-submissions' || activeTab === 'overview') && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-zinc-50">Blog Submissions</h2>
                      <div className="flex gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setBlogFilter(f);
                              setTimeout(() => fetchBlogSubmissions(), 0);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                              blogFilter === f
                                ? 'bg-purple-400 text-black'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)} (
                            {blogSubmissions.filter((s) => {
                              if (f === 'all') return true;
                              return s.status === f;
                            }).length})
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">
                      Review and approve student blog submissions. Approved posts will be published and authors will receive sats rewards.
                    </p>

                    {loadingBlogSubmissions ? (
                      <div className="text-center py-8 text-zinc-400">Loading blog submissions...</div>
                    ) : blogSubmissions.filter((s) => {
                        if (blogFilter === 'all') return true;
                        return s.status === blogFilter;
                      }).length === 0 ? (
                      <div className="text-center py-8 text-zinc-400">No blog submissions found.</div>
                    ) : (
                      <div className="space-y-4">
                        {blogSubmissions
                          .filter((s) => {
                            if (blogFilter === 'all') return true;
                            return s.status === blogFilter;
                          })
                          .map((submission) => (
                            <div
                              key={submission.id}
                              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-sm font-semibold text-zinc-50">
                                    {submission.title}
                                  </h3>
                                  <p className="text-xs text-zinc-400 mt-1">
                                    {submission.author_name} • {submission.author_email}
                                    {submission.cohort && ` • ${submission.cohort}`}
                                  </p>
                                  <p className="text-xs text-purple-400 mt-1">
                                    Category: {submission.category}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    submission.status === 'approved'
                                      ? 'text-green-400 bg-green-500/10 border-green-500/30'
                                      : submission.status === 'rejected'
                                      ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                      : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                                  }`}
                                >
                                  {submission.status === 'approved'
                                    ? 'Approved'
                                    : submission.status === 'rejected'
                                    ? 'Rejected'
                                    : 'Pending Review'}
                                </span>
                              </div>

                              <div className="mb-3 rounded bg-zinc-800/50 p-3">
                                <p className="text-xs font-medium text-zinc-300 mb-1">Content Preview:</p>
                                <p className="text-sm text-zinc-200 line-clamp-3">
                                  {submission.content.substring(0, 300)}...
                                </p>
                              </div>

                              {expandedBlogId === submission.id && (
                                <div className="mb-3 rounded bg-zinc-800/50 p-3">
                                  <p className="text-xs font-medium text-zinc-300 mb-2">Full Content:</p>
                                  <p className="text-sm text-zinc-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {submission.content}
                                  </p>
                                </div>
                              )}

                              {submission.rejection_reason && (
                                <div className="mb-3 rounded bg-red-500/10 border border-red-500/30 p-3">
                                  <p className="text-xs font-medium text-red-300 mb-1">Rejection Reason:</p>
                                  <p className="text-sm text-red-200">{submission.rejection_reason}</p>
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                                <span>Submitted: {new Date(submission.created_at).toLocaleString()}</span>
                                {submission.reviewed_at && (
                                  <span>• Reviewed: {new Date(submission.reviewed_at).toLocaleString()}</span>
                                )}
                              </div>

                              {submission.status === 'pending' && (
                                <div className="mt-4 space-y-2">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedBlogId(expandedBlogId === submission.id ? null : submission.id)}
                                      className="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/30 cursor-pointer"
                                    >
                                      {expandedBlogId === submission.id ? 'Hide Full Content' : 'View Full Content'}
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveBlog(submission.id)}
                                      disabled={processingBlog === submission.id}
                                      className="flex-1 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      {processingBlog === submission.id ? 'Processing...' : '✓ Approve & Publish'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reason = prompt('Rejection reason (optional):');
                                        if (reason !== null) {
                                          handleRejectBlog(submission.id, reason || undefined);
                                        }
                                      }}
                                      disabled={processingBlog === submission.id}
                                      className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      {processingBlog === submission.id ? 'Processing...' : '✗ Reject'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Assessments Section - Final Exam Only */}
            {(activeSubMenu === 'final-exam-submissions' || activeTab === 'exam') && (
              <>
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
                              type="button"
                              onClick={() => revokeExamAccess(student.id)}
                              className="text-red-400 hover:text-red-300 text-xs transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => grantExamAccess(student.id)}
                              className="text-green-400 hover:text-green-300 text-xs transition cursor-pointer"
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
              </>
            )}

            {/* Assessments Section - Sats Database */}
            {activeSubMenu === 'sats-database' && (
              <>
                {/* Sats Database Statistics */}
                {satsStatistics && (
                  <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-orange-500/25 bg-black/80 p-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                      <div className="text-xs text-orange-300 mb-1">Total Paid</div>
                      <div className="text-2xl font-bold text-orange-200">
                        {satsStatistics.totalPaid?.toLocaleString() || 0} sats
                      </div>
                    </div>
                    <div className="rounded-xl border border-yellow-500/25 bg-black/80 p-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                      <div className="text-xs text-yellow-300 mb-1">Total Pending</div>
                      <div className="text-2xl font-bold text-yellow-200">
                        {satsStatistics.totalPending?.toLocaleString() || 0} sats
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-4 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                      <div className="text-xs text-cyan-300 mb-1">Total Rewards</div>
                      <div className="text-2xl font-bold text-cyan-200">
                        {satsStatistics.totalRewards?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-purple-500/25 bg-black/80 p-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                      <div className="text-xs text-purple-300 mb-1">Total Amount</div>
                      <div className="text-2xl font-bold text-purple-200">
                        {((satsStatistics.totalPaid || 0) + (satsStatistics.totalPending || 0)).toLocaleString()} sats
                      </div>
                    </div>
                  </div>
                )}

                {/* Sats Database Section */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-50 mb-2">Sats Rewards Database</h2>
                      <p className="text-sm text-zinc-400">
                        View and manage all sats rewards across the academy.
                      </p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mb-4 flex flex-wrap gap-3">
                    <select
                      value={satsStatusFilter}
                      onChange={(e) => {
                        setSatsStatusFilter(e.target.value);
                        setTimeout(() => fetchSatsRewards(), 100);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select
                      value={satsTypeFilter}
                      onChange={(e) => {
                        setSatsTypeFilter(e.target.value);
                        setTimeout(() => fetchSatsRewards(), 100);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300"
                    >
                      <option value="all">All Types</option>
                      <option value="assignment">Assignment</option>
                      <option value="chapter">Chapter</option>
                      <option value="discussion">Discussion</option>
                      <option value="peer_help">Peer Help</option>
                      <option value="project">Project</option>
                      <option value="attendance">Attendance</option>
                      <option value="blog">Blog</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      onClick={fetchSatsRewards}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingSats ? (
                    <div className="text-center py-8 text-zinc-400">Loading sats rewards...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-zinc-900 text-left text-zinc-300">
                          <tr>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Amount Paid</th>
                            <th className="px-3 py-2">Amount Pending</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Reason</th>
                            <th className="px-3 py-2">Awarded By</th>
                            <th className="px-3 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {satsRewards.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-3 py-8 text-center text-zinc-400">
                                No sats rewards found.
                              </td>
                            </tr>
                          ) : (
                            satsRewards.map((reward: any) => (
                              <tr key={reward.id} className="border-b border-zinc-800">
                                <td className="px-3 py-2 text-zinc-50">
                                  {reward.student?.name || '—'}
                                </td>
                                <td className="px-3 py-2 text-zinc-400">
                                  {reward.student?.email || '—'}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-300">
                                    {reward.reward_type || 'other'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-orange-300 font-medium">
                                  {reward.amount_paid?.toLocaleString() || 0} sats
                                </td>
                                <td className="px-3 py-2 text-yellow-300 font-medium">
                                  {reward.amount_pending?.toLocaleString() || 0} sats
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    reward.status === 'paid' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    reward.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                    reward.status === 'processing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    reward.status === 'failed' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                                  }`}>
                                    {reward.status || 'pending'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-zinc-400 text-xs max-w-xs truncate">
                                  {reward.reason || '—'}
                                </td>
                                <td className="px-3 py-2 text-zinc-400 text-xs">
                                  {reward.awarded_by_profile?.name || reward.awarded_by || '—'}
                                </td>
                                <td className="px-3 py-2 text-zinc-400 text-xs">
                                  {reward.created_at ? new Date(reward.created_at).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        </main>

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

        {/* Student Progress Modal */}
        {selectedStudent && (
          <StudentProgressModal
            studentId={selectedStudent.id}
            studentEmail={selectedStudent.email}
            studentName={selectedStudent.name}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    );
  }

