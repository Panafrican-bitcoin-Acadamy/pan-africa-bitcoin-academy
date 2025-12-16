'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { chaptersContent } from '@/content/chaptersContent';
import { Download, Book, FileText } from 'lucide-react';

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
        const res = await fetch('/api/sats');
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
    totalChapters: 20,
    assignmentsCompleted: 0,
    totalAssignments: 4,
    satsEarned: 0,
    attendanceRate: 0,
    attendancePercent: 0,
  };

  const student = studentData || fallbackStudent;
  const defaultAchievements = [
    { id: 'a1', title: 'Completed First Wallet', icon: '🎖', unlocked: false },
    { id: 'a2', title: 'Sent First Sats', icon: '🏆', unlocked: false },
    { id: 'a3', title: '3 Assignments Done', icon: '🎯', unlocked: false },
    { id: 'a4', title: 'Lightning User', icon: '⚡', unlocked: false },
    { id: 'a5', title: 'Recovery Master', icon: '🔐', unlocked: false },
  ];

  const createFallbackLiveSessions = () => {
    const now = new Date();
    const d1 = new Date(now);
    const d2 = new Date(now);
    d1.setDate(now.getDate() + 1);
    d2.setDate(now.getDate() + 2);
    return [
      {
        id: 'fallback-live-1',
        title: 'Live Class - Welcome Session',
        date: d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: '7:00 PM',
        type: 'upcoming',
        link: '#',
      },
      {
        id: 'fallback-live-2',
        title: 'Office Hours with Mentors',
        date: d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: '6:00 PM',
        type: 'upcoming',
        link: '#',
      },
    ];
  };
  const achievements = (student.achievements && student.achievements.length > 0)
    ? student.achievements
    : defaultAchievements;
  const liveSessions = (student.liveSessions && student.liveSessions.length > 0)
    ? student.liveSessions
    : createFallbackLiveSessions();
  
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
  
  const assignments = student.assignments || [];
  const resources = student.resources || [];
  const leaderboard = leaderboardData;
  
  // Calculate chapters completed from chapterStatus (dynamic, updates in real-time)
  // Use userData if available, otherwise fallback to chapterStatus
  const chaptersCompleted = userData?.student?.chaptersCompleted ?? 
    Object.values(chapterStatus).filter((status) => status.isCompleted === true).length;
  
  // Calculate course progress from completed chapters (dynamic)
  const courseProgress = Math.round((chaptersCompleted / 20) * 100);
  
  // Get attendance from userData if available, otherwise from student data
  const attendance = userData?.student?.attendancePercent ?? student.attendancePercent ?? student.attendanceRate ?? 0;
  
  // Get assignments completed from userData if available
  const assignmentsCompleted = userData?.student?.assignmentsCompleted ?? student.assignmentsCompleted ?? 0;
  
  // Get sats earned - prefer userData, then student, then satsTotals
  const satsEarned = userData?.student?.satsEarned ?? student.satsEarned ?? satsTotals.paid ?? 0;
  const satsPending = student.satsPending ?? satsTotals.pending ?? 0;
  
  // Certification requirements
  const totalChapters = 20;
  const totalAssignments = 4;
  const requiredAttendance = 80; // 80%
  const requiredSats = 500;
  
  // Check each requirement
  const hasCompletedAllChapters = chaptersCompleted >= totalChapters;
  const hasCompletedAllAssignments = assignmentsCompleted >= totalAssignments;
  const hasMetAttendance = attendance >= requiredAttendance;
  const hasEarnedEnoughSats = satsEarned >= requiredSats;
  // TODO: Add final assessment status when implemented
  const hasPassedFinalAssessment = false; // Placeholder - update when final assessment is implemented
  
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

  return (
    <div className="min-h-screen bg-black/95">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileModal
          open={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setIsEditingProfile(false);
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

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
            Welcome back, {userData?.profile?.name || student.name || 'Student'} 👋
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            {userData?.isRegistered 
              ? `Your journey to Bitcoin sovereignty continues.${userData?.cohort ? ` You're enrolled in ${userData.cohort.name}.` : ''}`
              : 'Your journey to Bitcoin sovereignty continues.'}
          </p>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-orange-200">Your Next Step</h2>
                      <p className="mt-2 text-lg text-zinc-100">Check assignments and upcoming events.</p>
                    </div>
                    <Link
                      href="#assignments"
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 whitespace-nowrap ml-4"
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
                      <button className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 font-semibold text-white transition hover:brightness-110">
                        Withdraw (LNURL)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right side: Calendar */}
              <div className="lg:col-span-1">
                <Suspense fallback={<div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50"><div className="text-zinc-400">Loading calendar...</div></div>}>
                  <Calendar cohortId={userData?.cohort?.id || null} />
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
                            {chaptersCompleted}/20
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
                </div>
                <div className="space-y-3">
                  {liveSessions.slice(0, 3).map((session: any) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3"
                    >
                      <div className="mb-1 text-xs font-medium text-purple-300">{session.date}</div>
                      <div className="mb-2 text-sm font-medium text-zinc-100">{session.title}</div>
                      <div className="text-xs text-zinc-400">{session.time}</div>
                      <Link
                        href={session.link}
                        className="mt-2 block rounded bg-purple-500/20 px-3 py-1.5 text-center text-xs font-medium text-purple-300 transition hover:bg-purple-500/30"
                      >
                        Join
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Materials */}
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Study Materials</h2>
              <p className="mb-6 text-sm text-zinc-400">
                Download essential Bitcoin resources and reading materials to support your learning journey.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Bitcoin Whitepaper */}
                <a
                  href="https://bitcoin.org/bitcoin.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 transition hover:border-orange-500/50 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-orange-500/20 p-2">
                      <FileText className="h-5 w-5 text-orange-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">Bitcoin Whitepaper</h3>
                      <p className="text-xs text-zinc-400">Satoshi Nakamoto</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    The original paper that started it all. Essential reading for every Bitcoin learner.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-300 group-hover:text-orange-200">
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </div>
                </a>

                {/* The Little Book of Bitcoin */}
                <a
                  href="https://www.littlebitcoinbook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 transition hover:border-cyan-500/50 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-500/20 p-2">
                      <Book className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">The Little Book of Bitcoin</h3>
                      <p className="text-xs text-zinc-400">Bitcoin Foundation</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    A concise introduction to Bitcoin concepts. Perfect for beginners.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-300 group-hover:text-cyan-200">
                    <Download className="h-4 w-4" />
                    <span>Download / Read</span>
                  </div>
                </a>

                {/* The Little Book of Bitcoin in Tigrigna */}
                <Link
                  href="/chapters"
                  className="group rounded-lg border border-green-500/30 bg-green-500/10 p-4 transition hover:border-green-500/50 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/20 p-2">
                      <Book className="h-5 w-5 text-green-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">The Little Book of Bitcoin in Tigrigna</h3>
                      <p className="text-xs text-zinc-400">ትግርኛ ትርጉም</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    A simple, beginner-friendly introduction to Bitcoin translated into Tigrigna, explaining why it matters for financial freedom.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-300 group-hover:text-green-200">
                    <Download className="h-4 w-4" />
                    <span>PDF (Tigrigna) - Download in the chapters page</span>
                  </div>
                </Link>

                {/* Mastering Bitcoin */}
                <a
                  href="https://github.com/bitcoinbook/bitcoinbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 transition hover:border-purple-500/50 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/20 p-2">
                      <Book className="h-5 w-5 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">Mastering Bitcoin</h3>
                      <p className="text-xs text-zinc-400">Andreas M. Antonopoulos</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    Technical deep dive into Bitcoin. Essential for understanding Bitcoin at a deeper level.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-300 group-hover:text-purple-200">
                    <Download className="h-4 w-4" />
                    <span>Read Online / Download</span>
                  </div>
                </a>

                {/* The Bitcoin Standard */}
                <a
                  href="https://saifedean.com/thebitcoinstandard/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 transition hover:border-yellow-500/50 hover:bg-yellow-500/20 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-yellow-500/20 p-2">
                      <Book className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">The Bitcoin Standard</h3>
                      <p className="text-xs text-zinc-400">Saifedean Ammous</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    Economic perspective on Bitcoin as sound money and its role in the monetary system.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-300 group-hover:text-yellow-200">
                    <Download className="h-4 w-4" />
                    <span>Learn More</span>
                  </div>
                </a>

                {/* Programming Bitcoin */}
                <a
                  href="https://programmingbitcoin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 transition hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/20 p-2">
                      <Book className="h-5 w-5 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">Programming Bitcoin</h3>
                      <p className="text-xs text-zinc-400">Jimmy Song</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    Learn Bitcoin programming from scratch. Build Bitcoin from the ground up in Python.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300 group-hover:text-blue-200">
                    <Download className="h-4 w-4" />
                    <span>Get the Book</span>
                  </div>
                </a>

                {/* Bitcoin Development Resources */}
                <a
                  href="https://bitcoin.org/en/developer-documentation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-green-500/30 bg-green-500/10 p-4 transition hover:border-green-500/50 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/20 p-2">
                      <FileText className="h-5 w-5 text-green-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-100">Bitcoin Developer Docs</h3>
                      <p className="text-xs text-zinc-400">Bitcoin.org</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-300">
                    Official Bitcoin developer documentation and technical resources.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-300 group-hover:text-green-200">
                    <Download className="h-4 w-4" />
                    <span>Browse Docs</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Assignments & Tasks */}
            <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Assignments & Tasks</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-lg font-medium text-orange-300">Due Soon</h3>
                  <div className="space-y-2">
                    {assignments
                      .filter((a: any) => a.status === 'pending')
                      .map((assignment: any) => (
                        <Link
                          key={assignment.id}
                          href={assignment.link}
                          className="block rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 transition hover:border-orange-500/50 hover:bg-orange-500/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-100">{assignment.title}</span>
                            <span className="text-sm text-orange-300">Due: {assignment.dueDate}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-medium text-green-300">Completed</h3>
                  <div className="space-y-2">
                    {assignments
                      .filter((a: any) => a.status === 'completed')
                      .map((assignment: any) => (
                        <Link
                          key={assignment.id}
                          href={assignment.link}
                          className="block rounded-lg border border-green-500/30 bg-green-500/10 p-4 transition hover:border-green-500/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">✔</span>
                            <span className="font-medium text-zinc-100">{assignment.title}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>


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
                          Complete all 20 chapters
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
                          Pass final assessment
                        </span>
                      </div>
                      <span className="text-zinc-500">
                        {hasPassedFinalAssessment ? 'Passed' : 'Not completed'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <button
                  disabled={certificationProgress < 100}
                  className={`rounded-lg px-6 py-3 font-semibold transition ${
                    certificationProgress >= 100
                      ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-black hover:brightness-110'
                      : 'border border-zinc-700 bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {certificationProgress >= 100
                    ? 'Download Certificate'
                    : `Download Certificate (${certificationProgress}% Complete)`}
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

