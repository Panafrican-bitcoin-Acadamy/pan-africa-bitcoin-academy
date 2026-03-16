/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets a user-friendly password requirements message
 */
export function getPasswordRequirements(): string {
  return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
}

/** Per-requirement status for live feedback as the user types */
export type PasswordRequirementId = 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special';

export interface PasswordRequirementStatus {
  id: PasswordRequirementId;
  label: string;
  /** Tigrinya translation shown beside the requirement */
  labelTigrinya: string;
  met: boolean;
}

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Returns each requirement with whether it's met by the current password.
 * Use this to show a list that turns green as the user types.
 */
export function getPasswordRequirementStatuses(password: string): PasswordRequirementStatus[] {
  return [
    {
      id: 'minLength',
      label: 'Minimum 8 characters',
      labelTigrinya: 'ብውሑዱ 8 ቃላት ተጠቀም',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter',
      labelTigrinya: 'ሓንቲ ካብ ፊደላት ግድነት ብዓቢ ጸሓፍ',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter',
      labelTigrinya: 'ሓንቲ ካብተን ቃላት ግድነት ብንእሽተይ ጸሓፋ',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least 1 number',
      labelTigrinya: 'ግድነት ተወሓደ ሓንት ቁጽሪ ተጠቀም',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special character',
      labelTigrinya: 'ብውሕዱ ሓንቲ ካብዚ ተጠተቐም (!@#$%^&*_?><|)',
      met: SPECIAL_CHARS_REGEX.test(password),
    },
  ];
}

/** Section heading for requirements list: English / Tigrinya */
export const PASSWORD_REQUIREMENTS_HEADING = 'Requirements';
export const PASSWORD_REQUIREMENTS_HEADING_TIGRINYA = 'ከተማልኦም ዘለካ';



