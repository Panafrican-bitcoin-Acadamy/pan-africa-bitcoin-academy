'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface StudentProgressModalProps {
  studentId: string;
  studentEmail: string;
  studentName: string;
  onClose: () => void;
}

interface DetailedProgress {
  chapters: Array<{
    chapterNumber: number;
    chapterSlug: string;
    isCompleted: boolean;
    isUnlocked: boolean;
    completedAt?: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    submittedAt?: string;
    isCorrect?: boolean;
  }>;
  attendance: {
    lecturesAttended: number;
    totalLectures: number;
    attendancePercent: number;
  };
  sats: {
    earned: number;
    pending: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    icon: string;
    earnedAt: string | null;
  }>;
  overallProgress: number;
}

export function StudentProgressModal({
  studentId,
  studentEmail,
  studentName,
  onClose,
}: StudentProgressModalProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<DetailedProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailedProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/students/progress/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentEmail }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch student progress');
        }

        setProgress(data.progress);
      } catch (err: any) {
        console.error('Error fetching detailed progress:', err);
        setError(err.message || 'Failed to load student progress');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedProgress();
  }, [studentEmail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-cyan-400/50 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-cyan-200">{studentName}</h2>
            <p className="text-sm text-zinc-400">{studentEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && progress && (
            <div className="space-y-6">
              {/* Overall Progress */}
              <div className="rounded-lg border border-cyan-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-cyan-200">Overall Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Course Completion</span>
                      <span className="font-semibold text-cyan-300">{progress.overallProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progress.overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters Progress */}
              <div className="rounded-lg border border-cyan-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-cyan-200">
                  Chapters Progress
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    ({progress.chapters.filter((c) => c.isCompleted).length}/{progress.chapters.length} completed)
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {progress.chapters.map((chapter) => (
                    <div
                      key={chapter.chapterNumber}
                      className={`rounded-lg border p-3 ${
                        chapter.isCompleted
                          ? 'border-green-500/50 bg-green-500/10'
                          : chapter.isUnlocked
                          ? 'border-cyan-500/30 bg-zinc-700/50'
                          : 'border-zinc-700/50 bg-zinc-800/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">
                          Chapter {chapter.chapterNumber}
                        </span>
                        {chapter.isCompleted ? (
                          <span className="text-xs text-green-400">✓ Completed</span>
                        ) : chapter.isUnlocked ? (
                          <span className="text-xs text-cyan-400">Unlocked</span>
                        ) : (
                          <span className="text-xs text-zinc-500">Locked</span>
                        )}
                      </div>
                      {chapter.completedAt && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Completed: {new Date(chapter.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignments Progress */}
              <div className="rounded-lg border border-orange-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-orange-200">
                  Assignments
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    ({progress.assignments.filter((a) => a.isCompleted).length}/{progress.assignments.length} completed)
                  </span>
                </h3>
                <div className="space-y-2">
                  {progress.assignments.length > 0 ? (
                    progress.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className={`rounded-lg border p-3 ${
                          assignment.isCompleted
                            ? assignment.isCorrect
                              ? 'border-green-500/50 bg-green-500/10'
                              : 'border-yellow-500/50 bg-yellow-500/10'
                            : 'border-zinc-700/50 bg-zinc-700/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-200">{assignment.title}</span>
                          {assignment.isCompleted ? (
                            <span
                              className={`text-xs ${
                                assignment.isCorrect ? 'text-green-400' : 'text-yellow-400'
                              }`}
                            >
                              {assignment.isCorrect ? '✓ Correct' : '⚠ Needs Review'}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">Not Submitted</span>
                          )}
                        </div>
                        {assignment.submittedAt && (
                          <p className="mt-1 text-xs text-zinc-400">
                            Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">No assignments found</p>
                  )}
                </div>
              </div>

              {/* Attendance */}
              <div className="rounded-lg border border-purple-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-purple-200">Attendance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Live Classes Attended</span>
                      <span className="font-semibold text-purple-300">
                        {progress.attendance.lecturesAttended}/{progress.attendance.totalLectures} (
                        {progress.attendance.attendancePercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                        style={{ width: `${progress.attendance.attendancePercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sats Rewards */}
              <div className="rounded-lg border border-yellow-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-yellow-200">Sats Rewards</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-400">Earned</p>
                    <p className="text-2xl font-bold text-yellow-300">{progress.sats.earned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{progress.sats.pending}</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="rounded-lg border border-cyan-400/25 bg-zinc-800/50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-cyan-200">
                  Achievements
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    ({progress.achievements.length} unlocked)
                  </span>
                </h3>
                {progress.achievements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {progress.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center"
                      >
                        <div className="mb-2 text-3xl">{achievement.icon}</div>
                        <p className="text-xs font-medium text-cyan-200">{achievement.title}</p>
                        {achievement.earnedAt && (
                          <p className="mt-1 text-xs text-zinc-400">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No achievements unlocked yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

