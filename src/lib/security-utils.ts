/**
 * Security utilities for input validation and protection
 * Protects against SQL injection, XSS, CSRF, and other attacks
 */

import { containsSQLInjection, containsXSS, validateAndSanitizeInput } from './input-security';
import { validateAndNormalizeEmail, sanitizeName, sanitizeTextContent } from './validation';

/**
 * Validate request body has valid structure and size
 */
export function validateRequestBody(body: any, maxSize: number = 100000): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  // Check body size (rough estimate)
  const bodyString = JSON.stringify(body);
  if (bodyString.length > maxSize) {
    return { valid: false, error: 'Request body too large' };
  }

  return { valid: true };
}

/**
 * Comprehensive input sanitization for API routes
 */
export function sanitizeInput(
  input: unknown,
  type: 'email' | 'name' | 'text' | 'phone' | 'url' | 'content' | 'number',
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  } = {}
): { valid: boolean; sanitized?: string | number; error?: string } {
  return validateAndSanitizeInput(input, {
    type,
    required: options.required,
    maxLength: options.maxLength,
    minLength: options.minLength,
    allowHTML: false,
  });
}

/**
 * Validate and sanitize email input
 */
export function secureEmailInput(email: unknown): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Check for SQL injection patterns
  if (containsSQLInjection(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for XSS patterns
  if (containsXSS(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Normalize email
  const result = validateAndNormalizeEmail(email);
  
  // Double-check normalized email
  if (result.normalized && (containsSQLInjection(result.normalized) || containsXSS(result.normalized))) {
    return { valid: false, error: 'Invalid email format' };
  }

  return result;
}

/**
 * Validate and sanitize name input
 */
export function secureNameInput(name: unknown, maxLength: number = 100): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  // Check for SQL injection
  if (containsSQLInjection(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  // Check for XSS
  if (containsXSS(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  // Sanitize name
  const sanitized = sanitizeName(name, maxLength);
  
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters and contain only letters' };
  }

  // Final security check on sanitized value
  if (containsSQLInjection(sanitized) || containsXSS(sanitized)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize text content input
 */
export function secureTextInput(
  text: unknown,
  options: { required?: boolean; maxLength?: number; minLength?: number } = {}
): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!text) {
    if (options.required) {
      return { valid: false, error: 'Text content is required' };
    }
    return { valid: true, sanitized: '' };
  }

  if (typeof text !== 'string') {
    return { valid: false, error: 'Text content must be a string' };
  }

  // Check for SQL injection
  if (containsSQLInjection(text)) {
    return { valid: false, error: 'Content contains potentially dangerous content' };
  }

  // Check for XSS
  if (containsXSS(text)) {
    return { valid: false, error: 'Content contains potentially dangerous content' };
  }

  // Sanitize content
  const maxLength = options.maxLength || 50000;
  const sanitized = sanitizeTextContent(text, maxLength);

  // Validate length
  if (options.minLength && sanitized.length < options.minLength) {
    return { valid: false, error: `Content must be at least ${options.minLength} characters` };
  }

  // Final security check
  if (containsSQLInjection(sanitized) || containsXSS(sanitized)) {
    return { valid: false, error: 'Content contains potentially dangerous content' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize phone number input
 */
export function securePhoneInput(phone: unknown): {
  valid: boolean;
  sanitized?: string | null;
  error?: string;
} {
  if (!phone) {
    return { valid: true, sanitized: null };
  }

  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { valid: false, error: 'Phone must be a string or number' };
  }

  const phoneStr = String(phone);
  
  // Check for SQL injection
  if (containsSQLInjection(phoneStr)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  // Sanitize phone (keep only digits, spaces, hyphens, parentheses, +)
  const sanitized = phoneStr.replace(/[^\d\s\-\(\)\+]/g, '').trim().substring(0, 20);

  // Validate phone length (7-15 digits)
  const digits = sanitized.match(/\d/g);
  if (!digits || digits.length < 7 || digits.length > 15) {
    return { valid: false, error: 'Phone number must contain 7-15 digits' };
  }

  return { valid: true, sanitized: sanitized || null };
}

/**
 * Validate and sanitize numeric input
 */
export function secureNumberInput(
  num: unknown,
  options: { min?: number; max?: number; required?: boolean } = {}
): {
  valid: boolean;
  sanitized?: number;
  error?: string;
} {
  if (!num && num !== 0) {
    if (options.required) {
      return { valid: false, error: 'Number is required' };
    }
    return { valid: true, sanitized: undefined };
  }

  if (typeof num === 'number') {
    if (options.min !== undefined && num < options.min) {
      return { valid: false, error: `Number must be at least ${options.min}` };
    }
    if (options.max !== undefined && num > options.max) {
      return { valid: false, error: `Number must be at most ${options.max}` };
    }
    return { valid: true, sanitized: num };
  }

  if (typeof num === 'string') {
    // Check for SQL injection
    if (containsSQLInjection(num)) {
      return { valid: false, error: 'Invalid number format' };
    }

    const parsed = parseFloat(num);
    if (isNaN(parsed)) {
      return { valid: false, error: 'Invalid number format' };
    }

    if (options.min !== undefined && parsed < options.min) {
      return { valid: false, error: `Number must be at least ${options.min}` };
    }
    if (options.max !== undefined && parsed > options.max) {
      return { valid: false, error: `Number must be at most ${options.max}` };
    }

    return { valid: true, sanitized: parsed };
  }

  return { valid: false, error: 'Number must be a valid number' };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: unknown): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  
  return response;
}

/**
 * Validate request size
 */
export function validateRequestSize(body: any, maxSize: number = 100000): boolean {
  try {
    const size = JSON.stringify(body).length;
    return size <= maxSize;
  } catch {
    return false;
  }
}

