'use client';

import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/hooks/useSession';
import EmailComposer from '@/components/EmailComposer';
import { StudentProgressModal } from '@/components/StudentProgressModal';
import EventForm from '@/components/admin/EventForm';
import EventsList from '@/components/admin/EventsList';
import MentorRegistrationForm from '@/components/admin/MentorRegistrationForm';
import { AdminAccessManagement } from '@/components/admin/AdminAccessManagement';
import { 
  Users, BookOpen, Book, Handshake, Mail, FileText, BarChart3, 
  CheckCircle2, AlertCircle, Trophy, DollarSign, Calendar as CalendarIcon, 
  Clock, User, Info, Trash2, Award, Target, Briefcase, Heart,
  ClipboardList, Rocket, HelpCircle, Sparkles, Settings, 
  PenTool, GraduationCap, XCircle, Loader2, Shield, Lock, History, LogOut,
  Eye, EyeOff
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
  
  // State for approved students and all students
  const [approvedStudents, setApprovedStudents] = useState<any[]>([]);
  const [loadingApprovedStudents, setLoadingApprovedStudents] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  
  // New state for additional database tables
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [developerResources, setDeveloperResources] = useState<any[]>([]);
  const [loadingDeveloperResources, setLoadingDeveloperResources] = useState(false);
  const [developerEvents, setDeveloperEvents] = useState<any[]>([]);
  const [loadingDeveloperEvents, setLoadingDeveloperEvents] = useState(false);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [loadingSponsorships, setLoadingSponsorships] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  // Blog rewards modal state
  const [showBlogRewardsModal, setShowBlogRewardsModal] = useState(false);
  const [blogRewardsList, setBlogRewardsList] = useState<any[]>([]);
  const [loadingBlogRewardsList, setLoadingBlogRewardsList] = useState(false);
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [cohortFilter, setCohortFilter] = useState<string | null>(null); // Filter by cohort
  
  // Event editing state
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
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
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendanceRecords, setLoadingAttendanceRecords] = useState(false);
  const [attendanceEventFilter, setAttendanceEventFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'students' | 'events' | 'mentorships' | 'attendance' | 'exam' | 'assignments'>('overview');
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  
  // Sidebar navigation structure
  const sidebarSections = [
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      subMenus: [
        { id: 'approved-students', label: 'Approved Students' },
        { id: 'pending-students', label: 'Pending Students' },
        { id: 'rejected-students', label: 'Rejected Students' },
        { id: 'assignments-submissions', label: 'Assignment Submissions' },
        { id: 'blog-submissions', label: 'Blog Submissions' },
        { id: 'blog-posts', label: 'Blog Posts' },
      ],
    },
    {
      id: 'cohorts',
      label: 'Cohorts',
      icon: BookOpen,
      subMenus: [
        { id: 'cohort-list', label: 'Cohort List' },
        { id: 'sessions', label: 'Sessions' },
        { id: 'cohort-analytics', label: 'Cohort Analytics' },
      ],
    },
    {
      id: 'content',
      label: 'Content & Resources',
      icon: Book,
      subMenus: [
        { id: 'assignments', label: 'Assignments' },
        { id: 'developer-resources', label: 'Developer Resources' },
        { id: 'developer-events', label: 'Developer Events' },
        { id: 'testimonials', label: 'Testimonials' },
      ],
    },
    {
      id: 'community',
      label: 'Community',
      icon: Handshake,
      subMenus: [
        { id: 'mentors', label: 'Mentors' },
        { id: 'sponsorships', label: 'Sponsorships' },
        { id: 'achievements', label: 'Achievements' },
      ],
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: Mail,
      subMenus: [
        { id: 'email-composition', label: 'Email Composition' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'events', label: 'Events' },
      ],
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: FileText,
      subMenus: [
        { id: 'final-exam-submissions', label: 'Final Exam Submissions' },
        { id: 'student-sats-rewards', label: 'Student Sats Rewards' },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: BarChart3,
      subMenus: [
        { id: 'upload-attendance', label: 'Upload Attendance' },
        { id: 'attendance-records', label: 'Attendance Records' },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      subMenus: [
        { id: 'admin-access', label: 'Admin Access' },
        { id: 'login-history', label: 'Login History' },
        { id: 'account-lockouts', label: 'Account Lockouts' },
        { id: 'session-management', label: 'Session Management' },
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
      'assignments-submissions': 'assignments',
      'blog-submissions': 'overview',
      'blog-posts': 'overview',
      'cohort-list': 'overview',
      'sessions': 'overview',
      'cohort-analytics': 'overview',
      'email-composition': 'overview',
      'calendar': 'overview',
      'events': 'overview',
      'final-exam-submissions': 'exam',
      'upload-attendance': 'attendance',
      'attendance-records': 'attendance',
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
  
  // Student Sats Rewards state
  const [studentSatsRewards, setStudentSatsRewards] = useState<any[]>([]);
  const [allSatsRewards, setAllSatsRewards] = useState<any[]>([]); // Store all fetched rewards for client-side filtering
  const [satsStatistics, setSatsStatistics] = useState<any>(null);
  const [loadingSatsRewards, setLoadingSatsRewards] = useState(false);
  const [satsError, setSatsError] = useState<string | null>(null);
  const [satsStatusFilter, setSatsStatusFilter] = useState<string>('all');
  const [satsTypeFilter, setSatsTypeFilter] = useState<string>('all');
  const [satsStudentFilter, setSatsStudentFilter] = useState<string>('all');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudentsList, setLoadingStudentsList] = useState(false);
  
  // Blog summary state (for blog posts with authors and sats)
  const [blogSummary, setBlogSummary] = useState<{
    blogs: any[];
    authors: any[];
    summary: {
      totalBlogs: number;
      totalAuthors: number;
      totalSats: number;
      categories: Record<string, number>;
      featuredBlogs: number;
      blogOfMonth: number;
    };
  } | null>(null);
  const [loadingBlogSummary, setLoadingBlogSummary] = useState(false);
  
  // Edit/Create reward modal state
  const [editingReward, setEditingReward] = useState<any | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    cohort_id: '',
    student_id: '',
    amount: '',
    reward_type: 'other',
    reason: '',
    status: 'pending',
  });
  const [savingReward, setSavingReward] = useState(false);
  const [filteredStudentsByCohort, setFilteredStudentsByCohort] = useState<any[]>([]);
  
  // Refs to prevent duplicate fetches
  const satsFetchingRef = useRef(false);
  const satsLastFetchKeyRef = useRef<string>('');
  const studentsListFetchedRef = useRef(false);
  const blogSummaryFetchedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const lastStudentsListFetchTimeRef = useRef<number>(0);
  const lastBlogSummaryFetchTimeRef = useRef<number>(0);
  const lastActiveSubMenuRef = useRef<string>('');
  const studentsListFetchingRef = useRef(false);
  const blogSummaryFetchingRef = useRef(false);
  const blogSummaryInitialLoadRef = useRef(true); // Use ref instead of state to prevent re-renders
  const fetchBlogSummaryRef = useRef<((forceRefresh?: boolean) => Promise<void>) | null>(null);
  const MIN_FETCH_INTERVAL = 1000; // Minimum 1 second between fetches
  
  // AbortControllers for canceling in-flight requests
  const blogSubmissionsAbortControllerRef = useRef<AbortController | null>(null);
  const blogPostsAbortControllerRef = useRef<AbortController | null>(null);
  
  // Flags to prevent duplicate simultaneous fetches
  const blogSubmissionsFetchingRef = useRef(false);
  const blogPostsFetchingRef = useRef(false);
  const blogPostsFetchedRef = useRef(false);
  const lastBlogSubmissionsFetchRef = useRef<number>(0);
  const lastBlogPostsFetchRef = useRef<number>(0);
  
  // Refs to store fetch functions to prevent useEffect dependency issues
  const fetchBlogSubmissionsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchBlogPostsRef = useRef<(() => Promise<void>) | null>(null);
  
  // Refs to store fetch functions to prevent useEffect loops
  const fetchAchievementsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchDeveloperResourcesRef = useRef<(() => Promise<void>) | null>(null);
  const fetchDeveloperEventsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchSponsorshipsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchTestimonialsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchMentorsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchAssignmentsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchApprovedStudentsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchAllStudentsRef = useRef<(() => Promise<void>) | null>(null);
  
  // Flags to prevent duplicate fetches for approved students and all students
  const approvedStudentsFetchedRef = useRef(false);
  const approvedStudentsFetchingRef = useRef(false);
  const lastApprovedStudentsFetchRef = useRef(0);
  const allStudentsFetchedRef = useRef(false);
  const allStudentsFetchingRef = useRef(false);
  
  // Flags to prevent duplicate simultaneous fetches for main sections
  const overviewFetchingRef = useRef(false);
  const applicationsFetchingRef = useRef(false);
  const lastApplicationsFetchRef = useRef<number>(0);
  const cohortsFetchingRef = useRef(false);
  const sessionsFetchingRef = useRef(false);
  const sessionsFetchedRef = useRef(false);
  const fetchSessionsRef = useRef<(() => Promise<void>) | null>(null);
  const eventsFetchingRef = useRef(false);
  const progressFetchingRef = useRef(false);
  const mentorshipsFetchingRef = useRef(false);
  const examAccessFetchingRef = useRef(false);
  const submissionsFetchingRef = useRef(false);
  const attendanceFetchingRef = useRef(false);
  const attendanceFetchedRef = useRef(false);
  const fetchAttendanceRecordsRef = useRef<(() => Promise<void>) | null>(null);
  
  // Refs to track if data has been fetched for each submenu (prevent duplicate fetches)
  const achievementsFetchedRef = useRef(false);
  const achievementsFetchingRef = useRef(false);
  const developerResourcesFetchedRef = useRef(false);
  const developerResourcesFetchingRef = useRef(false);
  const developerEventsFetchedRef = useRef(false);
  const developerEventsFetchingRef = useRef(false);
  const sponsorshipsFetchedRef = useRef(false);
  const sponsorshipsFetchingRef = useRef(false);
  const testimonialsFetchedRef = useRef(false);
  const testimonialsFetchingRef = useRef(false);
  const mentorsFetchedRef = useRef(false);
  const mentorsFetchingRef = useRef(false);
  const assignmentsFetchedRef = useRef(false);
  const assignmentsFetchingRef = useRef(false);
  
  // Refs to store current filter values (to avoid including them in callback dependencies)
  const satsStatusFilterRef = useRef<string>(satsStatusFilter);
  const satsTypeFilterRef = useRef<string>(satsTypeFilter);
  const satsStudentFilterRef = useRef<string>(satsStudentFilter);
  
  // Keep refs in sync with state
  useEffect(() => {
    satsStatusFilterRef.current = satsStatusFilter;
    satsTypeFilterRef.current = satsTypeFilter;
    satsStudentFilterRef.current = satsStudentFilter;
  }, [satsStatusFilter, satsTypeFilter, satsStudentFilter]);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'submitted' | 'graded'>('submitted');
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const [blogSubmissions, setBlogSubmissions] = useState<any[]>([]);
  const [loadingBlogSubmissions, setLoadingBlogSubmissions] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loadingBlogPosts, setLoadingBlogPosts] = useState(false);
  const [blogPostsFilter, setBlogPostsFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [blogPostsSearch, setBlogPostsSearch] = useState('');
  const [blogPostsCategoryFilter, setBlogPostsCategoryFilter] = useState<string>('all');
  const [expandedBlogPostId, setExpandedBlogPostId] = useState<string | null>(null);
  const [processingBlogPost, setProcessingBlogPost] = useState<string | null>(null);
  const [blogFilter, setBlogFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingBlog, setProcessingBlog] = useState<string | null>(null);
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null);
  const [awardingSats, setAwardingSats] = useState(false);
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

  // Load only essential data when authenticated
  const hasLoadedEssentialRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && admin && !hasLoadedEssentialRef.current) {
      hasLoadedEssentialRef.current = true;
      loadEssentialData();
    }
  }, [isAuthenticated, admin]);
  
  // Track previous activeTab/activeSubMenu to only load when actually changing
  const prevActiveTabRef = useRef<string | null>(null);
  const prevActiveSubMenuRefForSection = useRef<string | null>(null);
  
  // Load section-specific data when section becomes active
  useEffect(() => {
    if (!admin || !activeTab) {
      prevActiveTabRef.current = null;
      prevActiveSubMenuRefForSection.current = null;
      return;
    }
    
    // Only load if section actually changed (not on every render)
    const sectionChanged = prevActiveTabRef.current !== activeTab;
    const subMenuChanged = prevActiveSubMenuRefForSection.current !== activeSubMenu;
    
    if (sectionChanged || subMenuChanged) {
      prevActiveTabRef.current = activeTab;
      prevActiveSubMenuRefForSection.current = activeSubMenu;
      
      // Use setTimeout to ensure function is defined (runs after render)
      const timeoutId = setTimeout(() => {
        if (loadSectionDataRef.current) {
          loadSectionDataRef.current(activeTab, activeSubMenu || undefined);
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [admin, activeTab, activeSubMenu]);



  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit) => {
    try {
      // Add timeout to prevent hanging requests
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30 second timeout
      
      // Merge signals if one is provided in options
      let finalSignal = timeoutController.signal;
      if (options?.signal) {
        // Create a merged signal that aborts if either signal aborts
        const mergedController = new AbortController();
        const abort = () => mergedController.abort();
        timeoutController.signal.addEventListener('abort', abort);
        options.signal.addEventListener('abort', abort);
        finalSignal = mergedController.signal;
      }
      
      const res = await fetch(url, {
        ...options,
        signal: finalSignal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
    if (res.status === 401) {
      // Session expired - trigger session check to properly handle logout
      await checkSession();
      throw new Error('Unauthorized');
    }
    return res;
    } catch (error: any) {
      // Handle network errors, timeouts, and connection failures
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.message.includes('network')) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      if (error.message === 'Unauthorized') {
        throw error; // Re-throw auth errors
      }
      // Generic error
      throw new Error(error.message || 'Connection error. Please try again.');
    }
  }, [checkSession]);

  // Fetch students list for dropdown - fetches ALL students (not just blog authors)
  const fetchStudentsList = useCallback(async (cohortId?: string, updateFiltered?: boolean) => {
    if (!admin) {
      return;
    }
    
    // Prevent duplicate simultaneous fetches
    if (studentsListFetchingRef.current) {
      console.log('[Sats Rewards] Skipping fetchStudentsList - already fetching');
      return;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastStudentsListFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('[Sats Rewards] Skipping fetchStudentsList - rate limited');
      return;
    }
    
    console.log('[Sats Rewards] Starting fetchStudentsList', cohortId ? `for cohort ${cohortId}` : 'for all students');
    studentsListFetchingRef.current = true;
    lastStudentsListFetchTimeRef.current = now;
    
    try {
      setLoadingStudentsList(true);
      
      // Use the students/all API which supports cohort filtering
      let url = '/api/admin/students/all?limit=5000';
      if (cohortId && cohortId !== 'all' && cohortId !== '') {
        url += `&cohort_id=${cohortId}`;
      }
      
      const res = await fetchWithAuth(url);
      
      // Handle unauthorized access
      if (res.status === 401) {
        console.error('[Sats Rewards] Unauthorized access - admin session may have expired');
        setStudentsList([]);
        return;
      }
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch students';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Use default error message
        }
        console.error('[Sats Rewards] Failed to fetch students:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
        });
        setStudentsList([]);
        return;
      }
      
      const data = await res.json();
      if (data && Array.isArray(data.students)) {
        console.log(`[Sats Rewards] Successfully fetched ${data.students.length} students`);
        // Transform to match expected format
        const transformedStudents = data.students.map((student: any) => ({
          id: student.id,
          name: student.name || '',
          email: student.email || '',
          status: student.status || 'Active',
          cohortId: student.cohortId || null,
          cohortName: student.cohortName || null,
        }));
        setStudentsList(transformedStudents);
        // Mark as fetched only when fetching all students (not cohort-specific)
        if (!cohortId || cohortId === 'all' || cohortId === '') {
          studentsListFetchedRef.current = true;
          // Also update filteredStudentsByCohort if requested (e.g., when modal opens)
          if (updateFiltered) {
            setFilteredStudentsByCohort(transformedStudents);
          }
        }
      } else {
        console.warn('[Sats Rewards] Unexpected data format:', data);
        setStudentsList([]);
      }
    } catch (err: any) {
      // Handle Unauthorized error from fetchWithAuth
      if (err.message === 'Unauthorized') {
        console.error('[Sats Rewards] Unauthorized - session may have expired');
      } else {
        console.error('[Sats Rewards] Error fetching students:', err);
      }
      setStudentsList([]);
    } finally {
      setLoadingStudentsList(false);
      studentsListFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  // Fetch blog summary (blog posts with authors and sats) - separated from UI to prevent flickering
  const fetchBlogSummary = useCallback(async (forceRefresh: boolean = false) => {
    // Only fetch if submenu is active
    if (!admin || activeSubMenu !== 'student-sats-rewards') {
      console.log('[Blog Summary] Skipping - submenu not active');
      return;
    }
    
    // Prevent duplicate fetches unless forced refresh
    if (!forceRefresh) {
      if (blogSummaryFetchedRef.current) {
        console.log('[Blog Summary] Already fetched, skipping');
        return;
      }
      
      if (blogSummaryFetchingRef.current) {
        console.log('[Blog Summary] Already fetching, skipping');
        return;
      }
    }
    
    // Rate limiting - don't fetch if we just fetched recently (unless forced)
    if (!forceRefresh) {
      const now = Date.now();
      if (now - lastBlogSummaryFetchTimeRef.current < MIN_FETCH_INTERVAL) {
        console.log('[Blog Summary] Rate limited, skipping');
        return;
      }
    }
    
    console.log('[Blog Summary] Starting fetch', forceRefresh ? '(forced refresh)' : '');
    
    // Mark as fetching
    blogSummaryFetchingRef.current = true;
    lastBlogSummaryFetchTimeRef.current = Date.now();
    
    // Only show loading on initial load (prevents flickering on refetches)
    if (blogSummaryInitialLoadRef.current && !forceRefresh) {
      setLoadingBlogSummary(true);
    }
    
    try {
      // Fetch blog summary from API
      const res = await fetchWithAuth('/api/admin/blog/summary');
      
      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[Blog Summary] Rate limited');
          blogSummaryFetchingRef.current = false;
          if (blogSummaryInitialLoadRef.current) {
            setLoadingBlogSummary(false);
          }
          return;
        }
        
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch blog summary (${res.status})`);
      }
      
      const data = await res.json();
      
      if (data && typeof data === 'object') {
        // Update state atomically to prevent flickering
        setBlogSummary({
          blogs: data.blogs || [],
          authors: data.authors || [],
          summary: data.summary || {
            totalBlogs: 0,
            totalAuthors: 0,
            totalSats: 0,
            categories: {},
            featuredBlogs: 0,
            blogOfMonth: 0,
          },
        });
        
        // Mark as fetched and initial load complete
        blogSummaryFetchedRef.current = true;
        blogSummaryInitialLoadRef.current = false;
        
        console.log('[Blog Summary] Successfully fetched:', {
          totalBlogs: data.summary?.totalBlogs || 0,
          totalAuthors: data.summary?.totalAuthors || 0,
          totalSats: data.summary?.totalSats || 0,
        });
      } else {
        console.warn('[Blog Summary] Invalid data format');
        setBlogSummary(null);
        blogSummaryFetchedRef.current = true;
        blogSummaryInitialLoadRef.current = false;
      }
    } catch (err: any) {
      console.error('[Blog Summary] Error:', err.message || err);
      
      // Only reset fetched flag on error if it's a critical error
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        blogSummaryFetchedRef.current = false;
      }
      
      // Set empty summary on error
      setBlogSummary(null);
      blogSummaryInitialLoadRef.current = false;
    } finally {
      setLoadingBlogSummary(false);
      blogSummaryFetchingRef.current = false;
    }
  }, [admin, activeSubMenu, fetchWithAuth]);

  // Store the latest fetchBlogSummary in a ref so useEffect can use it without dependencies
  useEffect(() => {
    fetchBlogSummaryRef.current = fetchBlogSummary;
  }, [fetchBlogSummary]);

  // Fetch blog submissions when submenu becomes active
  useEffect(() => {
    if (!admin || activeSubMenu !== 'blog-submissions') {
      // Cancel any in-flight request when leaving submenu or logging out
      if (blogSubmissionsAbortControllerRef.current) {
        blogSubmissionsAbortControllerRef.current.abort();
        blogSubmissionsAbortControllerRef.current = null;
      }
      // Reset fetching flag and loading state
      blogSubmissionsFetchingRef.current = false;
      setLoadingBlogSubmissions(false);
      return;
    }
    
    // Only fetch if not already fetching
    if (!blogSubmissionsFetchingRef.current) {
      // Try to fetch immediately if ref is available
      if (fetchBlogSubmissionsRef.current) {
        console.log('[Blog Submissions] useEffect: Calling fetchBlogSubmissions');
        fetchBlogSubmissionsRef.current();
      } else {
        // If ref not available yet, wait a bit and try again
        console.log('[Blog Submissions] useEffect: Ref not available, waiting...');
        const timeout = setTimeout(() => {
          if (fetchBlogSubmissionsRef.current && !blogSubmissionsFetchingRef.current) {
            console.log('[Blog Submissions] useEffect: Calling fetchBlogSubmissions after timeout');
            fetchBlogSubmissionsRef.current();
          } else {
            console.warn('[Blog Submissions] useEffect: Still no ref or already fetching after timeout');
          }
        }, 100);
        
        return () => clearTimeout(timeout);
      }
    } else {
      console.log('[Blog Submissions] useEffect: Already fetching, skipping');
    }
    
    // Cleanup: cancel request if component unmounts or submenu changes
    return () => {
      if (blogSubmissionsAbortControllerRef.current) {
        blogSubmissionsAbortControllerRef.current.abort();
        blogSubmissionsAbortControllerRef.current = null;
      }
      blogSubmissionsFetchingRef.current = false;
    };
  }, [admin, activeSubMenu]);

  // Fetch blog posts when submenu becomes active
  useEffect(() => {
    if (!admin || activeSubMenu !== 'blog-posts') {
      // Cancel any in-flight request when leaving submenu or logging out
      if (blogPostsAbortControllerRef.current) {
        blogPostsAbortControllerRef.current.abort();
        blogPostsAbortControllerRef.current = null;
      }
      // Reset fetching flag and loading state
      blogPostsFetchingRef.current = false;
      setLoadingBlogPosts(false);
      return;
    }
    
    // Only fetch if not already fetching
    if (!blogPostsFetchingRef.current) {
      // Try to fetch immediately if ref is available
      if (fetchBlogPostsRef.current) {
        console.log('[Blog Posts] useEffect: Calling fetchBlogPosts');
        fetchBlogPostsRef.current();
      } else {
        // If ref not available yet, wait a bit and try again
        console.log('[Blog Posts] useEffect: Ref not available, waiting...');
        const timeoutId = setTimeout(() => {
          if (fetchBlogPostsRef.current && !blogPostsFetchingRef.current) {
            console.log('[Blog Posts] useEffect: Calling fetchBlogPosts after timeout');
            fetchBlogPostsRef.current();
          } else {
            console.warn('[Blog Posts] useEffect: Still no ref or already fetching after timeout');
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    } else {
      console.log('[Blog Posts] useEffect: Already fetching, skipping');
    }
    
    // Cleanup: cancel request if component unmounts or submenu changes
    return () => {
      if (blogPostsAbortControllerRef.current) {
        blogPostsAbortControllerRef.current.abort();
        blogPostsAbortControllerRef.current = null;
      }
      blogPostsFetchingRef.current = false;
    };
  }, [admin, activeSubMenu]);

  // Track previous submenu to only reset flags when actually changing
  const prevActiveSubMenuRef = useRef<string | null>(null);
  
  // Fetch new data when submenus become active (using refs to prevent loops)
  useEffect(() => {
    if (!admin) {
      // Reset all fetch flags when admin logs out
      achievementsFetchedRef.current = false;
      developerResourcesFetchedRef.current = false;
      developerEventsFetchedRef.current = false;
      sponsorshipsFetchedRef.current = false;
      testimonialsFetchedRef.current = false;
      mentorsFetchedRef.current = false;
      assignmentsFetchedRef.current = false;
      approvedStudentsFetchedRef.current = false;
      approvedStudentsFetchingRef.current = false;
      allStudentsFetchedRef.current = false;
      allStudentsFetchingRef.current = false;
      prevActiveSubMenuRef.current = null;
      return;
    }
    
    const currentSubMenu = activeSubMenu;
    const prevSubMenu = prevActiveSubMenuRef.current;
    
    // Only reset flags when submenu actually changes (not on every render)
    if (prevSubMenu !== currentSubMenu) {
      // Reset flags for the previous submenu only
      if (prevSubMenu === 'achievements') {
        achievementsFetchedRef.current = false;
        achievementsFetchingRef.current = false;
      }
      if (prevSubMenu === 'developer-resources') {
        developerResourcesFetchedRef.current = false;
        developerResourcesFetchingRef.current = false;
      }
      if (prevSubMenu === 'developer-events') {
        developerEventsFetchedRef.current = false;
        developerEventsFetchingRef.current = false;
      }
      if (prevSubMenu === 'sponsorships') {
        sponsorshipsFetchedRef.current = false;
        sponsorshipsFetchingRef.current = false;
      }
      if (prevSubMenu === 'testimonials') {
        testimonialsFetchedRef.current = false;
        testimonialsFetchingRef.current = false;
      }
      if (prevSubMenu === 'mentors') {
        mentorsFetchedRef.current = false;
        mentorsFetchingRef.current = false;
      }
      if (prevSubMenu === 'assignments') {
        assignmentsFetchedRef.current = false;
        assignmentsFetchingRef.current = false;
      }
      if (prevSubMenu === 'approved-students') {
        approvedStudentsFetchedRef.current = false;
        approvedStudentsFetchingRef.current = false;
      }
      if (false) { // Removed student-database
        allStudentsFetchedRef.current = false;
        allStudentsFetchingRef.current = false;
      }
      // Reset sessions fetch flags when leaving sessions submenu to allow fresh fetch on return
      if (prevSubMenu === 'sessions' && currentSubMenu !== 'sessions') {
        sessionsFetchedRef.current = false;
        sessionsFetchingRef.current = false;
      }
      
      prevActiveSubMenuRef.current = currentSubMenu;
    }
    
    // Only fetch if submenu changed and data hasn't been fetched yet
    if (currentSubMenu === 'achievements' && !achievementsFetchedRef.current && fetchAchievementsRef.current) {
      achievementsFetchedRef.current = true;
      fetchAchievementsRef.current();
    } else if (currentSubMenu === 'developer-resources' && !developerResourcesFetchedRef.current && fetchDeveloperResourcesRef.current) {
      developerResourcesFetchedRef.current = true;
      fetchDeveloperResourcesRef.current();
    } else if (currentSubMenu === 'developer-events' && !developerEventsFetchedRef.current && fetchDeveloperEventsRef.current) {
      developerEventsFetchedRef.current = true;
      fetchDeveloperEventsRef.current();
    } else if (currentSubMenu === 'sponsorships' && !sponsorshipsFetchedRef.current && fetchSponsorshipsRef.current) {
      sponsorshipsFetchedRef.current = true;
      fetchSponsorshipsRef.current();
    } else if (currentSubMenu === 'testimonials' && !testimonialsFetchedRef.current && fetchTestimonialsRef.current) {
      testimonialsFetchedRef.current = true;
      fetchTestimonialsRef.current();
    } else if (currentSubMenu === 'mentors' && !mentorsFetchedRef.current && fetchMentorsRef.current) {
      mentorsFetchedRef.current = true;
      fetchMentorsRef.current();
    } else if (currentSubMenu === 'assignments' && !assignmentsFetchedRef.current && fetchAssignmentsRef.current) {
      assignmentsFetchedRef.current = true;
      fetchAssignmentsRef.current();
    } else if (currentSubMenu === 'approved-students' && fetchApprovedStudentsRef.current) {
      // Fetch approved students when submenu is active
      // The fetchApprovedStudents function handles rate limiting internally
      if (!approvedStudentsFetchingRef.current) {
        fetchApprovedStudentsRef.current();
      }
    } else if ((currentSubMenu === 'pending-students' || currentSubMenu === 'rejected-students')) {
      // Fetch applications when pending or rejected students submenu is active
      // The fetchApplications function handles rate limiting internally
      if (!applicationsFetchingRef.current) {
        fetchApplications();
      }
    } else if (currentSubMenu === 'sessions' && fetchSessionsRef.current) {
      // Fetch sessions when sessions submenu is active (only if not already fetched or fetching)
      if (!sessionsFetchedRef.current && !sessionsFetchingRef.current) {
        fetchSessionsRef.current();
      }
    }
  }, [admin, activeSubMenu]);

  // Fetch students list and blog summary when submenu becomes active (only once)
  useEffect(() => {
    // Only fetch if submenu actually changed to 'student-sats-rewards'
    if (admin && activeSubMenu === 'student-sats-rewards') {
      // Only reset and fetch if this is a new submenu (not the same one)
      if (lastActiveSubMenuRef.current !== 'student-sats-rewards') {
        console.log('[Sats Rewards] Submenu activated, resetting fetch flags');
        
        // Reset fetch flags when submenu changes
        studentsListFetchedRef.current = false;
        studentsListFetchingRef.current = false;
        blogSummaryFetchedRef.current = false;
        blogSummaryFetchingRef.current = false;
        // Reset initial load flag to show loading on first fetch
        blogSummaryInitialLoadRef.current = true;
        blogSummaryFetchedRef.current = false;
        // Reset sats fetch key to ensure it fetches
        satsLastFetchKeyRef.current = '';
        satsFetchingRef.current = false;
        lastActiveSubMenuRef.current = 'student-sats-rewards';
        
        // Fetch students list first
        fetchStudentsList();
        
        // Fetch blog summary after a short delay (only once)
        const blogSummaryTimeout = setTimeout(() => {
          if (fetchBlogSummaryRef.current) {
            fetchBlogSummaryRef.current(false); // false = don't force refresh
          }
        }, 500);
        
        // Fetch sats rewards when submenu becomes active
        // Try to fetch immediately if ref is available, otherwise use timeout
        let satsRewardsTimeout: NodeJS.Timeout | null = null;
        if (fetchStudentSatsRewardsRef.current) {
          fetchStudentSatsRewardsRef.current();
        } else {
          satsRewardsTimeout = setTimeout(() => {
            if (fetchStudentSatsRewardsRef.current) {
              fetchStudentSatsRewardsRef.current();
            }
          }, 300);
        }
        
        // Cleanup timeout if component unmounts or submenu changes
        return () => {
          clearTimeout(blogSummaryTimeout);
          if (satsRewardsTimeout) {
            clearTimeout(satsRewardsTimeout);
          }
        };
      } else {
        console.log('[Sats Rewards] Submenu already active');
        // Still fetch if data hasn't been loaded yet
        if (satsLastFetchKeyRef.current !== 'fetched' && !satsFetchingRef.current) {
          console.log('[Sats Rewards] Data not loaded yet, fetching now');
          if (fetchStudentSatsRewardsRef.current) {
            fetchStudentSatsRewardsRef.current();
          }
        }
      }
    } else {
      // Reset flags when submenu is not active
      if (lastActiveSubMenuRef.current === 'student-sats-rewards') {
        console.log('[Sats Rewards] Submenu deactivated, resetting flags');
        studentsListFetchedRef.current = false;
        studentsListFetchingRef.current = false;
        blogSummaryFetchedRef.current = false;
        blogSummaryFetchingRef.current = false;
        lastActiveSubMenuRef.current = activeSubMenu || '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, activeSubMenu]);

  // Apply filters to rewards (client-side filtering)
  const applyFiltersToRewards = useCallback((rewards: any[]) => {
    if (!rewards || rewards.length === 0) {
      setStudentSatsRewards([]);
      return;
    }
    
    let filtered = [...rewards];
    
    // Apply status filter
    const statusFilter = satsStatusFilterRef.current;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.status === statusFilter);
    }
    
    // Apply type filter
    const typeFilter = satsTypeFilterRef.current;
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.reward_type === typeFilter);
    }
    
    // Apply student filter
    const studentFilter = satsStudentFilterRef.current;
    if (studentFilter && studentFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.student_id === studentFilter);
    }
    
    setStudentSatsRewards(filtered);
  }, []);

  // Memoize filter change handlers - update both state and refs, then apply filters to existing data
  const handleSatsStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSatsStatusFilter(value);
    satsStatusFilterRef.current = value;
    // Apply filter to already-fetched data (no new API call)
    applyFiltersToRewards(allSatsRewards);
  }, [allSatsRewards, applyFiltersToRewards]);

  const handleSatsTypeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSatsTypeFilter(value);
    satsTypeFilterRef.current = value;
    // Apply filter to already-fetched data (no new API call)
    applyFiltersToRewards(allSatsRewards);
  }, [allSatsRewards, applyFiltersToRewards]);

  const handleSatsStudentFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSatsStudentFilter(value);
    satsStudentFilterRef.current = value;
    // Apply filter to already-fetched data (no new API call)
    applyFiltersToRewards(allSatsRewards);
  }, [allSatsRewards, applyFiltersToRewards]);

  // Memoize computed statistics values
  const satsTotalAmount = useMemo(() => {
    if (!satsStatistics) return 0;
    return (satsStatistics.totalPaid || 0) + (satsStatistics.totalPending || 0);
  }, [satsStatistics]);

  // Memoize formatRewardType function
  const formatRewardType = useCallback((type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Fetch student sats rewards - simplified and working version
  const fetchStudentSatsRewards = useCallback(async () => {
    // Only fetch when admin is logged in and submenu is active
    if (!admin || activeSubMenu !== 'student-sats-rewards') {
      return;
    }
    
    // Prevent duplicate fetches
    if (satsFetchingRef.current) {
      return;
    }
    
    // Check if we already fetched (only fetch once unless manually refreshed)
    // But allow refresh if data is empty (might have been cleared)
    if (satsLastFetchKeyRef.current === 'fetched') {
      // Data already fetched, just apply current filters
      if (allSatsRewards.length > 0) {
        applyFiltersToRewards(allSatsRewards);
      }
      return;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return;
    }
    
    satsFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      setLoadingSatsRewards(true);
      setSatsError(null);
      
      // Fetch all rewards (no filters in API call - filter client-side)
      const url = '/api/admin/sats';
      const res = await fetchWithAuth(url);
      
      // Handle rate limiting
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        setSatsError(errorData.error || 'Too many requests. Please wait a moment and try again.');
        satsFetchingRef.current = false;
        setTimeout(() => {
          satsFetchingRef.current = false;
        }, 2000);
        return;
      }
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch sats rewards';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      
      if (data && typeof data === 'object' && Array.isArray(data.rewards)) {
        const rewards = data.rewards;
        
        // Store all rewards
        setAllSatsRewards(rewards);
        
        // Apply filters to show filtered results
        applyFiltersToRewards(rewards);
        
        // Store statistics
        setSatsStatistics(data.statistics || null);
        
        // Mark as fetched
        satsLastFetchKeyRef.current = 'fetched';
      } else {
        // No data or invalid format
        setAllSatsRewards([]);
        setStudentSatsRewards([]);
        setSatsStatistics(null);
        satsLastFetchKeyRef.current = 'fetched';
      }
    } catch (err: any) {
      console.error('[Sats Rewards] Error:', err);
      
      let errorMessage = 'Failed to load sats rewards. Please try again.';
      if (err?.message) {
        if (err.message.includes('Unable to connect') || err.message.includes('Connection error')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setSatsError(errorMessage);
      setAllSatsRewards([]);
      setStudentSatsRewards([]);
      setSatsStatistics(null);
      satsLastFetchKeyRef.current = '';
    } finally {
      setLoadingSatsRewards(false);
      satsFetchingRef.current = false;
    }
  }, [admin, activeSubMenu, fetchWithAuth, applyFiltersToRewards]);

  // Store fetchStudentSatsRewards in a ref to prevent useEffect loops
  const fetchStudentSatsRewardsRef = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    fetchStudentSatsRewardsRef.current = fetchStudentSatsRewards;
  }, [fetchStudentSatsRewards]);


  // Fetch sats rewards data when submenu becomes active (only once)
  // NOTE: This is consolidated with the main useEffect above to prevent duplicate fetches
  // The fetchStudentSatsRewards is called from the student-sats-rewards useEffect (line 880)

  // Handle opening edit modal
  const handleEditReward = useCallback((reward: any) => {
    setEditingReward(reward);
    const totalAmount = (reward.amount_paid || 0) + (reward.amount_pending || 0);
    
    // For editing, we'll start with no cohort filter - user can select if needed
    setRewardForm({
      cohort_id: '',
      student_id: reward.student_id || '',
      amount: totalAmount > 0 ? totalAmount.toString() : '',
      reward_type: reward.reward_type || 'other',
      reason: reward.reason || '',
      status: reward.status || 'pending',
    });
    
    // Show all students initially
    setFilteredStudentsByCohort(studentsList);
    setShowRewardModal(true);
  }, [studentsList]);

  // Handle opening create modal
  const handleCreateReward = useCallback(() => {
    setEditingReward(null);
    setRewardForm({
      cohort_id: '',
      student_id: satsStudentFilter !== 'all' ? satsStudentFilter : '',
      amount: '',
      reward_type: 'other',
      reason: '',
      status: 'pending',
    });
    // Fetch all students when modal opens
    setFilteredStudentsByCohort([]);
    fetchStudentsList(undefined, true); // Fetch all students initially and update filtered list
    setShowRewardModal(true);
  }, [satsStudentFilter, fetchStudentsList]);

  // Filter students by cohort - optimized to fetch directly from API
  const filterStudentsByCohort = useCallback(async (cohortId: string) => {
    if (!cohortId || cohortId === 'all' || cohortId === '') {
      // Show all students when "All Cohorts" is selected
      if (studentsListFetchedRef.current && studentsList.length > 0) {
        // Use already fetched list if available
        setFilteredStudentsByCohort(studentsList);
      } else {
        // Fetch all students and update filtered list when done
        await fetchStudentsList(undefined, true); // Pass true to update filteredStudentsByCohort
      }
      return;
    }

    // Fetch students for this specific cohort directly from API
    try {
      setLoadingStudentsList(true);
      const url = `/api/admin/students/all?limit=5000&cohort_id=${cohortId}`;
      const res = await fetchWithAuth(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.students)) {
          const cohortStudents = data.students.map((student: any) => ({
            id: student.id,
            name: student.name || '',
            email: student.email || '',
            status: student.status || 'Active',
            cohortId: student.cohortId || null,
            cohortName: student.cohortName || null,
          }));
          setFilteredStudentsByCohort(cohortStudents);
          console.log(`[Reward Modal] Fetched ${cohortStudents.length} students for cohort ${cohortId}`);
        } else {
          setFilteredStudentsByCohort([]);
        }
      } else {
        console.error('[Reward Modal] Failed to fetch cohort students');
        setFilteredStudentsByCohort([]);
      }
    } catch (err) {
      console.error('Error fetching cohort students:', err);
      setFilteredStudentsByCohort([]);
    } finally {
      setLoadingStudentsList(false);
    }
  }, [studentsList, fetchStudentsList, fetchWithAuth]);

  // Handle cohort selection change - optimized to fetch students by cohort
  const handleCohortChange = useCallback((cohortId: string) => {
    setRewardForm({ ...rewardForm, cohort_id: cohortId, student_id: '' });
    // Fetch students for the selected cohort
    filterStudentsByCohort(cohortId);
  }, [rewardForm, filterStudentsByCohort]);

  // Handle saving reward (create or update)
  const handleSaveReward = useCallback(async () => {
    if (!rewardForm.student_id) {
      setNotification({ type: 'error', message: 'Please select a student' });
      return;
    }

    if (!rewardForm.amount || parseInt(rewardForm.amount) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (!rewardForm.reason) {
      setNotification({ type: 'error', message: 'Please select a reason' });
      return;
    }

    setSavingReward(true);
    try {
      const amount = parseInt(rewardForm.amount) || 0;
      const payload = {
        student_id: rewardForm.student_id,
        amount_paid: rewardForm.status === 'paid' ? amount : 0,
        amount_pending: rewardForm.status === 'pending' ? amount : 0,
        reward_type: rewardForm.reward_type,
        reason: rewardForm.reason,
        status: rewardForm.status,
      };

      let res;
      if (editingReward) {
        // Update existing reward
        res = await fetchWithAuth(`/api/admin/sats/${editingReward.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new reward
        res = await fetchWithAuth('/api/admin/sats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save reward');
      }

      setNotification({
        type: 'success',
        message: editingReward ? 'Reward updated successfully' : 'Reward created successfully',
      });
      setShowRewardModal(false);
      // Refresh data after mutation
      satsLastFetchKeyRef.current = '';
      satsFetchingRef.current = false;
      setTimeout(() => {
        fetchStudentSatsRewards();
      }, 500);
    } catch (err: any) {
      console.error('Error saving reward:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save reward. Please try again.',
      });
    } finally {
      setSavingReward(false);
    }
  }, [rewardForm, editingReward, fetchWithAuth, fetchStudentSatsRewards]);

  // Handle quick status update
  const handleQuickStatusUpdate = useCallback(async (rewardId: string, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/sats/${rewardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setNotification({
        type: 'success',
        message: 'Status updated successfully',
      });
      // Refresh data to get updated status
      satsLastFetchKeyRef.current = '';
      satsFetchingRef.current = false;
      setTimeout(() => {
        fetchStudentSatsRewards();
      }, 300);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update status. Please try again.',
      });
    }
  }, [fetchWithAuth, fetchStudentSatsRewards]);

  // Handle delete reward
  const handleDeleteReward = useCallback(async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/admin/sats/${rewardId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete reward');
      }

      setNotification({
        type: 'success',
        message: 'Reward deleted successfully',
      });
      // Refresh data after deletion
      satsLastFetchKeyRef.current = '';
      satsFetchingRef.current = false;
      setTimeout(() => {
        fetchStudentSatsRewards();
      }, 300);
    } catch (err: any) {
      console.error('Error deleting reward:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete reward. Please try again.',
      });
    }
  }, [fetchWithAuth, fetchStudentSatsRewards]);

  // Track which data has been loaded to prevent duplicate fetches
  const dataLoadedRef = useRef<Set<string>>(new Set());
  
  // Load only essential data on initial authentication (overview, cohorts for navigation)
  const loadEssentialData = async () => {
    if (dataLoadedRef.current.has('essential')) {
      return; // Already loaded
    }
    
    setLoading(true);
    setError(null);
    try {
      // Only fetch essential data needed for navigation and overview
      await Promise.allSettled([
        fetchOverview(),
        fetchCohorts(), // Needed for cohort filters across sections
      ]);
      // Mark both essential flag and individual sections as loaded
      dataLoadedRef.current.add('essential');
      dataLoadedRef.current.add('overview'); // Overview is part of essential data
      // Note: cohorts don't need tracking as they're used across all sections
    } catch (err: any) {
      // Silently fail - user can refresh page if needed
      console.error('[Admin] Error loading essential data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load section-specific data only when section becomes active
  // This function will be defined after fetch functions are available
  const loadSectionDataRef = useRef<((section: string, subMenu?: string) => Promise<void>) | null>(null);

  const fetchOverview = async () => {
    // Prevent duplicate simultaneous fetches
    if (overviewFetchingRef.current) {
      return;
    }
    
    try {
      overviewFetchingRef.current = true;
      const res = await fetchWithAuth('/api/admin/overview');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load overview');
      setOverview(data.summary);
    } finally {
      overviewFetchingRef.current = false;
    }
  };

  const fetchApplications = async () => {
    // Prevent duplicate simultaneous fetches
    if (applicationsFetchingRef.current) {
      console.log('[Applications] Already fetching, skipping duplicate call');
      return;
    }
    
    // Rate limiting - don't fetch if we just fetched recently (within 2 seconds)
    const now = Date.now();
    if (lastApplicationsFetchRef.current > 0 && (now - lastApplicationsFetchRef.current) < 2000) {
      console.log('[Applications] Rate limited, skipping (last fetch was', now - lastApplicationsFetchRef.current, 'ms ago)');
      return;
    }
    
    try {
      applicationsFetchingRef.current = true;
      lastApplicationsFetchRef.current = now;
      
      console.log('[Applications] Starting fetch');
      const res = await fetchWithAuth('/api/admin/applications');
      
      // Handle rate limiting from API
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        console.warn('[Applications] Rate limited by API:', errorData.error || 'Too many requests');
        // Wait a bit longer before allowing next fetch
        lastApplicationsFetchRef.current = Date.now() + 5000; // Add 5 seconds penalty
        applicationsFetchingRef.current = false;
        return;
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }
      
      console.log('[Applications] Successfully fetched', data.applications?.length || 0, 'applications');
      // Log status breakdown for debugging
      if (data.applications && data.applications.length > 0) {
        const statusCounts = data.applications.reduce((acc: any, app: any) => {
          const status = app.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        console.log('[Applications] Status breakdown:', statusCounts);
      }
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('[Applications] Error:', err);
      // If it's a rate limit error, add penalty to last fetch time
      if (err.message?.includes('Too many requests') || err.message?.includes('rate limit')) {
        lastApplicationsFetchRef.current = Date.now() + 5000; // Add 5 seconds penalty
      }
      setApplications([]);
    } finally {
      applicationsFetchingRef.current = false;
    }
  };

  const fetchCohorts = async () => {
    // Prevent duplicate simultaneous fetches
    if (cohortsFetchingRef.current) {
      return;
    }
    
    try {
      cohortsFetchingRef.current = true;
      const res = await fetchWithAuth('/api/cohorts');
      const data = await res.json();
      if (data.cohorts) setCohorts(data.cohorts);
      // Don't throw if cohorts missing - it's not critical
    } catch (err) {
      // Silently fail for cohorts - not critical
      setCohorts([]);
    } finally {
      cohortsFetchingRef.current = false;
    }
  };

  const fetchAttendanceRecords = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (attendanceFetchingRef.current) {
      console.log('[Attendance Records] Already fetching, skipping duplicate call');
      return;
    }
    
    try {
      attendanceFetchingRef.current = true;
      setLoadingAttendanceRecords(true);
      
      console.log('[Attendance Records] Starting fetch');
      const res = await fetchWithAuth('/api/admin/attendance');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      
      const data = await res.json();
      console.log('[Attendance Records] Successfully fetched', data.records?.length || 0, 'records');
      setAttendanceRecords(data.records || []);
      attendanceFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Attendance Records] Error:', err);
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendanceRecords(false);
      attendanceFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  // Set ref after function is defined
  fetchAttendanceRecordsRef.current = fetchAttendanceRecords;

  const fetchSessions = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate concurrent fetches - check and set flag atomically
    if (sessionsFetchingRef.current) {
      console.log('[Sessions] Skipping fetch - already fetching');
      return;
    }
    
    // Set fetching flag immediately to prevent concurrent calls
    sessionsFetchingRef.current = true;
    setLoadingSessions(true);
    
    try {
      console.log('[Sessions] Starting fetch');
      const res = await fetchWithAuth('/api/sessions?admin=true');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      if (data.sessions) {
        setAllSessions(data.sessions || []);
        console.log(`[Sessions] Fetched ${data.sessions.length} sessions`);
        sessionsFetchedRef.current = true;
      } else {
        setAllSessions([]);
        sessionsFetchedRef.current = true;
      }
    } catch (err: any) {
      console.error('[Sessions] Error:', err);
      setAllSessions([]);
      // Reset fetched flag on error so it can retry
      sessionsFetchedRef.current = false;
    } finally {
      setLoadingSessions(false);
      sessionsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);
  
  // Update ref whenever function changes
  fetchSessionsRef.current = fetchSessions;

  const fetchEvents = async () => {
    // Prevent duplicate simultaneous fetches
    if (eventsFetchingRef.current) {
      return;
    }
    
    try {
      eventsFetchingRef.current = true;
      const res = await fetchWithAuth('/api/events');
      const data = await res.json();
      if (data.events) setEvents(data.events);
      // Don't throw if events missing - it's not critical
    } catch (err) {
      // Silently fail for events - not critical
      setEvents([]);
    } finally {
      eventsFetchingRef.current = false;
    }
  };

  const fetchProgress = async () => {
    // Prevent duplicate simultaneous fetches
    if (progressFetchingRef.current) {
      return;
    }
    
    try {
      progressFetchingRef.current = true;
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
    } finally {
      progressFetchingRef.current = false;
    }
  };

  const fetchMentorships = async () => {
    // Prevent duplicate simultaneous fetches
    if (mentorshipsFetchingRef.current) {
      return;
    }
    
    try {
      mentorshipsFetchingRef.current = true;
      const res = await fetchWithAuth('/api/admin/mentorships');
      const data = await res.json();
      if (data.applications) setMentorships(data.applications);
    } finally {
      mentorshipsFetchingRef.current = false;
    }
  };

  const fetchExamAccess = async () => {
    // Prevent duplicate simultaneous fetches
    if (examAccessFetchingRef.current) {
      return;
    }
    
    try {
      examAccessFetchingRef.current = true;
      setLoadingExamAccess(true);
      const res = await fetchWithAuth('/api/admin/exam/access-list');
      const data = await res.json();
      if (data.students) setExamAccessList(data.students);
    } catch (err) {
      console.error('Error fetching exam access:', err);
    } finally {
      setLoadingExamAccess(false);
      examAccessFetchingRef.current = false;
    }
  };


  const fetchSubmissions = async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (submissionsFetchingRef.current) {
      return;
    }
    
    try {
      submissionsFetchingRef.current = true;
      setLoadingSubmissions(true);
      const res = await fetchWithAuth(`/api/admin/assignments/submissions?email=${encodeURIComponent(admin.email)}&status=${submissionFilter === 'all' ? 'all' : submissionFilter}`);
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
      dataLoadedRef.current.add('assignments-submissions');
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
      submissionsFetchingRef.current = false;
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

  // Fetch functions for new database tables
  const fetchAchievements = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (achievementsFetchingRef.current) {
      return;
    }
    
    try {
      achievementsFetchingRef.current = true;
      setLoadingAchievements(true);
      const res = await fetchWithAuth('/api/admin/achievements');
      if (!res.ok) throw new Error('Failed to fetch achievements');
      const data = await res.json();
      setAchievements(data.achievements || []);
      achievementsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Achievements] Error:', err.message || err);
      setAchievements([]);
      achievementsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingAchievements(false);
      achievementsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchDeveloperResources = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (developerResourcesFetchingRef.current) {
      return;
    }
    
    try {
      developerResourcesFetchingRef.current = true;
      setLoadingDeveloperResources(true);
      const res = await fetchWithAuth('/api/admin/developer-resources');
      if (!res.ok) throw new Error('Failed to fetch developer resources');
      const data = await res.json();
      setDeveloperResources(data.resources || []);
      developerResourcesFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Developer Resources] Error:', err.message || err);
      setDeveloperResources([]);
      developerResourcesFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingDeveloperResources(false);
      developerResourcesFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchDeveloperEvents = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (developerEventsFetchingRef.current) {
      return;
    }
    
    try {
      developerEventsFetchingRef.current = true;
      setLoadingDeveloperEvents(true);
      const res = await fetchWithAuth('/api/admin/developer-events');
      if (!res.ok) throw new Error('Failed to fetch developer events');
      const data = await res.json();
      setDeveloperEvents(data.events || []);
      developerEventsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Developer Events] Error:', err.message || err);
      setDeveloperEvents([]);
      developerEventsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingDeveloperEvents(false);
      developerEventsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchSponsorships = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (sponsorshipsFetchingRef.current) {
      return;
    }
    
    try {
      sponsorshipsFetchingRef.current = true;
      setLoadingSponsorships(true);
      const res = await fetchWithAuth('/api/admin/sponsorships');
      if (!res.ok) throw new Error('Failed to fetch sponsorships');
      const data = await res.json();
      setSponsorships(data.sponsorships || []);
      sponsorshipsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Sponsorships] Error:', err.message || err);
      setSponsorships([]);
      sponsorshipsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingSponsorships(false);
      sponsorshipsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchTestimonials = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (testimonialsFetchingRef.current) {
      return;
    }
    
    try {
      testimonialsFetchingRef.current = true;
      setLoadingTestimonials(true);
      const res = await fetchWithAuth('/api/admin/testimonials');
      if (!res.ok) throw new Error('Failed to fetch testimonials');
      const data = await res.json();
      setTestimonials(data.testimonials || []);
      testimonialsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Testimonials] Error:', err.message || err);
      setTestimonials([]);
      testimonialsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingTestimonials(false);
      testimonialsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchMentors = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (mentorsFetchingRef.current) {
      return;
    }
    
    try {
      mentorsFetchingRef.current = true;
      setLoadingMentors(true);
      const res = await fetchWithAuth('/api/admin/mentors');
      if (!res.ok) throw new Error('Failed to fetch mentors');
      const data = await res.json();
      setMentors(data.mentors || []);
      mentorsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Mentors] Error:', err.message || err);
      setMentors([]);
      mentorsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingMentors(false);
      mentorsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchAssignments = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (assignmentsFetchingRef.current) {
      return;
    }
    
    try {
      assignmentsFetchingRef.current = true;
      setLoadingAssignments(true);
      const res = await fetchWithAuth('/api/admin/assignments');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAssignments(data.assignments || []);
      assignmentsFetchedRef.current = true;
    } catch (err: any) {
      console.error('[Assignments] Error:', err.message || err);
      setAssignments([]);
      assignmentsFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoadingAssignments(false);
      assignmentsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);

  const fetchBlogSubmissions = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    const now = Date.now();
    if (blogSubmissionsFetchingRef.current) {
      console.log('[Blog Submissions] Already fetching, skipping duplicate call');
      return;
    }
    
    // Rate limiting - don't fetch if we just fetched recently (within 2 seconds)
    if (lastBlogSubmissionsFetchRef.current > 0 && (now - lastBlogSubmissionsFetchRef.current) < 2000) {
      console.log('[Blog Submissions] Rate limited, skipping (last fetch was', now - lastBlogSubmissionsFetchRef.current, 'ms ago)');
      return;
    }
    
    // Mark as fetching
    blogSubmissionsFetchingRef.current = true;
    lastBlogSubmissionsFetchRef.current = now;
    
    // Cancel any in-flight request
    if (blogSubmissionsAbortControllerRef.current) {
      blogSubmissionsAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    blogSubmissionsAbortControllerRef.current = abortController;
    
    try {
      setLoadingBlogSubmissions(true);
      
      // Fetch all submissions, then filter client-side
      const res = await fetchWithAuth('/api/admin/blog?type=submissions', {
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        blogSubmissionsFetchingRef.current = false;
        return;
      }
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch blog submissions';
        let errorDetails: any = null;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (parseError) {
          // Response might not be JSON
          console.error('[Blog Submissions] Failed to parse error response:', parseError);
        }
        console.error('[Blog Submissions] API error:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
          details: errorDetails,
        });
        setBlogSubmissions([]);
        setLoadingBlogSubmissions(false);
        blogSubmissionsFetchingRef.current = false;
        return;
      }
      
      const data = await res.json();
      
      // Check again if request was aborted after async operations
      if (abortController.signal.aborted) {
        blogSubmissionsFetchingRef.current = false;
        setLoadingBlogSubmissions(false);
        return;
      }
      
      if (data && Array.isArray(data.submissions)) {
        setBlogSubmissions(data.submissions);
      } else {
        console.warn('[Blog Submissions] Invalid data format:', data);
        setBlogSubmissions([]);
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        blogSubmissionsFetchingRef.current = false;
        setLoadingBlogSubmissions(false);
        return;
      }
      console.error('[Blog Submissions] Error:', err);
      setBlogSubmissions([]);
      setLoadingBlogSubmissions(false);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoadingBlogSubmissions(false);
      }
      // Clear the abort controller if it's the current one
      if (blogSubmissionsAbortControllerRef.current === abortController) {
        blogSubmissionsAbortControllerRef.current = null;
      }
      // Clear fetching flag
      blogSubmissionsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);
  
  // Update ref immediately after function definition
  fetchBlogSubmissionsRef.current = fetchBlogSubmissions;

  const fetchBlogPosts = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    const now = Date.now();
    if (blogPostsFetchingRef.current) {
      console.log('[Blog Posts] Already fetching, skipping duplicate call');
      return;
    }
    
    // Rate limiting - don't fetch if we just fetched recently (within 2 seconds)
    if (lastBlogPostsFetchRef.current > 0 && (now - lastBlogPostsFetchRef.current) < 2000) {
      console.log('[Blog Posts] Rate limited, skipping (last fetch was', now - lastBlogPostsFetchRef.current, 'ms ago)');
      return;
    }
    
    // Mark as fetching
    blogPostsFetchingRef.current = true;
    lastBlogPostsFetchRef.current = now;
    
    // Cancel any in-flight request
    if (blogPostsAbortControllerRef.current) {
      blogPostsAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    blogPostsAbortControllerRef.current = abortController;
    
    try {
      setLoadingBlogPosts(true);
      console.log('[Blog Posts] Starting fetch to /api/admin/blog?type=posts');
      const res = await fetchWithAuth('/api/admin/blog?type=posts', {
        signal: abortController.signal,
      });
      
      console.log('[Blog Posts] Response received. Status:', res.status, 'OK:', res.ok);
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log('[Blog Posts] Request was aborted');
        blogPostsFetchingRef.current = false;
        return;
      }
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch blog posts';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('[Blog Posts] Failed to parse error response:', parseError);
        }
        console.error('[Blog Posts] API error:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
        });
        setBlogPosts([]);
        setLoadingBlogPosts(false);
        blogPostsFetchingRef.current = false;
        return;
      }
      
      const data = await res.json();
      console.log('[Blog Posts] Parsed JSON data:', data);
      
      // Check again if request was aborted after async operations
      if (abortController.signal.aborted) {
        console.log('[Blog Posts] Request was aborted after JSON parse');
        blogPostsFetchingRef.current = false;
        setLoadingBlogPosts(false);
        return;
      }
      
      if (data && Array.isArray(data.posts)) {
        console.log('[Blog Posts] Successfully fetched', data.posts.length, 'posts');
        setBlogPosts(data.posts);
        blogPostsFetchedRef.current = true;
      } else {
        console.warn('[Blog Posts] Invalid data format. Expected data.posts array.');
        console.warn('[Blog Posts] Received data:', data);
        console.warn('[Blog Posts] Data type:', typeof data);
        console.warn('[Blog Posts] Data keys:', data ? Object.keys(data) : 'null');
        setBlogPosts([]);
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        blogPostsFetchingRef.current = false;
        setLoadingBlogPosts(false);
        return;
      }
      console.error('[Blog Posts] Error:', err);
      setBlogPosts([]);
      setLoadingBlogPosts(false);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoadingBlogPosts(false);
      }
      // Clear the abort controller if it's the current one
      if (blogPostsAbortControllerRef.current === abortController) {
        blogPostsAbortControllerRef.current = null;
      }
      // Clear fetching flag
      blogPostsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);
  
  // Update ref immediately after function definition
  fetchBlogPostsRef.current = fetchBlogPosts;

  // Store fetch functions in refs to prevent useEffect dependency issues
  useEffect(() => {
    fetchBlogSubmissionsRef.current = fetchBlogSubmissions;
  }, [fetchBlogSubmissions]);

  useEffect(() => {
    fetchBlogPostsRef.current = fetchBlogPosts;
  }, [fetchBlogPosts]);

  const handleApproveBlog = async (submissionId: string) => {
    if (!admin) {
      console.error('[Approve Blog] No admin session');
      alert('You must be logged in as admin to approve blogs');
      return;
    }
    
    console.log('[Approve Blog] Starting approval for submission:', submissionId);
    setProcessingBlog(submissionId);
    
    try {
      console.log('[Approve Blog] Calling API...');
      const res = await fetchWithAuth('/api/admin/blog/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          isFeatured: false,
          isBlogOfMonth: false,
        }),
      });
      
      console.log('[Approve Blog] API response status:', res.status);
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[Approve Blog] Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
      
      const data = await res.json();
      console.log('[Approve Blog] API response data:', data);
      
      if (!res.ok) {
        console.error('[Approve Blog] API error:', data);
        throw new Error(data.error || `Failed to approve blog (${res.status})`);
      }
      
      // Show success message with sats reward info
      let message = data.message || 'Blog approved and published!';
      if (data.satsAwarded) {
        message += `\n\n✓ ${data.satsAmount || 2000} sats awarded to author (pending payment)`;
      } else if (data.satsError) {
        message += `\n\n⚠ Warning: ${data.satsError}`;
      }
      alert(message);
      
      console.log('[Approve Blog] Success! Refreshing data...');
      
      // Refresh blog submissions list (force refresh to bypass guards)
      blogSubmissionsFetchingRef.current = false;
      lastBlogSubmissionsFetchRef.current = 0;
      await fetchBlogSubmissions();
      
      // Refresh blog posts list to show the newly created post
      blogPostsFetchingRef.current = false;
      lastBlogPostsFetchRef.current = 0;
      await fetchBlogPosts();
      
      // Also refresh sats rewards if that section is active
      if (activeSubMenu === 'student-sats-rewards') {
        satsLastFetchKeyRef.current = '';
        satsFetchingRef.current = false;
        // Force refresh blog summary after blog approval
        setTimeout(() => {
          fetchStudentSatsRewards();
          fetchBlogSummary(true); // true = force refresh
        }, 500);
      }
      
      console.log('[Approve Blog] Done!');
    } catch (err: any) {
      console.error('[Approve Blog] Error:', err);
      const errorMessage = err.message || 'Failed to approve blog';
      alert(`Error: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setProcessingBlog(null);
    }
  };

  const handleUpdateBlogPost = async (postId: string, updates: any) => {
    if (!admin) return;
    setProcessingBlogPost(postId);
    try {
      const res = await fetchWithAuth('/api/admin/blog/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update blog post');
      
      alert(data.message || 'Blog post updated successfully!');
      
      // Refresh blog posts list
      await fetchBlogPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to update blog post');
    } finally {
      setProcessingBlogPost(null);
    }
  };

  // Fetch approved students
  const fetchApprovedStudents = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate fetches - check both flags
    if (approvedStudentsFetchingRef.current) {
      console.log('[Approved Students] Already fetching, skipping duplicate call');
      return;
    }
    
    // Rate limiting - don't fetch if we just fetched recently (within 5 seconds)
    const now = Date.now();
    if (lastApprovedStudentsFetchRef.current > 0 && (now - lastApprovedStudentsFetchRef.current) < 5000) {
      console.log('[Approved Students] Rate limited, skipping (last fetch was', now - lastApprovedStudentsFetchRef.current, 'ms ago)');
      return;
    }
    
    // If already fetched and within rate limit window, skip
    if (approvedStudentsFetchedRef.current && (now - lastApprovedStudentsFetchRef.current) < 5000) {
      console.log('[Approved Students] Already fetched recently, skipping');
      return;
    }
    
    console.log('[Approved Students] Starting fetch');
    approvedStudentsFetchingRef.current = true;
    lastApprovedStudentsFetchRef.current = now;
    setLoadingApprovedStudents(true);
    
    try {
      const res = await fetchWithAuth('/api/admin/students/approved');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch approved students: ${res.status}`);
      }
      const data = await res.json();
      console.log(`[Approved Students] Received ${data.students?.length || 0} students from API`);
      setApprovedStudents(data.students || []);
      approvedStudentsFetchedRef.current = true;
      console.log('[Approved Students] Fetch completed successfully');
    } catch (err: any) {
      console.error('[Approved Students] Error:', err);
      console.error('[Approved Students] Error details:', err.message);
      setApprovedStudents([]);
      // Reset fetched flag on error so it can retry
      approvedStudentsFetchedRef.current = false;
    } finally {
      setLoadingApprovedStudents(false);
      approvedStudentsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);
  
  // Update ref whenever function changes
  fetchApprovedStudentsRef.current = fetchApprovedStudents;

  // Fetch all students (applications + students table)
  const fetchAllStudents = useCallback(async () => {
    if (!admin) return;
    
    // Prevent duplicate simultaneous fetches
    if (allStudentsFetchingRef.current) {
      console.log('[All Students] Skipping fetch - already fetching');
      return;
    }
    
    console.log('[All Students] Starting fetch');
    allStudentsFetchedRef.current = true;
    allStudentsFetchingRef.current = true;
    setLoadingAllStudents(true);
    
    try {
      const res = await fetchWithAuth('/api/admin/students/all');
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch all students: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('[All Students] API response:', { 
        studentsCount: data.students?.length || 0, 
        total: data.total,
        hasMore: data.hasMore 
      });
      setAllStudents(data.students || []);
      console.log('[All Students] Fetch completed successfully, count:', data.students?.length || 0);
    } catch (err: any) {
      console.error('[All Students] Error:', err);
      setAllStudents([]);
      // Reset fetched flag on error so it can retry
      allStudentsFetchedRef.current = false;
    } finally {
      setLoadingAllStudents(false);
      allStudentsFetchingRef.current = false;
    }
  }, [admin, fetchWithAuth]);
  
  // Update ref whenever function changes
  fetchAllStudentsRef.current = fetchAllStudents;

  // Store fetch functions in refs to prevent useEffect loops (must be after ALL function definitions)
  // Note: fetchApprovedStudents and fetchAllStudents refs are updated directly after their definitions above
  useEffect(() => {
    fetchAchievementsRef.current = fetchAchievements;
    fetchDeveloperResourcesRef.current = fetchDeveloperResources;
    fetchDeveloperEventsRef.current = fetchDeveloperEvents;
    fetchSponsorshipsRef.current = fetchSponsorships;
    fetchTestimonialsRef.current = fetchTestimonials;
    fetchMentorsRef.current = fetchMentors;
    fetchAssignmentsRef.current = fetchAssignments;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAwardSatsRetroactively = async () => {
    if (!admin) return;
    
    const confirmed = confirm(
      'This will award sats to all students who have approved blog posts but don\'t have sats rewards yet.\n\n' +
      'Do you want to continue?'
    );
    
    if (!confirmed) return;
    
    setAwardingSats(true);
    try {
      const res = await fetchWithAuth('/api/admin/blog/award-sats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to award sats');
      }
      
      // Show detailed results
      const message = 
        `${data.message}\n\n` +
        `Details:\n` +
        `- Processed: ${data.processed} blog posts\n` +
        `- Created: ${data.created} rewards\n` +
        `- Skipped: ${data.skipped} (already have rewards or no profile)\n` +
        (data.errors && data.errors.length > 0 
          ? `\nErrors: ${data.errors.length}\n${data.errors.map((e: any) => `  • ${e.title}: ${e.error}`).join('\n')}`
          : '');
      
      alert(message);
      
      // Refresh sats rewards if that section is active
      if (activeSubMenu === 'student-sats-rewards') {
        satsLastFetchKeyRef.current = '';
        satsFetchingRef.current = false;
        // Force refresh blog summary after awarding sats
        setTimeout(() => {
          fetchStudentSatsRewards();
          fetchBlogSummary(true); // true = force refresh
        }, 500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to award sats retroactively');
    } finally {
      setAwardingSats(false);
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
      // Refresh blog submissions list
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
    // Fetch all events (not just live-class) for attendance upload
    try {
      const res = await fetchWithAuth('/api/admin/events/all');
      const data = await res.json();
      if (data.events) {
        // Transform to match the expected format
        const transformedEvents = data.events.map((event: any) => ({
          id: event.id,
          name: event.title || event.name || 'Untitled Event',
          start_time: event.date || event.start_time || null,
          type: event.type || 'community',
          cohort_id: event.cohortId || null,
        }));
        setLiveClassEvents(transformedEvents);
      }
    } catch (err) {
      console.error('Error fetching events for attendance:', err);
      setLiveClassEvents([]);
    }
  };

  // Fetch attendance data when attendance section is accessed
  // This useEffect is placed here after fetchAttendanceRecords and fetchLiveClassEvents are defined
  useEffect(() => {
    if (admin && activeSection === 'attendance' && (activeSubMenu === 'upload-attendance' || activeSubMenu === 'attendance-records')) {
      // Reset fetch flag to allow fresh data
      if (!attendanceFetchedRef.current || !dataLoadedRef.current.has('attendance-records')) {
        attendanceFetchedRef.current = false;
        if (fetchAttendanceRecordsRef.current) {
          fetchAttendanceRecordsRef.current();
        }
        fetchLiveClassEvents(); // Needed for event dropdown
        // Fetch sessions for dropdown (only if not already fetched or fetching)
        if (!sessionsFetchedRef.current && !sessionsFetchingRef.current && fetchSessionsRef.current) {
          fetchSessionsRef.current();
        }
        dataLoadedRef.current.add('attendance-records');
      }
    }
  }, [admin, activeSection, activeSubMenu]);
  
  // Define loadSectionData after all fetch functions are available
  const loadSectionData = async (section: string, subMenu?: string) => {
    if (!admin) return; // Don't load if not authenticated
    
    const dataKey = subMenu ? `${section}-${subMenu}` : section;
    
    try {
      switch (section) {
        case 'overview':
          // Skip if already loaded
          if (dataLoadedRef.current.has('overview')) {
            return;
          }
          await fetchOverview();
          dataLoadedRef.current.add('overview');
          break;
          
        case 'applications':
          // Always fetch applications when applications section is active
          // This ensures pending/rejected students have fresh data
          // Don't skip - always refresh to get latest application statuses
          await fetchApplications();
          dataLoadedRef.current.add('applications');
          break;
          
        case 'students':
          // Student data is loaded by specific submenu hooks (approved-students, etc.)
          // These are handled by the useEffect hooks that watch activeSubMenu
          if (subMenu === 'approved-students') {
            if (!approvedStudentsFetchedRef.current && !approvedStudentsFetchingRef.current && fetchApprovedStudentsRef.current) {
              // Reset flags to allow fresh fetch
              approvedStudentsFetchedRef.current = false;
              approvedStudentsFetchingRef.current = false;
              await fetchApprovedStudentsRef.current();
              dataLoadedRef.current.add('approved-students');
            }
          }
          break;
          
        case 'events':
          await fetchEvents();
          dataLoadedRef.current.add('events');
          break;
          
        case 'mentorships':
          await fetchMentorships();
          dataLoadedRef.current.add('mentorships');
          break;
          
        case 'attendance':
          // Load attendance data based on submenu
          if (subMenu === 'upload-attendance' || subMenu === 'attendance-records') {
            // Always fetch fresh data for attendance records
            if (!dataLoadedRef.current.has('attendance-records')) {
              await fetchAttendanceRecords();
              await fetchLiveClassEvents(); // Needed for event dropdown
              dataLoadedRef.current.add('attendance-records');
            }
          }
          break;
          
        case 'exam':
          await fetchExamAccess();
          dataLoadedRef.current.add('exam-access');
          break;
          
        case 'assignments':
          if (subMenu === 'assignments-submissions') {
            await fetchSubmissions();
            // fetchSubmissions already adds 'assignments-submissions' to dataLoadedRef
          }
          break;
          
        case 'cohorts':
          // Ensure cohorts are loaded (they're in essential data, but refresh if needed)
          if (!dataLoadedRef.current.has('cohorts')) {
            await fetchCohorts();
            dataLoadedRef.current.add('cohorts');
          }
          if (subMenu === 'sessions') {
            if (!sessionsFetchedRef.current && !sessionsFetchingRef.current && fetchSessionsRef.current) {
              await fetchSessionsRef.current();
              dataLoadedRef.current.add('sessions');
            }
          }
          // cohort-analytics needs both cohorts and progress data
          if (subMenu === 'cohort-analytics') {
            if (!dataLoadedRef.current.has('progress')) {
              await fetchProgress();
              dataLoadedRef.current.add('progress');
            }
          }
          break;
      }
    } catch (err: any) {
      console.error(`[Admin] Error loading ${dataKey}:`, err);
      // Don't mark as loaded on error so it can retry
    }
  };
  
  // Store in ref for useEffect (already defined above at line 2290)
  loadSectionDataRef.current = loadSectionData;

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
      // Refresh attendance records to show newly uploaded data
      attendanceFetchedRef.current = false;
      fetchAttendanceRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to upload attendance');
    } finally {
      setUploadingAttendance(false);
    }
  };

  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include', // Ensure cookies are sent and received
      });
      
      // Parse JSON response directly (don't use text() first)
      let data: any = null;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        // Try to get text for debugging
        const text = await res.text().catch(() => '');
        console.error('Response text:', text);
        setAuthError('Invalid response from server. Please try again.');
        setLoginLoading(false);
        return;
      }
      
      if (!res.ok) {
        // Handle error response
        const errorMsg = data?.error || `Login failed (${res.status} ${res.statusText})`;
        const errorDetails = data?.details ? `: ${data.details}` : '';
        setAuthError(`${errorMsg}${errorDetails}`);
        
        // Only log meaningful error data - avoid logging empty objects
        if (data && typeof data === 'object' && Object.keys(data).length > 0 && data.error) {
          // Only log if we have an actual error message
          const errorInfo: any = {
            error: data.error,
            status: res.status,
            statusText: res.statusText
          };
          if (data.details) errorInfo.details = data.details;
          if (data.requestId) errorInfo.requestId = data.requestId;
          console.error('Admin login error:', errorInfo);
        }
        // Don't log if data is null, empty, or has no error field
        setLoginLoading(false);
        return;
      }
      
      // Check if login was successful
      if (data && data.success) {
        setLoginForm({ email: '', password: '' }); // Clear form
        setAuthError(null); // Clear any previous errors
        
        // Check if password change is required
        if (data.requiresPasswordChange) {
          // Redirect to password change page
          window.location.href = '/admin/change-password';
          return;
        }
        
        // Wait a bit longer for cookie to be set, then check session
        // The cookie needs time to be set by the browser
        setTimeout(() => {
          checkSession().then((success) => {
            if (!success) {
              console.warn('Session check failed after login, retrying...');
              // Retry once more after another short delay
              setTimeout(() => {
                checkSession();
              }, 200);
            }
          });
        }, 200); // Increased from 100ms to 200ms
      } else {
        const errorMsg = data?.error || 'Login failed';
        setAuthError(errorMsg);
        console.error('Admin login failed:', { success: data?.success, error: errorMsg, data });
      }
    } catch (err: any) {
      console.error('Login request error:', err);
      setAuthError(err.message || 'Network error. Please check your connection and try again.');
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
          message += `\n\nApproval email sent to ${email}`;
        } else {
          // Always show email status, even if not sent
          if (data.emailError) {
            message += `\n\nEmail not sent: ${data.emailError}`;
            message += `\n\nCheck server console for details.`;
          } else {
            message += `\n\nEmail status unknown - check server console for details.`;
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
          message += `\n\nRejection email sent to ${email}`;
        } else if (data.emailError) {
          message += `\n\nEmail not sent: ${data.emailError}`;
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
      console.log('[Filtered Applications] Filter:', filter, 'Total applications:', applications.length);
      const filtered = applications.filter((app) => {
        // Filter by status (case-insensitive comparison)
        const appStatus = app.status?.toLowerCase() || '';
        const filterStatus = filter?.toLowerCase() || '';
        const statusMatch = filter === 'all' || appStatus === filterStatus;
        // Filter by cohort
        const cohortMatch = !cohortFilter || app.preferred_cohort_id === cohortFilter;
        const matches = statusMatch && cohortMatch;
        if (filter === 'pending' && matches) {
          console.log('[Filtered Applications] Found pending application:', app.email, 'Status:', app.status);
        }
        return matches;
      });
      console.log('[Filtered Applications] Filtered count:', filtered.length, 'for filter:', filter);
      
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
      // Force refresh sessions by resetting the fetched flag
      sessionsFetchedRef.current = false;
      if (fetchSessionsRef.current) {
        await fetchSessionsRef.current();
      }
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
      // Force refresh sessions by resetting the fetched flag
      sessionsFetchedRef.current = false;
      if (fetchSessionsRef.current) {
        await fetchSessionsRef.current();
      }
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
        {loginLoading && <LoadingSpinner overlay />}
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 pr-10 text-sm text-zinc-100 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <a
                href="/admin/forgot-password"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                Forgot password?
              </a>
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
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} 
        w-64
        fixed lg:static
        bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 z-50 h-screen
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {!sidebarCollapsed && (
          <div>
              <h2 className="text-lg font-semibold text-zinc-50">Admin Panel</h2>
              <p className="text-xs text-zinc-500 truncate">{admin.email}</p>
          </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Close menu"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
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
                  {section.icon && (
                    <section.icon className="h-5 w-5 flex-shrink-0" />
                  )}
                  {!sidebarCollapsed && <span className="flex-1 text-left">{section.label}</span>}
                  {!sidebarCollapsed && (
                    <span className={`transition-transform ${isSectionActive ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                  )}
                </button>
                
                {/* Sub-menus */}
                {(!sidebarCollapsed || mobileMenuOpen) && isSectionActive && (
                  <div className="mt-1 ml-4 space-y-0.5 border-l border-zinc-800 pl-3">
                    {section.subMenus.map((subMenu) => (
                      <button
                        key={subMenu.id}
                        type="button"
                        onClick={() => {
                          handleSidebarNavigation(section.id, subMenu.id);
                          setMobileMenuOpen(false);
                        }}
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
      <main className="flex-1 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            ☰
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-zinc-50 truncate">
              {activeSubMenu && activeSection
                ? (() => {
                    const section = sidebarSections.find(s => s.id === activeSection);
                    const subMenu = section?.subMenus?.find(sm => sm.id === activeSubMenu);
                    return subMenu?.label || 'Admin';
                  })()
                : 'Admin'}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-300 transition"
            title="Logout"
          >
            🚪
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
            {/* Breadcrumbs - Hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-2 text-sm text-zinc-500 overflow-x-auto">
              {getBreadcrumbs().map((crumb, index) => (
                <div key={index} className="flex items-center gap-2 flex-shrink-0">
                  {index > 0 && <span>›</span>}
                  <span className={index === getBreadcrumbs().length - 1 ? 'text-zinc-300 font-medium' : ''}>
                    {crumb.label}
                  </span>
                </div>
              ))}
            </nav>
            
            {/* Page Header - Desktop only */}
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-zinc-50">
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
                {(() => {
                  // Show only relevant buttons based on active submenu
                  let buttonsToShow: ('all' | 'pending' | 'approved' | 'rejected')[] = [];
                  
                  if (activeSubMenu === 'rejected-students') {
                    // Only show "rejected" button for rejected students section
                    buttonsToShow = ['rejected'];
                  } else if (activeSubMenu === 'pending-students') {
                    // Only show "pending" button for pending students section
                    buttonsToShow = ['pending'];
                  } else {
                    // Show all buttons for applications tab
                    buttonsToShow = ['all', 'pending', 'approved', 'rejected'];
                  }
                  
                  return buttonsToShow.map((f) => (
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
                  ));
                })()}
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
                {applications.length === 0 ? (
                  <>
                    <p className="text-lg mb-2">No applications found</p>
                    <p className="text-sm">Applications will appear here once students submit their applications.</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">No {filter !== 'all' ? filter : ''} applications found{cohortFilter ? ` for selected cohort` : ''}.</p>
                    <p className="text-sm mt-2">Total applications: {applications.length}</p>
                    <p className="text-xs mt-2 text-zinc-500">
                      Pending: {applications.filter(a => (a.status?.toLowerCase() || '') === 'pending').length} | 
                      Approved: {applications.filter(a => (a.status?.toLowerCase() || '') === 'approved').length} | 
                      Rejected: {applications.filter(a => (a.status?.toLowerCase() || '') === 'rejected').length}
                    </p>
                  </>
                )}
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
            {(activeSubMenu === 'email-composition' || activeSubMenu === 'calendar' || activeSubMenu === 'events') && (
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

                {/* Events Section - Create and List Together */}
                {activeSubMenu === 'events' && (
                  <div className="space-y-6">
                    {/* Create/Edit Event Form */}
                    <EventForm 
                      event={editingEvent}
                      onSuccess={() => {
                        // Clear editing state and refresh events list after successful creation/update
                        setEditingEvent(null);
                        if (window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('refreshEventsList'));
                        }
                      }}
                      onCancel={() => {
                        setEditingEvent(null);
                      }}
                    />
                    
                    {/* List Events */}
                    <EventsList 
                      onRefresh={() => {
                        // Optionally refresh other components
                        console.log('Events list refreshed');
                      }}
                      onEdit={(event) => {
                        // Transform event to match EventForm's expected format
                        setEditingEvent({
                          id: event.id,
                          name: event.name,
                          type: event.type,
                          start_time: event.start_time,
                          end_time: event.end_time,
                          description: event.description,
                          link: event.link,
                          recording_url: event.recording_url,
                          image_url: event.image_url,
                          image_alt_text: event.image_alt_text || null,
                          cohort_id: event.cohort_id,
                        });
                        // Scroll to form
                        setTimeout(() => {
                          const formElement = document.querySelector('[data-event-form]');
                          if (formElement) {
                            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    />
                  </div>
                )}
              </>
            )}


            {/* Approved Students - List of approved students only */}
            {activeSubMenu === 'approved-students' && (
              <>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <h3 className="text-xl font-semibold text-zinc-50">Approved Students</h3>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Students who have been approved and enrolled in the academy
                      </p>
                    </div>
                  </div>
                  
                  {loadingApprovedStudents ? (
                    <div className="text-center py-12 text-zinc-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-2"></div>
                      <p>Loading students...</p>
                    </div>
                  ) : approvedStudents.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <p className="text-lg mb-2">No approved students found</p>
                      <p className="text-sm">Approved students will appear here once applications are approved.</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="mb-6">
                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 inline-block">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {approvedStudents.length}
                          </div>
                          <div className="text-sm text-zinc-400">Approved Students</div>
                        </div>
                      </div>

                      {/* Students List */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Name</th>
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Email</th>
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Phone</th>
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Country</th>
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Cohort</th>
                              <th className="text-left p-3 text-xs font-semibold text-zinc-400 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvedStudents.map((student) => (
                              <tr key={student.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                                <td className="p-3 text-sm text-zinc-200">{student.name || 'N/A'}</td>
                                <td className="p-3 text-sm text-zinc-300">{student.email || 'N/A'}</td>
                                <td className="p-3 text-sm text-zinc-400">{student.phone || 'N/A'}</td>
                                <td className="p-3 text-sm text-zinc-400">{student.country || 'N/A'}</td>
                                <td className="p-3 text-sm text-zinc-400">{student.cohortName || 'N/A'}</td>
                                <td className="p-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    student.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                    student.status === 'Inactive' ? 'bg-red-500/20 text-red-400' :
                                    'bg-zinc-500/20 text-zinc-400'
                                  }`}>
                                    {student.status || 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Assignment Submissions Section */}
            {(activeSubMenu === 'assignments-submissions' || activeSubMenu === 'blog-submissions' || activeTab === 'assignments') && (
              <>
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
                {activeSubMenu === 'blog-submissions' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-50" />
                <h2 className="text-xl font-semibold text-zinc-50">Blog Submissions</h2>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Review and approve blog submissions from students. 
                <span className="text-zinc-500"> When approved, they automatically become "Blog Posts" (published on the website).</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setBlogFilter(f);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    blogFilter === f
                      ? 'bg-purple-400 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} (
                  {Array.isArray(blogSubmissions) ? blogSubmissions.filter((s) => {
                    if (f === 'all') return true;
                    return s?.status === f;
                  }).length : 0})
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6 space-y-4">
            <p className="text-sm text-zinc-400">
            Review and approve student blog submissions. Approved posts will be published and authors will receive sats rewards.
          </p>
            
            {/* Workflow Explanation */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-zinc-200" />
                <h3 className="text-sm font-semibold text-zinc-200">Blog Submission Workflow</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Status */}
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-lg">⏳</span>
                    <span className="text-sm font-semibold text-yellow-300">Pending Review</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Submission is waiting for admin review. No action has been taken yet.
                  </p>
                </div>
                
                {/* Approved Status */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-lg">✓</span>
                    <span className="text-sm font-semibold text-green-300">Approved</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Blog post created and published</li>
                    <li>• Author receives 2,000 sats (pending payment)</li>
                    <li>• Post visible on blog page</li>
                    <li>• Submission marked as approved</li>
                  </ul>
                </div>
                
                {/* Rejected Status */}
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400 text-lg">✗</span>
                    <span className="text-sm font-semibold text-red-300">Rejected</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• No blog post created</li>
                    <li>• No sats awarded</li>
                    <li>• Rejection reason recorded</li>
                    <li>• Submission marked as rejected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {loadingBlogSubmissions ? (
            <div className="text-center py-8 text-zinc-400">Loading blog submissions...</div>
          ) : !Array.isArray(blogSubmissions) || blogSubmissions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No blog submissions found.</div>
          ) : (() => {
            const filteredSubmissions = blogSubmissions.filter((s) => {
              if (blogFilter === 'all') return true;
              return s?.status === blogFilter;
            });
            return filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">No {blogFilter} blog submissions found.</div>
          ) : (
            <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
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
                        {submission.content ? (submission.content.length > 300 ? submission.content.substring(0, 300) + '...' : submission.content) : 'No content available'}
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

                    {/* Status-specific information boxes */}
                    {submission.status === 'approved' && (
                      <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 text-lg">✓</span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-green-300 mb-2">This submission was approved</p>
                            <ul className="text-xs text-green-200/80 space-y-1">
                              <li>• Blog post created and published on the website</li>
                              <li>• Author received 2,000 sats (pending payment)</li>
                              <li>• Post is now visible to all visitors</li>
                              <li>• Submission marked as approved</li>
                            </ul>
                            <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center justify-between">
                              <p className="text-xs text-green-300/60">
                                View published post in the "Blog Posts" section
                              </p>
                              <a
                                href="/blog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-400 hover:text-green-300 underline"
                              >
                                View Blog →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {submission.status === 'rejected' && (
                      <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400 text-lg">✗</span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-red-300 mb-2">This submission was rejected</p>
                            <ul className="text-xs text-red-200/80 space-y-1">
                              <li>• No blog post was created</li>
                              <li>• No sats were awarded</li>
                              <li>• Submission marked as rejected</li>
                    {submission.rejection_reason && (
                                <li className="mt-2 pt-2 border-t border-red-500/20">
                                  <span className="font-medium">Rejection Reason:</span> {submission.rejection_reason}
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}


                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <span>Submitted: {new Date(submission.created_at).toLocaleString()}</span>
                      {submission.reviewed_at && (
                        <span>• Reviewed: {new Date(submission.reviewed_at).toLocaleString()}</span>
                      )}
                      {submission.reviewed_by && (
                        <span>• Reviewed by: Admin</span>
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('[Approve Button] Clicked for submission:', submission.id);
                              if (processingBlog === submission.id) {
                                console.log('[Approve Button] Already processing, ignoring click');
                                return;
                              }
                              handleApproveBlog(submission.id);
                            }}
                            disabled={processingBlog === submission.id || submission.status !== 'pending'}
                            className="flex-1 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title={submission.status !== 'pending' ? 'This submission has already been reviewed' : 'Approve and publish this blog post'}
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
            );
          })()}
            </div>
          )}

        {/* Blog Posts Section */}
                {activeSubMenu === 'blog-posts' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-50" />
                <h2 className="text-xl font-semibold text-zinc-50">Blog Posts</h2>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Published blog posts (created when submissions are approved). 
                <span className="text-zinc-500"> Note: This is different from "Blog Submissions" which shows pending/awaiting review posts.</span>
              </p>
            </div>
        </div>

          {/* Search and Filters */}
          {Array.isArray(blogPosts) && blogPosts.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search by title, author, or content..."
                  value={blogPostsSearch}
                  onChange={(e) => setBlogPostsSearch(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <select
                  value={blogPostsCategoryFilter}
                  onChange={(e) => setBlogPostsCategoryFilter(e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(blogPosts.map((p: any) => p.category).filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setBlogPostsFilter(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      blogPostsFilter === f
                        ? 'bg-purple-400 text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} (
                    {blogPosts.filter((p) => {
                      if (f === 'all') return true;
                      return p?.status === f;
                    }).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingBlogPosts ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-2"></div>
              <p>Loading blog posts...</p>
            </div>
          ) : !Array.isArray(blogPosts) || blogPosts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="max-w-md mx-auto">
                <p className="text-lg mb-2 font-semibold text-zinc-300">No blog posts found</p>
                <p className="text-sm mb-4">Blog posts are created automatically when you approve a submission in the "Blog Submissions" section.</p>
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-4 w-4 text-blue-300" />
                    <p className="text-xs font-semibold text-blue-300">Difference between Blog Submissions and Blog Posts:</p>
                  </div>
                  <div className="text-xs text-blue-200/80 space-y-2">
                    <div>
                      <p className="font-medium text-blue-300">Blog Submissions:</p>
                      <p className="pl-2">• Posts waiting for your review (pending/approved/rejected)</p>
                      <p className="pl-2">• Students submit here</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-300">Blog Posts:</p>
                      <p className="pl-2">• Published posts (created when you approve a submission)</p>
                      <p className="pl-2">• These appear on the public website</p>
                    </div>
                  </div>
                </div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSubMenu('blog-submissions');
                  }}
                  className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300 underline"
                >
                  Go to Blog Submissions →
                </a>
              </div>
            </div>
          ) : (() => {
            // Apply filters
            let filteredPosts = blogPosts.filter((p) => {
              // Status filter
              if (blogPostsFilter !== 'all' && p?.status !== blogPostsFilter) return false;
              
              // Category filter
              if (blogPostsCategoryFilter !== 'all' && p?.category !== blogPostsCategoryFilter) return false;
              
              // Search filter
              if (blogPostsSearch.trim()) {
                const searchLower = blogPostsSearch.toLowerCase();
                const matchesTitle = p?.title?.toLowerCase().includes(searchLower);
                const matchesAuthor = p?.author_name?.toLowerCase().includes(searchLower) || 
                                     p?.author_email?.toLowerCase().includes(searchLower);
                const matchesContent = p?.content?.toLowerCase().includes(searchLower) ||
                                      p?.excerpt?.toLowerCase().includes(searchLower);
                if (!matchesTitle && !matchesAuthor && !matchesContent) return false;
              }
              
              return true;
            });

            return filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <p className="text-lg mb-2">No blog posts match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-zinc-400 mb-2">
                  Showing {filteredPosts.length} of {blogPosts.length} blog posts
                </div>
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900/60 transition"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base font-semibold text-zinc-50 break-words">
                            {post.title}
                          </h3>
                          {post.is_featured && (
                            <span className="rounded-full border px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30 whitespace-nowrap">
                              <Sparkles className="h-3 w-3 inline mr-1" /> Featured
                            </span>
                          )}
                          {post.is_blog_of_month && (
                            <span className="rounded-full border px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 whitespace-nowrap">
                              <Trophy className="h-3 w-3 inline mr-1" /> Blog of Month
                            </span>
                          )}
                          {post._isFromSubmission && (
                            <span className="rounded-full border px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30 whitespace-nowrap" title="This post came from an approved submission">
                              <FileText className="h-3 w-3 inline mr-1" /> From Submission
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {post.category}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${
                              post.status === 'published'
                                ? 'text-green-400 bg-green-500/10 border-green-500/30'
                                : post.status === 'archived'
                                ? 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                            }`}
                          >
                            {post.status === 'published' ? 'Published' : post.status === 'archived' ? 'Archived' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2">
                          <span className="font-medium text-zinc-300">{post.author_name}</span>
                          {post.author_email && ` • ${post.author_email}`}
                          {post.author_role && ` • ${post.author_role}`}
                          {post.author_country && ` • ${post.author_country}`}
                        </p>
                      </div>
                    </div>

                    {post.excerpt && (
                      <div className="mb-4 rounded bg-zinc-800/50 p-3">
                        <p className="text-xs font-medium text-zinc-300 mb-1">Excerpt:</p>
                        <p className="text-sm text-zinc-200">
                          {expandedBlogPostId === post.id ? post.excerpt : (post.excerpt.length > 200 ? post.excerpt.substring(0, 200) + '...' : post.excerpt)}
                        </p>
                      </div>
                    )}

                    {expandedBlogPostId === post.id && (
                      <div className="mb-4 rounded bg-zinc-800/50 p-3">
                        <p className="text-xs font-medium text-zinc-300 mb-2">Full Content:</p>
                        <div className="text-sm text-zinc-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {post.content}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        <span>Created: {new Date(post.created_at).toLocaleString()}</span>
                        {post.published_at && (
                          <span>• Published: {new Date(post.published_at).toLocaleString()}</span>
                        )}
                        {post.updated_at && (
                          <span>• Updated: {new Date(post.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                      {post.slug && !post._isFromSubmission && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                        >
                          View Post →
                        </a>
                      )}
                      {post._isFromSubmission && (
                        <div className="text-xs text-blue-400">
                          <span className="text-zinc-500">Note: </span>
                          This post is from an approved submission. A blog post entry will be created when you approve it, or it may need to be manually created.
                        </div>
                      )}
                    </div>

                    {/* Management Actions */}
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setExpandedBlogPostId(expandedBlogPostId === post.id ? null : post.id)}
                          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/30 cursor-pointer"
                        >
                          {expandedBlogPostId === post.id ? '▼ Hide Content' : '▶ View Full Content'}
                        </button>
                        
                        {/* Status Management */}
                        {post.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBlogPost(post.id, { status: 'published' })}
                            disabled={processingBlogPost === post.id}
                            className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {processingBlogPost === post.id ? '...' : '✓ Publish'}
                          </button>
                        )}
                        {post.status !== 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBlogPost(post.id, { status: 'draft' })}
                            disabled={processingBlogPost === post.id}
                            className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {processingBlogPost === post.id ? '...' : (
                              <>
                                <FileText className="h-3 w-3 inline mr-1" />
                                Draft
                              </>
                            )}
                          </button>
                        )}
                        {post.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBlogPost(post.id, { status: 'archived' })}
                            disabled={processingBlogPost === post.id}
                            className="rounded-lg bg-gray-500/20 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-gray-500/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {processingBlogPost === post.id ? '...' : '📦 Archive'}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleUpdateBlogPost(post.id, { is_featured: !post.is_featured })}
                          disabled={processingBlogPost === post.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                            post.is_featured
                              ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/40'
                              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          }`}
                        >
                          {processingBlogPost === post.id ? '...' : (
                            <>
                              <Sparkles className="h-3 w-3 inline mr-1" />
                              {post.is_featured ? 'Unfeature' : 'Feature'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateBlogPost(post.id, { is_blog_of_month: !post.is_blog_of_month })}
                          disabled={processingBlogPost === post.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                            post.is_blog_of_month
                              ? 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/40'
                              : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          }`}
                        >
                          {processingBlogPost === post.id ? '...' : (
                            <>
                              <Trophy className="h-3 w-3 inline mr-1" />
                              {post.is_blog_of_month ? 'Remove BOM' : 'Set BOM'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
                )}
              </>
            )}


            {/* Assessments Section - Student Sats Rewards */}
            {activeSubMenu === 'student-sats-rewards' && (
              <>
                {/* Blog Summary Section */}
                {loadingBlogSummary && blogSummaryInitialLoadRef.current ? (
                  <div className="mb-4 sm:mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 sm:p-5">
                    <div className="animate-pulse">
                      <div className="h-4 bg-purple-500/20 rounded w-48 mb-3"></div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                            <div className="h-3 bg-purple-500/20 rounded w-20 mb-2"></div>
                            <div className="h-6 bg-purple-500/20 rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : blogSummary ? (
                  <div className="mb-4 sm:mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-purple-200 mb-1 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Blog Summary</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-300/80">
                          Students who have written and published blog posts
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setShowBlogRewardsModal(true);
                          setLoadingBlogRewardsList(true);
                          try {
                            const res = await fetchWithAuth('/api/admin/sats?reward_type=blog');
                            if (res.ok) {
                              const data = await res.json();
                              setBlogRewardsList(data.rewards || []);
                            } else {
                              setBlogRewardsList([]);
                            }
                          } catch (err) {
                            console.error('Error fetching blog rewards:', err);
                            setBlogRewardsList([]);
                          } finally {
                            setLoadingBlogRewardsList(false);
                          }
                        }}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-300 transition hover:bg-purple-500/20 flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>View All Blog Rewards</span>
                      </button>
      </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Total Blogs</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {blogSummary.summary.totalBlogs}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Total Authors</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {blogSummary.summary.totalAuthors}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Total Sats</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {blogSummary.summary.totalSats.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Featured</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {blogSummary.summary.featuredBlogs}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Blog of Month</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {blogSummary.summary.blogOfMonth}
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/80 mb-1">Categories</div>
                        <div className="text-lg sm:text-xl font-bold text-purple-200">
                          {Object.keys(blogSummary.summary.categories).length}
                        </div>
                      </div>
                    </div>

                    {/* Authors List */}
                    {blogSummary.authors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-200 mb-3">Blog Authors</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {blogSummary.authors.map((author: any) => (
                            <div
                              key={author.author_id}
                              className="flex items-start justify-between p-3 rounded-lg bg-black/20 border border-purple-500/10 hover:bg-black/30 transition"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-medium text-purple-200">
                                    {author.author_name}
                                  </div>
                                  {author.author_role && (
                                    <span className="text-xs text-purple-300/60">({author.author_role})</span>
                                  )}
                                </div>
                                {author.author_email && (
                                  <div className="text-xs text-purple-300/60 mb-2">
                                    {author.author_email}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className="text-xs text-purple-300/80">
                                    {author.total_blogs} blog{author.total_blogs !== 1 ? 's' : ''}
                                  </span>
                                  {author.categories && author.categories.length > 0 && (
                                    <>
                                      <span className="text-purple-500/50">•</span>
                                      <div className="flex flex-wrap gap-1">
                                        {author.categories.map((cat: string, idx: number) => (
                                          <span
                                            key={idx}
                                            className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                          >
                                            {cat}
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-purple-200">
                                    {author.sats_total.toLocaleString()} sats
                                  </div>
                                  <div className="text-xs text-purple-300/60">
                                    {author.sats_paid > 0 && (
                                      <span className="text-green-400">{author.sats_paid.toLocaleString()} paid</span>
                                    )}
                                    {author.sats_paid > 0 && author.sats_pending > 0 && <span> / </span>}
                                    {author.sats_pending > 0 && (
                                      <span className="text-yellow-400">{author.sats_pending.toLocaleString()} pending</span>
                                    )}
                                  </div>
                                </div>
                                {author.latest_blog_date && (
                                  <div className="text-xs text-purple-300/50 whitespace-nowrap">
                                    {new Date(author.latest_blog_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Categories Breakdown */}
                    {Object.keys(blogSummary.summary.categories).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-200 mb-3">Blogs by Category</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(blogSummary.summary.categories)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([category, count]) => (
                              <div
                                key={category}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-purple-500/20"
                              >
                                <span className="text-xs font-medium text-purple-200">{category}</span>
                                <span className="text-xs text-purple-300/60">({count})</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Sats Rewards Statistics */}
                {loadingSatsRewards ? (
                  <div className="grid gap-3 sm:gap-4 mb-4 sm:mb-6 grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4 animate-pulse">
                        <div className="h-3 sm:h-4 bg-zinc-700 rounded mb-2 w-16 sm:w-20"></div>
                        <div className="h-6 sm:h-8 bg-zinc-700 rounded w-20 sm:w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : satsStatistics ? (
                  <div className="grid gap-3 sm:gap-4 mb-4 sm:mb-6 grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-orange-500/25 bg-black/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                      <div className="text-xs text-orange-300 mb-1">Total Paid</div>
                      <div className="text-lg sm:text-2xl font-bold text-orange-200">
                        {satsStatistics.totalPaid?.toLocaleString() || 0} <span className="text-sm sm:text-base">sats</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-yellow-500/25 bg-black/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                      <div className="text-xs text-yellow-300 mb-1">Total Pending</div>
                      <div className="text-lg sm:text-2xl font-bold text-yellow-200">
                        {satsStatistics.totalPending?.toLocaleString() || 0} <span className="text-sm sm:text-base">sats</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-500/25 bg-black/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                      <div className="text-xs text-cyan-300 mb-1">Total Rewards</div>
                      <div className="text-lg sm:text-2xl font-bold text-cyan-200">
                        {satsStatistics.totalRewards?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-purple-500/25 bg-black/80 p-3 sm:p-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                      <div className="text-xs text-purple-300 mb-1">Total Amount</div>
                      <div className="text-lg sm:text-2xl font-bold text-purple-200">
                        {satsTotalAmount.toLocaleString()} <span className="text-sm sm:text-base">sats</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Student Sats Rewards Section */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-zinc-50 mb-1">Student Sats Rewards</h2>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        View and manage all sats rewards for students across the academy.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {!loadingSatsRewards && (
                        <div className="text-xs sm:text-sm text-zinc-400">
                          {studentSatsRewards.length > 0 ? (
                            <>
                              Showing <span className="text-cyan-300 font-medium">{studentSatsRewards.length}</span> of <span className="text-cyan-300 font-medium">{allSatsRewards.length}</span> reward{allSatsRewards.length !== 1 ? 's' : ''}
                            </>
                          ) : allSatsRewards.length > 0 ? (
                            <>
                              <span className="text-yellow-300">No rewards match filters</span> ({allSatsRewards.length} total)
                            </>
                          ) : (
                            'No rewards found'
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateReward}
                          className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/20 flex items-center justify-center gap-2"
                        >
                          <span>+</span>
                          <span className="hidden sm:inline">New Reward</span>
                          <span className="sm:hidden">New</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mb-6 p-3 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs text-zinc-400 mb-1.5">Student</label>
                        <select
                          value={satsStudentFilter}
                          onChange={handleSatsStudentFilterChange}
                          disabled={loadingStudentsList}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                          <option value="all">All Students</option>
                          {loadingStudentsList ? (
                            <option disabled>Loading students...</option>
                          ) : studentsList.length === 0 ? (
                            <option disabled>No students found</option>
                          ) : (
                            studentsList.map((student: any) => (
                              <option key={student.id} value={student.id}>
                                {student.name || student.email} {student.email ? `(${student.email})` : ''}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Status</label>
                        <select
                          value={satsStatusFilter}
                          onChange={handleSatsStatusFilterChange}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Type</label>
                        <select
                          value={satsTypeFilter}
                          onChange={handleSatsTypeFilterChange}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                      </div>
                    </div>
                  </div>

                  {loadingSatsRewards ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
                          <div className="h-4 bg-zinc-700 rounded mb-3 w-3/4"></div>
                          <div className="h-6 bg-zinc-700 rounded mb-2 w-1/2"></div>
                          <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : satsError ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                      <div className="text-red-300 mb-3 text-lg font-medium">{satsError}</div>
                      {satsError.includes('Too many requests') ? (
                        <div className="text-sm text-red-300/80 mb-3">
                          Please wait a few seconds before trying again.
                        </div>
                      ) : null}
                      <button
                        onClick={() => {
                          // Reset fetch key and wait a bit before retrying
                          satsLastFetchKeyRef.current = '';
                          setTimeout(() => {
                            fetchStudentSatsRewards();
                          }, 2000);
                        }}
                        disabled={loadingSatsRewards}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingSatsRewards ? 'Retrying...' : 'Retry'}
                      </button>
                    </div>
                  ) : !loadingSatsRewards && studentSatsRewards.length === 0 && allSatsRewards.length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-12 text-center">
                      <div className="text-4xl mb-4">📭</div>
                      <div className="text-zinc-300 text-lg font-medium mb-2">
                        No sats rewards yet
                      </div>
                      <div className="text-zinc-500 text-sm">
                        Sats rewards will appear here once students start earning them.
                      </div>
                    </div>
                  ) : !loadingSatsRewards && studentSatsRewards.length === 0 && allSatsRewards.length > 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-12 text-center">
                      <div className="text-4xl mb-4">🔍</div>
                      <div className="text-zinc-300 text-lg font-medium mb-2">
                        No rewards match your filters
                      </div>
                      <div className="text-zinc-500 text-sm">
                        Try adjusting your filters to see more results. ({allSatsRewards.length} total rewards available)
                      </div>
                    </div>
                  ) : studentSatsRewards.length > 0 ? (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {studentSatsRewards.map((reward: any) => {
                        const totalAmount = (reward.amount_paid || 0) + (reward.amount_pending || 0);
                        const statusColors = {
                          paid: 'bg-green-500/20 text-green-300 border-green-500/30',
                          pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                          processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                          failed: 'bg-red-500/20 text-red-300 border-red-500/30',
                        };
                        const statusColor = statusColors[reward.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
                        
                        return (
                          <div
                            key={reward.id}
                            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all duration-200"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-zinc-50 truncate mb-1">
                                  {reward.student?.name || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">
                                  {reward.student?.email || '—'}
                                </div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium border flex-shrink-0 ml-2 ${statusColor}`}>
                                {reward.status ? reward.status.charAt(0).toUpperCase() + reward.status.slice(1) : 'Pending'}
                              </span>
                            </div>

                            {/* Amount Display */}
                            <div className="mb-3 sm:mb-4">
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-xl sm:text-2xl font-bold text-cyan-300">
                                  {totalAmount.toLocaleString()}
                                </span>
                                <span className="text-xs sm:text-sm text-zinc-400">sats</span>
                              </div>
                              <div className="flex gap-4 text-xs">
                                {reward.amount_paid > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-green-400">Paid: {reward.amount_paid.toLocaleString()}</span>
                                  </div>
                                )}
                                {reward.amount_pending > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    <span className="text-yellow-400">Pending: {reward.amount_pending.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Type Badge */}
                            <div className="mb-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                                <Target className="h-3 w-3" />
                                {formatRewardType(reward.reward_type || 'other')}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 pt-3 border-t border-zinc-800">
                              {reward.reason && (
                                <div className="text-xs text-zinc-400 line-clamp-2" title={reward.reason}>
                                  <span className="text-zinc-500">Reason:</span> {reward.reason}
                                </div>
                              )}
                              {reward.related_entity_type && (
                                <div className="text-xs text-zinc-400">
                                  <span className="text-zinc-500">Related:</span>{' '}
                                  <span className="text-zinc-300 capitalize">
                                    {reward.related_entity_type}
                                    {reward.related_entity_id && ` (${reward.related_entity_id.substring(0, 8)}...)`}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                <div className="text-zinc-500">
                                  <span className="text-zinc-500">Awarded by:</span>{' '}
                                  <span className="text-zinc-300">
                                    {reward.awarded_by_profile?.name || (reward.awarded_by ? 'System' : '—')}
                                  </span>
                                </div>
                                {reward.payment_date && (
                                  <div className="text-zinc-500">
                                    <span className="text-zinc-500">Paid:</span>{' '}
                                    <span className="text-green-400">
                                      {new Date(reward.payment_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                                {reward.created_at && (
                                  <div className="text-zinc-500">
                                    <span className="text-zinc-500">Created:</span>{' '}
                                    <span className="text-zinc-300">
                                      {new Date(reward.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {reward.updated_at && reward.updated_at !== reward.created_at && (
                                <div className="text-xs text-zinc-500">
                                  Updated: {new Date(reward.updated_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 sm:mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handleEditReward(reward)}
                                className="flex-1 min-w-[80px] rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 sm:px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                              >
                                Edit
                              </button>
                              {reward.status === 'pending' && (
                                <button
                                  onClick={() => handleQuickStatusUpdate(reward.id, 'paid')}
                                  className="flex-1 min-w-[100px] rounded-lg border border-green-500/30 bg-green-500/10 px-2 sm:px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/20"
                                  title="Mark as Paid"
                                >
                                  <span className="hidden sm:inline">Mark Paid</span>
                                  <span className="sm:hidden">Paid</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReward(reward.id)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 sm:px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Edit/Create Reward Modal */}
                  {showRewardModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                              <span className="text-xl">🎁</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-zinc-50">
                                {editingReward ? 'Edit Reward' : 'Create New Reward'}
                              </h3>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {editingReward ? 'Update reward details' : 'Award sats to a student'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowRewardModal(false)}
                            className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-5">
                          {/* Cohort Selection */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <BookOpen className="h-4 w-4 text-cyan-400" />
                              <span>Cohort</span>
                            </label>
                            <div className="relative">
                              <select
                                value={rewardForm.cohort_id}
                                onChange={(e) => handleCohortChange(e.target.value)}
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all appearance-none cursor-pointer hover:border-zinc-600 hover:bg-zinc-900"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 1rem center',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="" className="bg-zinc-900 text-zinc-200">All Cohorts</option>
                                {cohorts.map((cohort: any) => (
                                  <option key={cohort.id} value={cohort.id} className="bg-zinc-900 text-zinc-200">
                                    {cohort.name}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-cyan-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Student Selection */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <User className="h-4 w-4 text-purple-400" />
                              <span>Student</span>
                              {loadingStudentsList && (
                                <span className="ml-auto flex items-center gap-1.5 text-xs text-cyan-400">
                                  <span className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
                                  Loading...
                                </span>
                              )}
                              {!loadingStudentsList && rewardForm.cohort_id && filteredStudentsByCohort.length > 0 && (
                                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {filteredStudentsByCohort.length} available
                                </span>
                              )}
                              {!loadingStudentsList && !rewardForm.cohort_id && studentsList.length > 0 && (
                                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {studentsList.length} available
                                </span>
                              )}
                            </label>
                            <div className="relative">
                              <select
                                value={rewardForm.student_id}
                                onChange={(e) => setRewardForm({ ...rewardForm, student_id: e.target.value })}
                                disabled={loadingStudentsList}
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all appearance-none cursor-pointer hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-700/50"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 1rem center',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="" className="bg-zinc-900 text-zinc-200">
                                  {loadingStudentsList 
                                    ? 'Loading students...' 
                                    : 'Select a student'
                                  }
                                </option>
                                {(rewardForm.cohort_id && filteredStudentsByCohort.length > 0
                                  ? filteredStudentsByCohort 
                                  : !rewardForm.cohort_id 
                                    ? studentsList 
                                    : []
                                ).map((student: any) => (
                                  <option key={student.id} value={student.id} className="bg-zinc-900 text-zinc-200">
                                    {student.name || student.email} {student.email ? `(${student.email})` : ''}
                                    {student.cohortName ? ` - ${student.cohortName}` : ''}
                                  </option>
                                ))}
                                {!loadingStudentsList && rewardForm.cohort_id && filteredStudentsByCohort.length === 0 && studentsList.length === 0 && (
                                  <option value="" disabled className="bg-zinc-900 text-zinc-500">No students found for this cohort</option>
                                )}
                                {!loadingStudentsList && !rewardForm.cohort_id && studentsList.length === 0 && (
                                  <option value="" disabled className="bg-zinc-900 text-zinc-500">No students found</option>
                                )}
                              </select>
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-purple-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Amount Input */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <DollarSign className="h-4 w-4 text-yellow-400" />
                              <span>Amount (sats)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={rewardForm.amount}
                                onChange={(e) => setRewardForm({ ...rewardForm, amount: e.target.value })}
                                placeholder="0"
                                min="0"
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/10 transition-all hover:border-zinc-600 hover:bg-zinc-900"
                              />
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-yellow-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Status Selection */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <span className="text-green-400">✓</span>
                              <span>Status</span>
                            </label>
                            <div className="relative">
                              <select
                                value={rewardForm.status}
                                onChange={(e) => setRewardForm({ ...rewardForm, status: e.target.value })}
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all appearance-none cursor-pointer hover:border-zinc-600 hover:bg-zinc-900"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 1rem center',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="pending" className="bg-zinc-900 text-zinc-200">⏳ Pending (Not sent yet)</option>
                                <option value="paid" className="bg-zinc-900 text-zinc-200">Paid (Sent)</option>
                                <option value="processing" className="bg-zinc-900 text-zinc-200">Processing</option>
                                <option value="failed" className="bg-zinc-900 text-zinc-200">❌ Failed</option>
                              </select>
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-green-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Reward Type Selection */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <Trophy className="h-4 w-4 text-blue-400" />
                              <span>Reward Type</span>
                            </label>
                            <div className="relative">
                              <select
                                value={rewardForm.reward_type}
                                onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer hover:border-zinc-600 hover:bg-zinc-900"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 1rem center',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="assignment" className="bg-zinc-900 text-zinc-200">Assignment</option>
                                <option value="chapter" className="bg-zinc-900 text-zinc-200">Chapter</option>
                                <option value="discussion" className="bg-zinc-900 text-zinc-200">Discussion</option>
                                <option value="peer_help" className="bg-zinc-900 text-zinc-200">Peer Help</option>
                                <option value="project" className="bg-zinc-900 text-zinc-200">Project</option>
                                <option value="attendance" className="bg-zinc-900 text-zinc-200">Attendance</option>
                                <option value="blog" className="bg-zinc-900 text-zinc-200">Blog</option>
                                <option value="other" className="bg-zinc-900 text-zinc-200">Other</option>
                              </select>
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-blue-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Reason Selection */}
                          <div className="group">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                              <ClipboardList className="h-4 w-4 text-orange-400" />
                              <span>Reason</span>
                            </label>
                            <div className="relative">
                              <select
                                value={rewardForm.reason}
                                onChange={(e) => setRewardForm({ ...rewardForm, reason: e.target.value })}
                                className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-200 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer hover:border-zinc-600 hover:bg-zinc-900"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 1rem center',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="" className="bg-zinc-900 text-zinc-200">Select a reason</option>
                                <option value="Assignment completion" className="bg-zinc-900 text-zinc-200">Assignment completion</option>
                                <option value="Chapter completion" className="bg-zinc-900 text-zinc-200">📖 Chapter completion</option>
                                <option value="Blog post approval" className="bg-zinc-900 text-zinc-200">Blog post approval</option>
                                <option value="Attendance bonus" className="bg-zinc-900 text-zinc-200">Attendance bonus</option>
                                <option value="Peer help contribution" className="bg-zinc-900 text-zinc-200">Peer help contribution</option>
                                <option value="Project submission" className="bg-zinc-900 text-zinc-200">Project submission</option>
                                <option value="Discussion participation" className="bg-zinc-900 text-zinc-200">Discussion participation</option>
                                <option value="Special achievement" className="bg-zinc-900 text-zinc-200">Special achievement</option>
                                <option value="Other" className="bg-zinc-900 text-zinc-200">Other</option>
                              </select>
                              <div className="absolute inset-0 rounded-xl pointer-events-none ring-0 group-hover:ring-2 ring-orange-500/20 transition-all"></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
                            <button
                              onClick={handleSaveReward}
                              disabled={savingReward}
                              className="flex-1 rounded-xl border-2 border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-6 py-3 text-sm font-semibold text-cyan-300 transition-all hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-500/70 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                            >
                              {savingReward ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin"></span>
                                  <span>Saving...</span>
                                </>
                              ) : editingReward ? (
                                <>
                                  <span>💾</span>
                                  <span>Update Reward</span>
                                </>
                              ) : (
                                <>
                                  <span>✨</span>
                                  <span>Create Reward</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setShowRewardModal(false)}
                              className="rounded-xl border-2 border-zinc-700/50 bg-zinc-800/50 px-6 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Content & Resources Section */}
            {activeSubMenu === 'assignments' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Assignments</h3>
                  </div>
                </div>
                {loadingAssignments ? (
                  <div className="text-center py-8 text-zinc-400">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No assignments found.</div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment: any) => (
                      <div key={assignment.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-zinc-50 mb-2">{assignment.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                              {assignment.chapter_number && <span>Chapter {assignment.chapter_number}</span>}
                              {assignment.cohorts && <span>• {assignment.cohorts.name}</span>}
                              {assignment.status && <span className={`px-2 py-0.5 rounded ${assignment.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>{assignment.status}</span>}
                              {assignment.points && <span>• {assignment.points} points</span>}
                            </div>
                            {assignment.description && <p className="text-xs text-zinc-400 mt-2">{assignment.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubMenu === 'developer-resources' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Developer Resources</h3>
                  </div>
                </div>
                {loadingDeveloperResources ? (
                  <div className="text-center py-8 text-zinc-400">Loading resources...</div>
                ) : developerResources.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No developer resources found.</div>
                ) : (
                  <div className="space-y-3">
                    {developerResources.map((resource: any) => (
                      <div key={resource.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-zinc-50 mb-2">{resource.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                              {resource.category && <span>{resource.category}</span>}
                              {resource.level && <span>• {resource.level}</span>}
                            </div>
                            {resource.description && <p className="text-xs text-zinc-400 mt-2">{resource.description}</p>}
                            {resource.url && (
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                                View Resource →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubMenu === 'developer-events' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Developer Events</h3>
                  </div>
                </div>
                {loadingDeveloperEvents ? (
                  <div className="text-center py-8 text-zinc-400">Loading events...</div>
                ) : developerEvents.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No developer events found.</div>
                ) : (
                  <div className="space-y-3">
                    {developerEvents.map((event: any) => (
                      <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-zinc-50 mb-2">{event.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                              {event.type && <span>{event.type}</span>}
                              {event.start_time && <span>• {new Date(event.start_time).toLocaleString()}</span>}
                              {event.location && <span>• {event.location}</span>}
                            </div>
                            {event.description && <p className="text-xs text-zinc-400 mt-2">{event.description}</p>}
                            {event.link && (
                              <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                                View Event →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubMenu === 'testimonials' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Testimonials</h3>
                  </div>
                </div>
                {loadingTestimonials ? (
                  <div className="text-center py-8 text-zinc-400">Loading testimonials...</div>
                ) : testimonials.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No testimonials found.</div>
                ) : (
                  <div className="space-y-3">
                    {testimonials.map((testimonial: any) => (
                      <div key={testimonial.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-zinc-50">{testimonial.profiles?.name || 'Unknown'}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${testimonial.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {testimonial.is_approved ? 'Approved' : 'Pending'}
                              </span>
                              {testimonial.is_featured && <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Featured</span>}
                            </div>
                            <p className="text-sm text-zinc-300">{testimonial.testimonial}</p>
                            <div className="text-xs text-zinc-400 mt-2">
                              {testimonial.profiles?.email && <span>{testimonial.profiles.email}</span>}
                              {testimonial.created_at && <span> • {new Date(testimonial.created_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Community Section */}
            {activeSubMenu === 'mentors' && (
              <div className="space-y-6">
                {/* Register New Mentor Form */}
                <MentorRegistrationForm 
                  onSuccess={() => {
                    // Refresh mentors list after successful registration
                    mentorsFetchedRef.current = false;
                    mentorsFetchingRef.current = false;
                    fetchMentors();
                  }}
                />

                {/* Mentors List */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Handshake className="h-5 w-5 text-zinc-50" />
                      <h3 className="text-lg font-semibold text-zinc-50">All Mentors</h3>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Active mentors appear on the <a href="/mentorship" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline">mentorship page</a>
                    </p>
                  </div>
                  {loadingMentors ? (
                    <div className="text-center py-8 text-zinc-400">Loading mentors...</div>
                  ) : mentors.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      <p>No mentors found.</p>
                      <p className="text-xs text-zinc-500 mt-2">Register a new mentor using the form above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mentors.map((mentor: any) => (
                        <div key={mentor.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-zinc-50">{mentor.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{mentor.type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${mentor.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                  {mentor.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              {mentor.role && <p className="text-xs text-zinc-400 mb-2">{mentor.role}</p>}
                              {mentor.description && <p className="text-sm text-zinc-300 mb-2">"{mentor.description}"</p>}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                                {mentor.github && <a href={mentor.github} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">GitHub</a>}
                                {mentor.twitter && <a href={mentor.twitter} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Twitter</a>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubMenu === 'sponsorships' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Sponsorships</h3>
                  </div>
                </div>
                {loadingSponsorships ? (
                  <div className="text-center py-8 text-zinc-400">Loading sponsorships...</div>
                ) : sponsorships.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No sponsorships found.</div>
                ) : (
                  <div className="space-y-3">
                    {sponsorships.map((sponsorship: any) => (
                      <div key={sponsorship.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-zinc-50">
                                {sponsorship.sponsor_anonymous ? 'Anonymous Sponsor' : sponsorship.sponsor_name || 'Unknown'}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                sponsorship.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                sponsorship.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-zinc-500/20 text-zinc-400'
                              }`}>
                                {sponsorship.status}
                              </span>
                            </div>
                            {sponsorship.profiles && <p className="text-xs text-zinc-400 mb-2">Student: {sponsorship.profiles.name} ({sponsorship.profiles.email})</p>}
                            {sponsorship.amount_sats && <p className="text-sm text-zinc-300 mb-2">{sponsorship.amount_sats.toLocaleString()} sats</p>}
                            {sponsorship.message && <p className="text-sm text-zinc-300">{sponsorship.message}</p>}
                            <div className="text-xs text-zinc-400 mt-2">
                              {sponsorship.created_at && <span>{new Date(sponsorship.created_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubMenu === 'achievements' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-zinc-50" />
                    <h3 className="text-lg font-semibold text-zinc-50">Achievements</h3>
                  </div>
                </div>
                {loadingAchievements ? (
                  <div className="text-center py-8 text-zinc-400">Loading achievements...</div>
                ) : achievements.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">No achievements found.</div>
                ) : (
                  <div className="space-y-3">
                    {achievements.map((achievement: any) => (
                      <div key={achievement.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-zinc-50">{achievement.badge_name}</h4>
                              {achievement.points && <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{achievement.points} points</span>}
                            </div>
                            {achievement.profiles && (
                              <p className="text-xs text-zinc-400 mb-2">
                                {achievement.profiles.name} ({achievement.profiles.email})
                                {achievement.profiles.cohorts && ` • ${achievement.profiles.cohorts.name}`}
                              </p>
                            )}
                            {achievement.description && <p className="text-sm text-zinc-300">{achievement.description}</p>}
                            <div className="text-xs text-zinc-400 mt-2">
                              {achievement.earned_at && <span>Earned: {new Date(achievement.earned_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Blog Rewards Modal */}
      {showBlogRewardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-xl border border-purple-500/30 bg-zinc-900 p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-purple-200 mb-1 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>All Blog Rewards</span>
                </h3>
                <p className="text-xs sm:text-sm text-purple-300/80">
                  Complete list of all sats rewards given for blog posts
                </p>
              </div>
              <button
                onClick={() => setShowBlogRewardsModal(false)}
                className="text-zinc-400 hover:text-zinc-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {loadingBlogRewardsList ? (
              <div className="text-center py-12 text-zinc-400">
                <div className="animate-spin text-4xl mb-4">⟳</div>
                <p>Loading blog rewards...</p>
              </div>
            ) : blogRewardsList.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <p className="text-lg mb-2">No blog rewards found</p>
                <p className="text-sm">No sats rewards have been given for blog posts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div>
                    <div className="text-xs text-purple-300/80 mb-1">Total Rewards</div>
                    <div className="text-lg font-bold text-purple-200">{blogRewardsList.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-300/80 mb-1">Total Sats</div>
                    <div className="text-lg font-bold text-purple-200">
                      {blogRewardsList.reduce((sum: number, r: any) => sum + (r.amount_paid || 0) + (r.amount_pending || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-300/80 mb-1">Paid</div>
                    <div className="text-lg font-bold text-green-400">
                      {blogRewardsList.reduce((sum: number, r: any) => sum + (r.amount_paid || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-purple-300/80 mb-1">Pending</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {blogRewardsList.reduce((sum: number, r: any) => sum + (r.amount_pending || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Rewards List */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {blogRewardsList.map((reward: any) => (
                    <div
                      key={reward.id}
                      className="flex items-start justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800/70 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm font-semibold text-zinc-200">
                            {reward.student?.name || reward.student?.email || 'Unknown Student'}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            reward.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            reward.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            reward.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {reward.status || 'pending'}
                          </span>
                        </div>
                        {reward.student?.email && (
                          <div className="text-xs text-zinc-400 mb-2">{reward.student.email}</div>
                        )}
                        {reward.reason && (
                          <div className="text-sm text-zinc-300 mb-1">
                            <span className="text-zinc-500">Reason:</span> {reward.reason}
                          </div>
                        )}
                        <div className="text-xs text-zinc-400">
                          Created: {new Date(reward.created_at).toLocaleString()}
                          {reward.payment_date && (
                            <span className="ml-3">Paid: {new Date(reward.payment_date).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-200">
                            {((reward.amount_paid || 0) + (reward.amount_pending || 0)).toLocaleString()} sats
                          </div>
                          <div className="text-xs text-zinc-400">
                            {reward.amount_paid > 0 && (
                              <span className="text-green-400">{reward.amount_paid.toLocaleString()} paid</span>
                            )}
                            {reward.amount_paid > 0 && reward.amount_pending > 0 && <span> / </span>}
                            {reward.amount_pending > 0 && (
                              <span className="text-yellow-400">{reward.amount_pending.toLocaleString()} pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Section */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          {/* Upload Attendance */}
          {activeSubMenu === 'upload-attendance' && (
            <>
              <div className="w-full">
                {/* Combined Header and Form Section */}
                <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl">
                  {/* Header Section */}
                  <div className="px-8 pt-8 pb-6 border-b-2 border-zinc-800">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                      <span className="text-3xl">📤</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-zinc-50 mb-3">Upload Attendance</h2>
                      <p className="text-base text-zinc-400 leading-relaxed">
                        Upload Google Meet CSV files to record student attendance for class sessions and events. 
                        Select the event or session, then upload your CSV file with attendance data.
                      </p>
                    </div>
                  </div>
                  </div>

                  {/* Upload Form */}
                  <div className="p-8">
                  <form onSubmit={handleAttendanceUpload} className="space-y-6">
                  {/* Event Selection */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-base font-semibold text-zinc-200">
                      <CalendarIcon className="h-5 w-5" />
                      <span>Select Event or Session</span>
                      <span className="text-red-400 text-sm">*</span>
                    </label>
                    <select
                      value={selectedEventForUpload}
                      onChange={(e) => setSelectedEventForUpload(e.target.value)}
                      className="w-full rounded-lg border-2 border-zinc-700/50 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-50 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-zinc-600"
                      required
                    >
                      <option value="">Choose event or session...</option>
                      
                      {/* All Sessions Grouped by Cohort */}
                      {(() => {
                        // Filter out cancelled sessions, but include all others (past and upcoming)
                        const activeSessions = allSessions.filter((session: any) => {
                          return session.status !== 'cancelled';
                        });

                        // Group sessions by cohort
                        const sessionsByCohort: Record<string, typeof allSessions> = {};
                        activeSessions.forEach((session: any) => {
                          const cohortId = session.cohort_id;
                          const cohortName = session.cohorts?.name || `Cohort ${cohortId?.substring(0, 8)}` || 'Unknown Cohort';
                          const key = `${cohortId || 'no-cohort'}|${cohortName}`;
                          
                          if (!sessionsByCohort[key]) {
                            sessionsByCohort[key] = [];
                          }
                          sessionsByCohort[key].push(session);
                        });

                        // Sort sessions within each cohort by session number
                        Object.keys(sessionsByCohort).forEach((key) => {
                          sessionsByCohort[key].sort((a: any, b: any) => {
                            const numA = a.session_number || 0;
                            const numB = b.session_number || 0;
                            return numA - numB; // Session 1, 2, 3...
                          });
                        });

                        // Sort cohorts alphabetically
                        const sortedCohortKeys = Object.keys(sessionsByCohort).sort((a, b) => {
                          const nameA = a.split('|')[1];
                          const nameB = b.split('|')[1];
                          return nameA.localeCompare(nameB);
                        });

                        if (sortedCohortKeys.length > 0) {
                          return sortedCohortKeys.map((key) => {
                            const [cohortId, cohortName] = key.split('|');
                            const sessions = sessionsByCohort[key];
                            
                            return (
                              <optgroup key={key} label={`${cohortName} - Sessions`}>
                                {sessions.map((session: any) => {
                                  const sessionDate = session.session_date 
                                    ? new Date(session.session_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })
                                    : '';
                                  const sessionLabel = `Session ${session.session_number || ''}${session.topic ? `: ${session.topic}` : ''} ${sessionDate ? `(${sessionDate})` : ''}`;
                                  
                                  // Use session ID with a prefix to identify it as a session
                                  return (
                                    <option key={`session-${session.id}`} value={`session-${session.id}`}>
                                      {sessionLabel}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            );
                          });
                        }
                        return null;
                      })()}

                      {/* Other Events Grouped by Type */}
                      {(() => {
                        // Group events by type
                        const groupedEvents: Record<string, typeof liveClassEvents> = {};
                        liveClassEvents.forEach((e) => {
                          const eventType = e.type || 'other';
                          if (!groupedEvents[eventType]) {
                            groupedEvents[eventType] = [];
                          }
                          groupedEvents[eventType].push(e);
                        });

                        // Sort events within each group by start time (newest first)
                        Object.keys(groupedEvents).forEach((type) => {
                          groupedEvents[type].sort((a, b) => {
                            const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
                            const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
                            return timeB - timeA; // Newest first
                          });
                        });

                        // Render grouped events
                        const typeLabels: Record<string, string> = {
                          'live-class': 'Live Class Events',
                          'workshop': 'Workshops',
                          'assignment': 'Assignments',
                          'quiz': 'Quizzes',
                          'community': 'Community Events',
                          'deadline': 'Deadlines',
                          'cohort': 'Cohort Events',
                          'other': 'Other Events',
                        };

                        return Object.keys(groupedEvents)
                          .sort()
                          .map((type) => {
                            const events = groupedEvents[type];
                            if (events.length === 0) return null;
                            
                            return (
                              <optgroup key={type} label={typeLabels[type] || type}>
                                {events.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name} {e.start_time ? `(${new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          });
                      })()}
                    </select>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                      <span className="text-purple-400">📄</span>
                      <span>CSV File</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        className="w-full rounded-lg border-2 border-zinc-700/50 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-50 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white file:cursor-pointer hover:file:from-blue-700 hover:file:to-purple-700 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                        required
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Select a CSV file exported from Google Meet
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-zinc-800">
                    <button
                      type="submit"
                      disabled={uploadingAttendance}
                      className="w-full md:w-auto rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                      {uploadingAttendance ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Uploading Attendance...</span>
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          <span>Upload Attendance</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                  </div>
                </div>
              </div>

              {/* CSV Format Guide */}
              <div className="mt-6 rounded-2xl border-2 border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-8 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                    <Info className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-zinc-200 mb-2">CSV Format Requirements</h3>
                    <p className="text-sm text-zinc-400">
                      Your CSV file should include the following columns (column names are case-insensitive):
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border-2 border-green-500/20 hover:border-green-500/40 transition">
                    <span className="text-2xl">✓</span>
                    <div>
                      <span className="text-sm font-bold text-zinc-200">Email</span>
                      <span className="text-xs text-red-400 ml-2 font-medium">(required)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border-2 border-zinc-800/50 hover:border-zinc-700/50 transition">
                    <User className="h-6 w-6" />
                    <div>
                      <span className="text-sm font-bold text-zinc-200">Name</span>
                      <span className="text-xs text-zinc-500 ml-2">(optional)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border-2 border-zinc-800/50 hover:border-zinc-700/50 transition">
                    <Clock className="h-6 w-6" />
                    <div>
                      <span className="text-sm font-bold text-zinc-200">Join Time</span>
                      <span className="text-xs text-zinc-500 ml-2">(optional)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border-2 border-zinc-800/50 hover:border-zinc-700/50 transition">
                    <Clock className="h-6 w-6" />
                    <div>
                      <span className="text-sm font-bold text-zinc-200">Leave Time</span>
                      <span className="text-xs text-zinc-500 ml-2">(optional)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border-2 border-zinc-800/50 hover:border-zinc-700/50 transition md:col-span-2">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <span className="text-sm font-bold text-zinc-200">Duration (minutes)</span>
                      <span className="text-xs text-zinc-500 ml-2">(optional)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20">
                  <p className="text-sm text-blue-200 leading-relaxed">
                    <span className="font-bold text-blue-300">💡 Tip:</span> The system will automatically match students by email address. 
                    Make sure the email addresses in your CSV match the student emails in the database.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Attendance Records */}
          {activeSubMenu === 'attendance-records' && (
            <div className="w-full">
              {/* Main Container */}
              <div className="space-y-6">
                {/* Filter Section */}
                <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                      <span className="text-lg">🔍</span>
                      <span>Filter by Event:</span>
                    </div>
                    <select
                      value={attendanceEventFilter}
                      onChange={(e) => setAttendanceEventFilter(e.target.value)}
                      className="flex-1 w-full lg:w-auto rounded-lg border-2 border-zinc-700/50 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-50 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                    >
                      <option value="all">All Events & Sessions</option>
                      {(() => {
                        const activeSessions = allSessions.filter((session: any) => {
                          return session.status !== 'cancelled';
                        });

                        const sessionsByCohort: Record<string, typeof allSessions> = {};
                        activeSessions.forEach((session: any) => {
                          const cohortId = session.cohort_id;
                          const cohortName = session.cohorts?.name || `Cohort ${cohortId?.substring(0, 8)}` || 'Unknown Cohort';
                          const key = `${cohortId || 'no-cohort'}|${cohortName}`;
                          
                          if (!sessionsByCohort[key]) {
                            sessionsByCohort[key] = [];
                          }
                          sessionsByCohort[key].push(session);
                        });

                        Object.keys(sessionsByCohort).forEach((key) => {
                          sessionsByCohort[key].sort((a: any, b: any) => {
                            const numA = a.session_number || 0;
                            const numB = b.session_number || 0;
                            return numA - numB;
                          });
                        });

                        const sortedCohortKeys = Object.keys(sessionsByCohort).sort((a, b) => {
                          const nameA = a.split('|')[1];
                          const nameB = b.split('|')[1];
                          return nameA.localeCompare(nameB);
                        });

                        return sortedCohortKeys.map((key) => {
                          const [cohortId, cohortName] = key.split('|');
                          const sessions = sessionsByCohort[key];
                          
                          return (
                            <optgroup key={key} label={`${cohortName} - Sessions`}>
                              {sessions.map((session: any) => {
                                const sessionDate = session.session_date 
                                  ? new Date(session.session_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })
                                  : '';
                                const sessionLabel = `Session ${session.session_number || ''}${session.topic ? `: ${session.topic}` : ''} ${sessionDate ? `(${sessionDate})` : ''}`;
                                
                                return (
                                  <option key={`session-${session.id}`} value={`session-${session.id}`}>
                                    {sessionLabel}
                                  </option>
                                );
                              })}
                            </optgroup>
                          );
                        });
                      })()}
                      {(() => {
                        const groupedEvents: Record<string, typeof liveClassEvents> = {};
                        liveClassEvents.forEach((e) => {
                          const eventType = e.type || 'other';
                          if (!groupedEvents[eventType]) {
                            groupedEvents[eventType] = [];
                          }
                          groupedEvents[eventType].push(e);
                        });

                        Object.keys(groupedEvents).forEach((type) => {
                          groupedEvents[type].sort((a, b) => {
                            const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
                            const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
                            return timeB - timeA;
                          });
                        });

                        const typeLabels: Record<string, string> = {
                          'live-class': 'Live Class Events',
                          'workshop': 'Workshops',
                          'assignment': 'Assignments',
                          'quiz': 'Quizzes',
                          'community': 'Community Events',
                          'deadline': 'Deadlines',
                          'cohort': 'Cohort Events',
                          'other': 'Other Events',
                        };

                        return Object.keys(groupedEvents)
                          .sort()
                          .map((type) => {
                            const events = groupedEvents[type];
                            if (events.length === 0) return null;
                            
                            return (
                              <optgroup key={type} label={typeLabels[type] || type}>
                                {events.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name} {e.start_time ? `(${new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          });
                      })()}
                    </select>
                  </div>
                </div>

                {/* Records Content */}
                <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl overflow-hidden">
                  {loadingAttendanceRecords ? (
                    <div className="w-full text-center py-20 text-zinc-400">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                      <p className="text-lg font-medium">Loading attendance records...</p>
                      <p className="text-sm mt-2 text-zinc-500">Please wait while we fetch the data</p>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="w-full text-center py-20 text-zinc-400">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-800/50 border-2 border-zinc-700/50 mb-6">
                        <ClipboardList className="h-12 w-12" />
                      </div>
                      <p className="text-xl font-bold text-zinc-300 mb-2">No attendance records found</p>
                      <p className="text-sm text-zinc-500 mb-4">Upload a CSV file to add attendance records.</p>
                      <button
                        onClick={() => {
                          setActiveSubMenu('upload-attendance');
                        }}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        Go to Upload Attendance
                      </button>
                    </div>
                  ) : (
                  <div className="p-6">
                    {attendanceRecords.filter((record) => 
                      attendanceEventFilter === 'all' || record.eventId === attendanceEventFilter
                    ).length === 0 ? (
                      <div className="text-center py-12 text-zinc-400">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-zinc-800/50 border-2 border-zinc-700/50 mb-4">
                          <span className="text-4xl">🔍</span>
                        </div>
                        <p className="text-lg font-medium text-zinc-300 mb-2">No records found for selected event</p>
                        <p className="text-sm text-zinc-500">Try selecting a different event or upload attendance data.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {attendanceRecords
                          .filter((record) => 
                            attendanceEventFilter === 'all' || record.eventId === attendanceEventFilter
                          )
                          .map((record) => (
                            <div 
                              key={record.id} 
                              className="rounded-xl border-2 border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                            >
                              {/* Student Info Header */}
                              <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-zinc-800/50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                                      <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-bold text-zinc-200 truncate">{record.studentName}</h3>
                                      <p className="text-xs text-zinc-400 truncate">{record.studentEmail}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Event Info */}
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span className="text-xs font-semibold text-zinc-400 uppercase">Event</span>
                                </div>
                                <div className="pl-6">
                                  <p className="text-sm font-semibold text-zinc-200 mb-1">{record.eventName}</p>
                                  {record.eventType && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 capitalize">
                                      {record.eventType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Time Information */}
                              <div className="space-y-3 mb-4">
                                {record.joinTime && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                      <Clock className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-zinc-400 mb-0.5">Join Time</p>
                                      <p className="text-sm font-medium text-zinc-200">
                                        {new Date(record.joinTime).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {record.leaveTime && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs">🚪</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-zinc-400 mb-0.5">Leave Time</p>
                                      <p className="text-sm font-medium text-zinc-200">
                                        {new Date(record.leaveTime).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Duration and Upload Date */}
                              <div className="flex items-center justify-between pt-4 border-t-2 border-zinc-800/50">
                                {record.durationMinutes && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                      <span className="text-sm font-bold text-blue-300">{record.durationMinutes}</span>
                                      <span className="text-xs text-zinc-500">min</span>
                                    </span>
                                  </div>
                                )}
                                {record.createdAt && (
                                  <div className="text-right">
                                    <p className="text-xs text-zinc-500 mb-0.5">Uploaded</p>
                                    <p className="text-xs font-medium text-zinc-400">
                                      {new Date(record.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* Admin Access - Show when selected or as default (first submenu) */}
              {activeSubMenu !== 'login-history' && activeSubMenu !== 'account-lockouts' && activeSubMenu !== 'session-management' && (
                <AdminAccessManagement />
              )}

              {/* Login History */}
              {activeSubMenu === 'login-history' && (
                <SecurityLoginHistory />
              )}

              {/* Account Lockouts */}
              {activeSubMenu === 'account-lockouts' && (
                <SecurityAccountLockouts />
              )}

              {/* Session Management */}
              {activeSubMenu === 'session-management' && (
                <SecuritySessionManagement />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Security Section Components
function SecurityLoginHistory() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    email: '',
    ip: '',
    success: '',
    startDate: '',
    endDate: '',
  });

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.ip) params.append('ip', filters.ip);
      if (filters.success) params.append('success', filters.success);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/admin/login-history?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAttempts(data.attempts || []);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount, user clicks "Apply Filters" to refetch with filters

  return (
    <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-6 w-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-zinc-50">Login History</h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by email"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
        />
        <input
          type="text"
          placeholder="Filter by IP"
          value={filters.ip}
          onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
        />
        <select
          value={filters.success}
          onChange={(e) => setFilters({ ...filters, success: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">All attempts</option>
          <option value="true">Successful</option>
          <option value="false">Failed</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-100"
        />
        <button
          onClick={fetchLoginHistory}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-600 transition"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">No login attempts found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">Time</th>
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">Email</th>
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">IP Address</th>
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">Device</th>
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">Status</th>
                <th className="text-left p-3 text-sm font-semibold text-zinc-300">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="p-3 text-sm text-zinc-400">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm text-zinc-300">{attempt.email}</td>
                  <td className="p-3 text-sm text-zinc-400">{attempt.ipAddress}</td>
                  <td className="p-3 text-sm text-zinc-400">{attempt.device}</td>
                  <td className="p-3">
                    {attempt.success ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-xs text-green-300">
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                        {attempt.failureReason || 'Failed'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-zinc-500 font-mono">{attempt.requestId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SecurityAccountLockouts() {
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLockedAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/account-management/locked-accounts');
      const data = await res.json();
      if (res.ok && data.success) {
        setLockedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching locked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async (adminId: string) => {
    if (!confirm('Are you sure you want to unlock this account?')) return;
    try {
      const res = await fetch('/api/admin/account-management/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchLockedAccounts();
      } else {
        alert(data.error || 'Failed to unlock account');
      }
    } catch (error) {
      alert('Failed to unlock account');
    }
  };

  useEffect(() => {
    fetchLockedAccounts();
  }, []);

  return (
    <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-6 w-6 text-red-400" />
        <h2 className="text-2xl font-bold text-zinc-50">Account Lockouts</h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : lockedAccounts.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">No locked accounts</div>
      ) : (
        <div className="space-y-4">
          {lockedAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-200">{account.email}</p>
                  <p className="text-sm text-zinc-400">
                    Failed attempts: {account.failedLoginAttempts} | 
                    Locked for {account.minutesRemaining} more minutes
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Locked until: {new Date(account.lockedUntil).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => unlockAccount(account.id)}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition"
                >
                  Unlock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecuritySessionManagement() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchSessions();
      } else {
        alert(data.error || 'Failed to revoke session');
      }
    } catch (error) {
      alert('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in.')) return;
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchSessions();
      } else {
        alert(data.error || 'Failed to revoke sessions');
      }
    } catch (error) {
      alert('Failed to revoke sessions');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LogOut className="h-6 w-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-zinc-50">Session Management</h2>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={revokeAllSessions}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
          >
            Revoke All Other Sessions
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">No active sessions</div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-lg border p-4 ${
                session.isCurrent
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-zinc-200">{session.device}</p>
                    {session.isCurrent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">IP: {session.ipAddress}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition ml-4"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


