'use client';

import { useEffect } from 'react';
import { X, BookOpen, Clock, CheckCircle } from 'lucide-react';

interface Chapter {
  id: number;
  number: number;
  title: string;
  difficulty: string;
  time: string;
  type: string;
  learnPoints: string[];
  activities: string[];
  level: number;
}

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  levels: Array<{ id: number; name: string; description: string }>;
}

export function SyllabusModal({ isOpen, onClose, chapters, levels }: SyllabusModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getLevelChapters = (levelId: number) => {
    return chapters.filter((ch) => ch.level === levelId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-400/30";
      case "Intermediate":
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      case "Advanced":
        return "bg-purple-500/20 text-purple-300 border-purple-400/30";
      default:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-400/30";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-cyan-400/30 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-cyan-400/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2">
              <BookOpen className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Course Syllabus</h2>
              <p className="text-sm text-zinc-400">Complete curriculum overview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Syllabus Content */}
        <div className="space-y-8">
          {levels.map((level) => {
            const levelChapters = getLevelChapters(level.id);
            return (
              <div key={level.id} className="rounded-lg border border-cyan-400/20 bg-zinc-950/50 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-cyan-300">{level.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{level.description}</p>
                </div>

                <div className="space-y-4">
                  {levelChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm font-medium text-cyan-400">
                              Chapter {chapter.number}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getDifficultyColor(
                                chapter.difficulty
                              )}`}
                            >
                              {chapter.difficulty}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-zinc-50">
                            {chapter.title}
                          </h4>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{chapter.time}</span>
                        </div>
                        <span>•</span>
                        <span className="capitalize">{chapter.type}</span>
                        {chapter.activities.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{chapter.activities.length} Activity{chapter.activities.length > 1 ? 'ies' : ''}</span>
                          </>
                        )}
                      </div>

                      <div className="mb-2">
                        <p className="mb-1 text-xs font-medium text-zinc-400">You will learn:</p>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {chapter.learnPoints.slice(0, 3).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-cyan-400" />
                              <span>{point}</span>
                            </li>
                          ))}
                          {chapter.learnPoints.length > 3 && (
                            <li className="text-cyan-400 pl-5">
                              + {chapter.learnPoints.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-cyan-400/20 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-orange-400 px-6 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

