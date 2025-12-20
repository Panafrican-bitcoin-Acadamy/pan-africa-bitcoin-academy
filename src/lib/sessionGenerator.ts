/**
 * Session Generator Utility
 * Generates cohort sessions based on start/end dates
 * Rules: 3 sessions per week, excluding Sundays
 */

interface SessionDate {
  date: Date;
  sessionNumber: number;
}

/**
 * Generate session dates for a cohort
 * @param startDate - Cohort start date (inclusive)
 * @param endDate - Cohort end date (inclusive)
 * @returns Array of session dates with session numbers
 */
export function generateCohortSessions(
  startDate: Date,
  endDate: Date
): SessionDate[] {
  const sessions: SessionDate[] = [];
  let sessionNumber = 1;
  
  // Start from the start date
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Track sessions per week (Monday to Sunday)
  let sessionsThisWeek = 0;
  let currentWeekStart: Date | null = null;
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Skip Sundays (day 0)
    if (dayOfWeek !== 0) {
      // Determine the start of the current week (Monday)
      // If it's Monday (day 1), that's the week start
      // Otherwise, go back to the previous Monday
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      // Check if we've moved to a new week
      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        // New week started, reset counter
        sessionsThisWeek = 0;
        currentWeekStart = weekStart;
      }
      
      // Add session if we haven't reached 3 sessions this week
      if (sessionsThisWeek < 3) {
        sessions.push({
          date: new Date(currentDate),
          sessionNumber: sessionNumber++,
        });
        sessionsThisWeek++;
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return sessions;
}

/**
 * Validate cohort dates for session generation
 */
export function validateCohortDates(startDate: Date | string | null, endDate: Date | string | null): {
  valid: boolean;
  error?: string;
} {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Start date and end date are required' };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  return { valid: true };
}
