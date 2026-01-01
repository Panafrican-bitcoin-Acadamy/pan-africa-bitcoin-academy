/**
 * Input Security and Sanitization Utilities
 * Protects against XSS, injection attacks, and malicious input
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and escapes special characters
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  sanitized = sanitized.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
  
  return sanitized.trim();
}

/**
 * Sanitize text input (removes HTML, scripts, and dangerous characters)
 */
export function sanitizeText(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script content (basic protection)
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Apply length limit if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize name input (allows letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(input: string, maxLength: number = 100): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Allow letters, spaces, hyphens, apostrophes, and basic Unicode letters
  let sanitized = input.replace(/[^a-zA-Z\s\-\'\u00C0-\u017F]/g, '');
  
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize email input (validates format and removes dangerous characters)
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim and lowercase
  let sanitized = input.trim().toLowerCase();
  
  // Remove whitespace
  sanitized = sanitized.replace(/\s/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return ''; // Return empty if invalid format
  }
  
  // Limit length
  if (sanitized.length > 254) { // RFC 5321 limit
    sanitized = sanitized.substring(0, 254);
  }
  
  return sanitized;
}

/**
 * Sanitize phone number (keeps only digits and common separators)
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Keep only digits, spaces, hyphens, parentheses, and +
  let sanitized = input.replace(/[^\d\s\-\(\)\+]/g, '');
  
  // Trim
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }
  
  return sanitized;
}

/**
 * Sanitize URL input
 */
export function sanitizeURL(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/^(javascript|data|vbscript):/gi, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Limit length
  if (sanitized.length > 2048) {
    sanitized = sanitized.substring(0, 2048);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: string | number, min?: number, max?: number): number | null {
  if (typeof input === 'number') {
    if (min !== undefined && input < min) return null;
    if (max !== undefined && input > max) return null;
    return input;
  }
  
  if (typeof input !== 'string') {
    return null;
  }

  // Remove all non-numeric characters (except decimal point and minus)
  const cleaned = input.replace(/[^\d.\-]/g, '');
  
  const number = parseFloat(cleaned);
  
  if (isNaN(number)) {
    return null;
  }
  
  if (min !== undefined && number < min) return null;
  if (max !== undefined && number > max) return null;
  
  return number;
}

/**
 * Sanitize JSON input (for API submissions)
 */
export function sanitizeJSONString(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Limit length first
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input;
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Try to parse as JSON to validate
  try {
    JSON.parse(sanitized);
    return sanitized;
  } catch {
    // If invalid JSON, return empty string
    return '';
  }
}

/**
 * Validate and sanitize text content (for blog posts, assignments, etc.)
 */
export function sanitizeContent(input: string, maxLength: number = 50000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\x00/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate string length
 */
export function validateLength(input: string, min: number, max: number): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate that input contains only allowed characters
 */
export function validateCharacters(input: string, allowedPattern: RegExp): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  return allowedPattern.test(input);
}

/**
 * Check for SQL injection patterns (basic detection)
 * Note: Supabase uses parameterized queries, but this adds extra validation
 */
export function containsSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|OR|AND)\s+\d+\s*=\s*\d+)/i,
    /('|(\\')|(;)|(--)|(\*)|(%)|(\+))/i,
    /\/\*|\*\//,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXSS(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation and sanitization
 */
export function validateAndSanitizeInput(input: unknown, options: {
  type: 'text' | 'email' | 'name' | 'phone' | 'url' | 'content' | 'number';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  allowHTML?: boolean;
}): {
  valid: boolean;
  sanitized?: string | number;
  error?: string;
} {
  // Check if input is provided (if required)
  if (options.required && (!input || (typeof input === 'string' && input.trim().length === 0))) {
    return { valid: false, error: 'This field is required' };
  }

  // If not required and empty, return valid
  if (!input || (typeof input === 'string' && input.trim().length === 0)) {
    return { valid: true, sanitized: '' };
  }

  // Type validation
  if (typeof input !== 'string' && options.type !== 'number') {
    return { valid: false, error: 'Invalid input type' };
  }

  let sanitized: string | number = '';

  switch (options.type) {
    case 'text':
      sanitized = sanitizeText(input as string, options.maxLength);
      break;
    case 'email':
      sanitized = sanitizeEmail(input as string);
      if (!sanitized) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;
    case 'name':
      sanitized = sanitizeName(input as string, options.maxLength || 100);
      break;
    case 'phone':
      sanitized = sanitizePhone(input as string);
      break;
    case 'url':
      sanitized = sanitizeURL(input as string);
      break;
    case 'content':
      sanitized = sanitizeContent(input as string, options.maxLength || 50000);
      break;
    case 'number':
      const num = sanitizeNumber(input as string | number, undefined, undefined);
      if (num === null) {
        return { valid: false, error: 'Invalid number' };
      }
      sanitized = num;
      break;
  }

  // Length validation
  if (typeof sanitized === 'string') {
    if (options.minLength && sanitized.length < options.minLength) {
      return { valid: false, error: `Minimum length is ${options.minLength} characters` };
    }
    if (options.maxLength && sanitized.length > options.maxLength) {
      return { valid: false, error: `Maximum length is ${options.maxLength} characters` };
    }

    // Security checks
    if (containsSQLInjection(sanitized)) {
      return { valid: false, error: 'Input contains potentially dangerous content' };
    }
    
    if (!options.allowHTML && containsXSS(sanitized)) {
      return { valid: false, error: 'Input contains potentially dangerous content' };
    }
  }

  return { valid: true, sanitized };
}

