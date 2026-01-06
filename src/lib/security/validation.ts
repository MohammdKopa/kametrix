/**
 * Input Validation Utilities
 *
 * Comprehensive input validation with security-focused rules
 * Helps prevent XSS, injection attacks, and malformed input
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  strength?: 'weak' | 'medium' | 'strong' | 'very-strong';
  suggestions?: string[];
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email exceeds maximum length' };
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Password complexity requirements
 */
export interface PasswordRequirements {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  disallowCommonPasswords?: boolean;
}

const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional but recommended
  disallowCommonPasswords: true,
};

// Common passwords to reject (top 100 most common)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'football', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'welcome', 'login', 'admin', 'princess', 'starwars', 'passw0rd',
  'password1', '12345678910', '1234567890', 'test', 'guest', 'hello', 'charlie',
  'donald', 'password123', 'qwerty123', 'admin123', 'root', 'toor', 'pass',
]);

/**
 * Validate password with complexity requirements
 */
export function validatePassword(
  password: unknown,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  const suggestions: string[] = [];
  let strengthScore = 0;

  // Length checks
  const minLen = requirements.minLength ?? 8;
  const maxLen = requirements.maxLength ?? 128;

  if (password.length < minLen) {
    return {
      valid: false,
      error: `Password must be at least ${minLen} characters long`,
      suggestions: [`Use at least ${minLen} characters`],
    };
  }

  if (password.length > maxLen) {
    return {
      valid: false,
      error: `Password exceeds maximum length of ${maxLen} characters`,
    };
  }

  // Character requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (requirements.requireUppercase && !hasUppercase) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
      suggestions: ['Add an uppercase letter (A-Z)'],
    };
  }

  if (requirements.requireLowercase && !hasLowercase) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
      suggestions: ['Add a lowercase letter (a-z)'],
    };
  }

  if (requirements.requireNumber && !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
      suggestions: ['Add a number (0-9)'],
    };
  }

  if (requirements.requireSpecial && !hasSpecial) {
    return {
      valid: false,
      error: 'Password must contain at least one special character',
      suggestions: ['Add a special character (!@#$%^&*)'],
    };
  }

  // Common password check
  if (requirements.disallowCommonPasswords) {
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      return {
        valid: false,
        error: 'This password is too common. Please choose a more unique password.',
        suggestions: ['Avoid common passwords like "password", "123456", etc.'],
      };
    }
  }

  // Calculate strength score
  if (password.length >= 8) strengthScore += 1;
  if (password.length >= 12) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;
  if (hasUppercase) strengthScore += 1;
  if (hasLowercase) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasSpecial) strengthScore += 2;

  // Add suggestions for improving password
  if (!hasSpecial) suggestions.push('Add special characters for extra security');
  if (password.length < 12) suggestions.push('Consider using 12+ characters');
  if (!hasUppercase || !hasLowercase) suggestions.push('Mix uppercase and lowercase letters');

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (strengthScore <= 3) strength = 'weak';
  else if (strengthScore <= 5) strength = 'medium';
  else if (strengthScore <= 7) strength = 'strong';
  else strength = 'very-strong';

  return {
    valid: true,
    strength,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Sanitize string input by removing potentially dangerous characters
 * Used for user-provided text that will be displayed
 */
export function sanitizeString(
  input: unknown,
  options: {
    maxLength?: number;
    allowedChars?: RegExp;
    stripHtml?: boolean;
    trimWhitespace?: boolean;
  } = {}
): ValidationResult {
  if (input === null || input === undefined) {
    return { valid: true, sanitized: '' };
  }

  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  let sanitized = input;

  // Trim whitespace by default
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  // Strip HTML tags if requested
  if (options.stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove null bytes (can cause issues in many systems)
  sanitized = sanitized.replace(/\0/g, '');

  // Apply max length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Filter to allowed characters if specified
  if (options.allowedChars) {
    sanitized = sanitized
      .split('')
      .filter((char) => options.allowedChars!.test(char))
      .join('');
  }

  return { valid: true, sanitized };
}

/**
 * Validate a URL
 */
export function validateUrl(
  url: unknown,
  options: {
    allowedProtocols?: string[];
    requireHttps?: boolean;
    maxLength?: number;
  } = {}
): ValidationResult {
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    return { valid: false, error: `URL exceeds maximum length of ${options.maxLength}` };
  }

  try {
    const parsed = new URL(trimmed);

    // Check allowed protocols
    const allowedProtocols = options.allowedProtocols || ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { valid: false, error: `Invalid protocol. Allowed: ${allowedProtocols.join(', ')}` };
    }

    // Require HTTPS in production
    if (options.requireHttps && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTPS' };
    }

    return { valid: true, sanitized: trimmed };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate a numeric value within a range
 */
export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    allowFloat?: boolean;
    required?: boolean;
  } = {}
): ValidationResult & { value?: number } {
  if (value === null || value === undefined || value === '') {
    if (options.required) {
      return { valid: false, error: 'Value is required' };
    }
    return { valid: true };
  }

  let num: number;

  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = options.allowFloat ? parseFloat(value) : parseInt(value, 10);
  } else {
    return { valid: false, error: 'Value must be a number' };
  }

  if (isNaN(num)) {
    return { valid: false, error: 'Invalid number' };
  }

  if (!options.allowFloat && !Number.isInteger(num)) {
    return { valid: false, error: 'Value must be an integer' };
  }

  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: `Value must be at least ${options.min}` };
  }

  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: `Value must be at most ${options.max}` };
  }

  return { valid: true, value: num };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: unknown): ValidationResult {
  if (typeof uuid !== 'string') {
    return { valid: false, error: 'UUID must be a string' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, sanitized: uuid.toLowerCase() };
}

/**
 * Check request body size (in bytes)
 */
export function validateRequestBodySize(
  body: string | Buffer,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): ValidationResult {
  const size = typeof body === 'string' ? Buffer.byteLength(body, 'utf8') : body.length;

  if (size > maxSizeBytes) {
    return {
      valid: false,
      error: `Request body exceeds maximum size of ${Math.round(maxSizeBytes / 1024)}KB`,
    };
  }

  return { valid: true };
}

/**
 * Validate an array of values
 */
export function validateArray<T>(
  array: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    itemValidator?: (item: unknown, index: number) => ValidationResult;
  } = {}
): ValidationResult & { items?: T[] } {
  if (array === null || array === undefined) {
    if (options.required) {
      return { valid: false, error: 'Array is required' };
    }
    return { valid: true, items: [] };
  }

  if (!Array.isArray(array)) {
    return { valid: false, error: 'Value must be an array' };
  }

  if (options.minLength !== undefined && array.length < options.minLength) {
    return { valid: false, error: `Array must have at least ${options.minLength} items` };
  }

  if (options.maxLength !== undefined && array.length > options.maxLength) {
    return { valid: false, error: `Array must have at most ${options.maxLength} items` };
  }

  if (options.itemValidator) {
    for (let i = 0; i < array.length; i++) {
      const result = options.itemValidator(array[i], i);
      if (!result.valid) {
        return { valid: false, error: `Item ${i + 1}: ${result.error}` };
      }
    }
  }

  return { valid: true, items: array as T[] };
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
  };

  return str.replace(/[&<>"'`]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phone: unknown): ValidationResult {
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone number must be a string' };
  }

  // Remove common separators and spaces
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

  // Check for valid characters
  if (!/^[\+]?[0-9]{7,15}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true, sanitized: cleaned };
}
