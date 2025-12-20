/**
 * Achievement Notifications
 * Handles notifications when achievements are unlocked
 */

export interface AchievementNotification {
  achievementId: string;
  title: string;
  icon: string;
  satsReward: number;
  unlockedAt: string;
}

/**
 * Store achievement notification in localStorage for client-side display
 * This allows the frontend to show notifications even after page refresh
 */
export function storeAchievementNotification(notification: AchievementNotification): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = localStorage.getItem('achievement_notifications');
    const notifications: AchievementNotification[] = existing
      ? JSON.parse(existing)
      : [];

    // Add new notification
    notifications.push(notification);

    // Keep only last 10 notifications
    const recentNotifications = notifications.slice(-10);

    localStorage.setItem(
      'achievement_notifications',
      JSON.stringify(recentNotifications)
    );
  } catch (error) {
    console.error('Error storing achievement notification:', error);
  }
}

/**
 * Get pending achievement notifications
 */
export function getAchievementNotifications(): AchievementNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('achievement_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting achievement notifications:', error);
    return [];
  }
}

/**
 * Clear achievement notifications
 */
export function clearAchievementNotifications(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('achievement_notifications');
  } catch (error) {
    console.error('Error clearing achievement notifications:', error);
  }
}

/**
 * Remove a specific notification
 */
export function removeAchievementNotification(achievementId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const notifications = getAchievementNotifications();
    const filtered = notifications.filter((n) => n.achievementId !== achievementId);
    localStorage.setItem(
      'achievement_notifications',
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error('Error removing achievement notification:', error);
  }
}
