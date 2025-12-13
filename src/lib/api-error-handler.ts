/**
 * Centralized API error handler
 */

export function handleApiError(error: unknown): {
  message: string;
  details?: string;
  status: number;
} {
  // Extract error message safely
  const message =
    error instanceof Error ? error.message : 'Internal server error';

  // Check if it's a known error type
  if (error instanceof Error) {
    // Session secret errors
    if (message.includes('SESSION_SECRET') || message.includes('ADMIN_SESSION_SECRET')) {
      return {
        message: 'Server configuration error',
        details:
          process.env.NODE_ENV === 'development'
            ? 'Session secret is not configured. Check server logs.'
            : undefined,
        status: 500,
      };
    }

    // Database connection errors
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('database') ||
      message.includes('connection')
    ) {
      return {
        message: 'Database connection error',
        details:
          process.env.NODE_ENV === 'development' ? message : undefined,
        status: 500,
      };
    }
  }

  // Generic error
  return {
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? message : undefined,
    status: 500,
  };
}
