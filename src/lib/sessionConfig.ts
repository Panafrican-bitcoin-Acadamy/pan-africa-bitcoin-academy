/**
 * Session timeout configuration — single source of truth for how long a user
 * can stay inactive after login. Used by both server (session.ts) and client (sessionClient.ts).
 *
 * Optional env overrides (server only): SESSION_IDLE_MINUTES, SESSION_ABSOLUTE_HOURS,
 * REMEMBER_ME_IDLE_DAYS, REMEMBER_ME_ABSOLUTE_DAYS, ADMIN_SESSION_IDLE_MINUTES, ADMIN_SESSION_ABSOLUTE_HOURS
 */

// Student (no "remember me"): idle = no activity; absolute = max session length
const STUDENT_IDLE_MINUTES = 90; // 1.5 hours
const STUDENT_ABSOLUTE_HOURS = 3;

// Student ("remember me" checked)
const REMEMBER_ME_IDLE_DAYS = 7;
const REMEMBER_ME_ABSOLUTE_DAYS = 30;

// Admin
const ADMIN_IDLE_MINUTES = 4 * 60; // 4 hours
const ADMIN_ABSOLUTE_HOURS = 8;

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const sessionTimeouts = {
  /** Idle timeout for students (no remember me): 1.5 hours */
  studentIdleMs: STUDENT_IDLE_MINUTES * MIN,
  /** Absolute max session for students (no remember me): 3 hours */
  studentAbsoluteMs: STUDENT_ABSOLUTE_HOURS * HOUR,
  /** Idle timeout for students with remember me: 7 days */
  rememberMeIdleMs: REMEMBER_ME_IDLE_DAYS * DAY,
  /** Absolute max session for students with remember me: 30 days */
  rememberMeAbsoluteMs: REMEMBER_ME_ABSOLUTE_DAYS * DAY,
  /** Idle timeout for admin: 4 hours */
  adminIdleMs: ADMIN_IDLE_MINUTES * MIN,
  /** Absolute max session for admin: 8 hours */
  adminAbsoluteMs: ADMIN_ABSOLUTE_HOURS * HOUR,
} as const;

/** For client-side inactivity check: use same idle limits as server (student = 1.5 h, admin = 4 h) */
export function getInactivityLimitMs(userType: 'admin' | 'student'): number {
  return userType === 'admin' ? sessionTimeouts.adminIdleMs : sessionTimeouts.studentIdleMs;
}
