'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from './Calendar';
import { UserCircle2 } from 'lucide-react';

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'certification' | 'leaderboard'>('overview');
  const [studentData, setStudentData] = useState<any | null>(null);
  const [satsTotals, setSatsTotals] = useState<{ paid: number; pending: number }>({ paid: 0, pending: 0 });
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    // load stored email (from auth modal)
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
        const res = await fetch('/api/notion/students');
        if (!res.ok) {
          throw new Error(`Failed to load students (${res.status})`);
        }
        const data = await res.json();
        const students: any[] = data.students || [];
        // Prefer the first student that has a name; otherwise fallback to the first record
        const first = students.find((s) => s?.name) || students[0];
        if (mounted) {
          setStudentData(first || null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load student data');
        }
      }
    };

    const fetchSatsTotals = async () => {
      try {
        const res = await fetch('/api/notion/sats');
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
        const res = await fetch('/api/notion/leaderboard');
        if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`);
        const data = await res.json();
        if (mounted && Array.isArray(data.leaderboard)) {
          setLeaderboardData(data.leaderboard);
          setLeaderboardError(null);
        }
      } catch (err) {
        if (mounted) {
          setLeaderboardError('Could not load leaderboard data.');
        }
      }
    };

    Promise.all([fetchStudent(), fetchSatsTotals(), fetchLeaderboard()]).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchProfileByEmail = async (lookupEmail: string) => {
    if (!lookupEmail) {
      setProfileError('Email is required');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileData(null);
      const res = await fetch('/api/notion/profile/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      if (data.found) {
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
    totalChapters: 6,
    assignmentsCompleted: 0,
    totalAssignments: 4,
    satsEarned: 0,
    attendanceRate: 0,
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
  const chapters = student.chapters || [];
  const assignments = student.assignments || [];
  const resources = student.resources || [];
  const leaderboard = leaderboardData;
  const courseProgress = student.progressPercent ?? student.courseProgress ?? 0;
  const attendance = student.attendancePercent ?? student.attendanceRate ?? 0;
  const satsEarned = student.satsEarned ?? satsTotals.paid ?? 0;
  const satsPending = student.satsPending ?? satsTotals.pending ?? 0;
  const chaptersCompleted = student.chaptersCompleted ?? 0;
  const assignmentsCompleted = student.assignmentsCompleted ?? 0;

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
              const res = await fetch('/api/notion/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: storedProfileEmail || profileEmail, ...updatedData }),
              });
              if (!res.ok) throw new Error('Failed to update profile');
              const data = await res.json();
              setProfileData(data.profile);
              setIsEditingProfile(false);
              alert('Profile updated successfully!');
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            }
          }}
        />
        {/* Top bar: optional profile/settings */}
        <div className="mb-4 flex items-center justify-end">
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-cyan-500/50 hover:text-zinc-100"
            >
              <UserCircle2 className="h-5 w-5 text-cyan-300" />
              <span>{student.name || 'Student'}</span>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-2xl">
                <div className="px-3 py-2 text-xs text-zinc-500">Account</div>
                <button
                  onClick={() => {
                    setProfileModalOpen(true);
                    setProfileMenuOpen(false);
                    setProfileError(null);
                    setProfileData(null);
                    const emailToUse = storedProfileEmail || profileEmail;
                    if (emailToUse) {
                      setProfileEmail(emailToUse);
                      fetchProfileByEmail(emailToUse);
                    }
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Profile
                </button>
                <button className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800">
                  Change Password
                </button>
                <div className="px-3 py-2 text-xs text-zinc-500">Session</div>
                <button
                  onClick={() => {
                    // Clear stored email and session data
                    try {
                      localStorage.removeItem('profileEmail');
                    } catch (e) {
                      // ignore
                    }
                    // Redirect to home page
                    window.location.href = '/';
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-cyan-100">
            Loading student data from Notion...
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* 1️⃣ Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
            Welcome back, {student.name} 👋
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            Your journey to Bitcoin sovereignty continues.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-300">
            <span className="flex items-center gap-2">
              <span className="text-orange-400">Current Cohort:</span>
              {student.cohort || '—'}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-cyan-400">Role:</span>
              {student.role || student.status || 'Student'}
            </span>
          </div>
        </div>


        {/* Tabs for Overview, Certification, Leaderboard */}
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
                <Calendar />
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
                            {chaptersCompleted}/{student.totalChapters ?? 6}
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

            {/* 4️⃣ Learning Path */}
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Your Learning Path</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chapters.map((chapter: any) => (
                  <div
                    key={chapter.id}
                    className={`rounded-lg border p-4 transition ${
                      chapter.status === 'completed'
                        ? 'border-green-500/50 bg-green-500/10'
                        : chapter.status === 'in-progress'
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-zinc-700 bg-zinc-900/50 opacity-60'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-100">{chapter.title}</h3>
                      {chapter.status === 'completed' && (
                        <span className="text-green-400">✔</span>
                      )}
                      {chapter.status === 'in-progress' && (
                        <span className="text-orange-400">●</span>
                      )}
                      {chapter.status === 'locked' && (
                        <span className="text-zinc-500">🔒</span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-zinc-400">Time: {chapter.time}</p>
                    {chapter.status !== 'locked' && (
                      <Link
                        href={chapter.link}
                        className="inline-block rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/30"
                      >
                        {chapter.status === 'completed' ? 'Review Chapter →' : 'Continue →'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5️⃣ Assignments & Tasks */}
            <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Assignments & Tasks</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-lg font-medium text-orange-300">Due Soon</h3>
                  <div className="space-y-2">
                    {assignments
                      .filter((a) => a.status === 'pending')
                      .map((assignment) => (
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
                      .filter((a) => a.status === 'completed')
                      .map((assignment) => (
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


            {/* 7️⃣ Community Section */}
            <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Community</h2>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Link
                  href="https://chat.whatsapp.com/KpjlC90BGIj1EChMHsW6Ji"
                  target="_blank"
                  className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center font-medium text-green-300 transition hover:bg-green-500/20"
                >
                  Join WhatsApp
                </Link>
                <Link
                  href="https://nostr.com"
                  target="_blank"
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-center font-medium text-purple-300 transition hover:bg-purple-500/20"
                >
                  Join Nostr
                </Link>
                <button className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-center font-medium text-orange-300 transition hover:bg-orange-500/20">
                  Message a Mentor
                </button>
                <button className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 p-3 text-center font-medium text-zinc-300 transition hover:bg-zinc-500/20">
                  Ask a Question
                </button>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
                <span className="text-sm text-green-400">🟢 Mentor currently online</span>
              </div>
            </div>

            {/* 8️⃣ Resources Hub */}
            <div className="rounded-xl border border-zinc-700 bg-black/80 p-6">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Resources Hub</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {resources.map((resource: any, index: number) => (
                  <Link
                    key={index}
                    href={resource.link}
                    className="flex flex-col items-center rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 text-center transition hover:border-cyan-500/50 hover:bg-zinc-900"
                  >
                    <span className="mb-2 text-2xl">{resource.icon}</span>
                    <span className="text-sm font-medium text-zinc-300">{resource.title}</span>
                  </Link>
                ))}
              </div>
            </div>


            {/* 🔟 Support & Help */}
            <div className="rounded-xl border border-zinc-700 bg-black/80 p-6">
              <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Support & Help</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 text-center font-medium text-cyan-300 transition hover:bg-cyan-500/20">
                  Contact Mentor
                </button>
                <button className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center font-medium text-orange-300 transition hover:bg-orange-500/20">
                  Report Issue
                </button>
                <button className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 text-center font-medium text-purple-300 transition hover:bg-purple-500/20">
                  Request 1:1 Support
                </button>
                <Link
                  href="/faq"
                  className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 p-4 text-center font-medium text-zinc-300 transition hover:bg-zinc-500/20"
                >
                  FAQ
                </Link>
                <button className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center font-medium text-red-300 transition hover:bg-red-500/20">
                  Tutorials (Videos)
                </button>
                <Link
                  href="/blog/submit"
                  className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center font-medium text-green-300 transition hover:bg-green-500/20"
                >
                  Publish Blog Post
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certification' && (
          <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-50">Certification Progress</h2>
            <div className="space-y-6">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-6">
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Certification Progress</span>
                    <span className="font-semibold text-orange-400">33%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-cyan-500"
                      style={{ width: '33%' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-zinc-100">Requirements Remaining:</h3>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    <li>✓ Complete all 6 chapters</li>
                    <li>✓ Complete all 4 assignments</li>
                    <li>✗ Attend at least 80% of live sessions</li>
                    <li>✗ Earn at least 500 sats</li>
                    <li>✗ Pass final assessment</li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <button
                  disabled
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-semibold text-zinc-500"
                >
                  Download Certificate (Available upon completion)
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
            {leaderboardError && (
              <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                {leaderboardError}
              </div>
            )}
            {!loading && !leaderboardError && leaderboard.length === 0 && (
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        onImageChange(result);
                        // TODO: Upload to server/storage and save URL to Notion
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
                  <div><span className="text-zinc-400">Student ID:</span> {profile.studentId || '—'}</div>
                  <div><span className="text-zinc-400">Status:</span> {profile.status || '—'}</div>
                </div>
              )}
            </div>
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
            To change password, please contact support or use your auth provider. Passwords are not stored in Notion.
          </div>
        </div>
      </div>
    </div>
  );
}

