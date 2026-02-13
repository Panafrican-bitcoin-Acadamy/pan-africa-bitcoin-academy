/**
 * Audit logging utility for tracking critical admin actions
 * Provides centralized logging for security and compliance
 */

interface AuditLogEntry {
  action: string;
  adminId: string;
  adminEmail: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}

/**
 * Log an admin action for audit purposes
 */
export function logAdminAction(
  action: string,
  adminId: string,
  adminEmail: string,
  resourceType: string,
  options: {
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  } = {}
): void {
  const logEntry: AuditLogEntry = {
    action,
    adminId,
    adminEmail,
    resourceType,
    resourceId: options.resourceId,
    details: options.details,
    timestamp: new Date().toISOString(),
    ipAddress: options.ipAddress,
  };

  // Log to console (in production, this should go to a proper logging service)
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);

  // TODO: In production, also write to database or external logging service
  // Example: await supabaseAdmin.from('audit_logs').insert(logEntry);
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  APPLICATION_APPROVED: 'application.approved',
  APPLICATION_REJECTED: 'application.rejected',
  ATTENDANCE_UPLOADED: 'attendance.uploaded',
  STUDENT_DELETED: 'student.deleted',
  STUDENT_UPDATED: 'student.updated',
  COHORT_CREATED: 'cohort.created',
  COHORT_UPDATED: 'cohort.updated',
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  BLOG_APPROVED: 'blog.approved',
  BLOG_REJECTED: 'blog.rejected',
  ADMIN_LOGIN: 'admin.login',
  ADMIN_LOGOUT: 'admin.logout',
  FILE_UPLOADED: 'file.uploaded',
  DATA_EXPORTED: 'data.exported',
} as const;

