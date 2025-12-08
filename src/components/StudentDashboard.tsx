'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from './Calendar';

// Mock data - in production, this would come from an API
const studentData = {
  name: 'Sarah',
  cohort: 'Cohort 1 – Feb 2025',
  role: 'Student',
  courseProgress: 33,
  chaptersCompleted: 2,
  totalChapters: 6,
  assignmentsCompleted: 1,
  totalAssignments: 4,
  satsEarned: 350,
  attendanceRate: 75,
  nextAction: {
    type: 'live-session',
    title: 'Live Session Today at 7 PM EAT',
    action: 'Join Now',
    link: '#',
  },
  chapters: [
    {
      id: 1,
      title: 'Bitcoin Basics',
      status: 'completed',
      time: '10–15 min',
      link: '/chapters/bitcoin-basics',
    },
    {
      id: 2,
      title: 'Keys, Addresses, UTXOs',
      status: 'completed',
      time: '15–20 min',
      link: '/chapters/keys-addresses-utxos',
    },
    {
      id: 3,
      title: 'Transactions & Mempool',
      status: 'in-progress',
      time: '20–25 min',
      link: '/chapters/transactions-mempool',
    },
    {
      id: 4,
      title: 'Lightning Network',
      status: 'locked',
      time: '25–30 min',
      link: '/chapters/lightning-network',
    },
    {
      id: 5,
      title: 'Wallets & Security',
      status: 'locked',
      time: '20–25 min',
      link: '/chapters/wallets-security',
    },
    {
      id: 6,
      title: 'Building with Bitcoin',
      status: 'locked',
      time: '30–35 min',
      link: '/chapters/building-with-bitcoin',
    },
  ],
  assignments: [
    {
      id: 1,
      title: 'Wallet Setup',
      status: 'completed',
      dueDate: null,
      link: '#',
    },
    {
      id: 2,
      title: 'Decode a Transaction',
      status: 'pending',
      dueDate: 'Feb 10, 2025',
      link: '#',
    },
    {
      id: 3,
      title: 'Lightning Invoice Challenge',
      status: 'pending',
      dueDate: 'Feb 12, 2025',
      link: '#',
    },
    {
      id: 4,
      title: 'First Bitcoin Payment',
      status: 'completed',
      dueDate: null,
      link: '#',
    },
  ],
  liveSessions: [
    {
      id: 1,
      title: 'Week 3 Live Class',
      date: 'Feb 7, 2025',
      time: '7:00 PM EAT',
      type: 'upcoming',
      link: '#',
    },
    {
      id: 2,
      title: 'Office Hours with Mentors',
      date: 'Feb 8, 2025',
      time: '6:00 PM EAT',
      type: 'upcoming',
      link: '#',
    },
    {
      id: 3,
      title: 'Lightning Workshop',
      date: 'Feb 10, 2025',
      time: '8:00 PM EAT',
      type: 'upcoming',
      link: '#',
    },
  ],
  achievements: [
    { id: 1, title: 'Completed First Wallet', icon: '🎖', unlocked: true },
    { id: 2, title: 'Sent First Sats', icon: '🏆', unlocked: true },
    { id: 3, title: '3 Assignments Done', icon: '🎯', unlocked: false },
    { id: 4, title: 'Lightning User', icon: '⚡', unlocked: false },
    { id: 5, title: 'Recovery Master', icon: '🔐', unlocked: false },
  ],
  satsWallet: {
    totalEarned: 300,
    pendingRewards: 50,
  },
  resources: [
    { title: 'Beginner Guide', link: '#', icon: '📚' },
    { title: 'Recommended Wallets', link: '#', icon: '💼' },
    { title: 'Safety Checklist', link: '#', icon: '✅' },
    { title: 'Lightning Tools', link: '#', icon: '⚡' },
    { title: 'Testnet Faucet', link: '#', icon: '🚰' },
    { title: 'PDF Cheat Sheets', link: '#', icon: '📄' },
    { title: 'Extra Reading', link: '#', icon: '📖' },
    { title: 'YouTube Tutorials', link: '#', icon: '▶️' },
  ],
  leaderboard: [
    { rank: 1, name: 'Amina K.', sats: 850, assignments: 4, attendance: 100 },
    { rank: 2, name: 'David M.', sats: 720, assignments: 3, attendance: 95 },
    { rank: 3, name: 'Fatima A.', sats: 680, assignments: 3, attendance: 90 },
    { rank: 4, name: 'Sarah', sats: 350, assignments: 1, attendance: 75 },
  ],
};

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'certification' | 'leaderboard'>('overview');

  return (
    <div className="min-h-screen bg-black/95">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 1️⃣ Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
            Welcome back, {studentData.name} 👋
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            Your journey to Bitcoin sovereignty continues.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-300">
            <span className="flex items-center gap-2">
              <span className="text-orange-400">Current Cohort:</span>
              {studentData.cohort}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-cyan-400">Role:</span>
              {studentData.role}
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
                      <p className="mt-2 text-lg text-zinc-100">{studentData.nextAction.title}</p>
                    </div>
                    <Link
                      href={studentData.nextAction.link}
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 whitespace-nowrap ml-4"
                    >
                      {studentData.nextAction.action}
                    </Link>
                  </div>
                </div>
                
                {/* Achievements & Sats Wallet */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-xl border border-yellow-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <h2 className="mb-4 text-xl font-semibold text-zinc-50">Achievements</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {studentData.achievements.map((achievement) => (
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
                          {studentData.satsWallet.totalEarned} sats
                        </div>
                      </div>
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="text-sm text-zinc-400">Pending Rewards</div>
                        <div className="text-xl font-semibold text-yellow-300">
                          {studentData.satsWallet.pendingRewards} sats
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
                      <span className="font-semibold text-orange-400">{studentData.courseProgress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all"
                        style={{ width: `${studentData.courseProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">📘</div>
                      <div className="text-sm text-zinc-400">Chapters</div>
                      <div className="text-lg font-semibold text-cyan-300">
                        {studentData.chaptersCompleted}/{studentData.totalChapters}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">🛠</div>
                      <div className="text-sm text-zinc-400">Assignments</div>
                      <div className="text-lg font-semibold text-orange-300">
                        {studentData.assignmentsCompleted}/{studentData.totalAssignments}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">⚡</div>
                      <div className="text-sm text-zinc-400">Sats Earned</div>
                      <div className="text-lg font-semibold text-yellow-300">{studentData.satsEarned}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                      <div className="mb-2 text-2xl">🎓</div>
                      <div className="text-sm text-zinc-400">Attendance</div>
                      <div className="text-lg font-semibold text-purple-300">{studentData.attendanceRate}%</div>
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
                  {studentData.liveSessions.slice(0, 3).map((session) => (
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
                {studentData.chapters.map((chapter) => (
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
                    {studentData.assignments
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
                    {studentData.assignments
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
                  href="https://t.me/bitcoinacademy"
                  target="_blank"
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Join Telegram
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
                {studentData.resources.map((resource, index) => (
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sats</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Assignments</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.leaderboard.map((student) => (
                    <tr
                      key={student.rank}
                      className={`border-b border-zinc-800 ${
                        student.name === 'Sarah' ? 'bg-orange-500/10' : ''
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
                          #{student.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">{student.name}</td>
                      <td className="px-4 py-3 text-orange-300">{student.sats} sats</td>
                      <td className="px-4 py-3 text-cyan-300">{student.assignments}/4</td>
                      <td className="px-4 py-3 text-purple-300">{student.attendance}%</td>
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

