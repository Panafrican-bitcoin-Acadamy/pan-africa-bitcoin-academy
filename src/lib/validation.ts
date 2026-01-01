/**
 * Input validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) {
    return true; // Phone is optional
  }
  const digits = (phone.toString().match(/\d/g) || []).join('');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate email and return normalized version
 */
export function validateAndNormalizeEmail(email: unknown): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (!isValidEmail(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, normalized: trimmed.toLowerCase() };
}

/**
 * Validate password strength
 */
export function validatePassword(password: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }

  return { valid: true };
}

