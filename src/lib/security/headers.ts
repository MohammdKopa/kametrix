import { NextResponse } from 'next/server';

/**
 * Security Headers Configuration
 *
 * Implements security best practices for HTTP headers
 * Based on OWASP recommendations and modern security standards
 */

export interface SecurityHeadersConfig {
  /** Allow embedding in iframes from same origin only */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  /** Content Security Policy configuration */
  csp?: {
    /** Allow inline scripts (less secure, but needed for some frameworks) */
    allowInlineScripts?: boolean;
    /** Allow inline styles */
    allowInlineStyles?: boolean;
    /** Additional script sources */
    scriptSrc?: string[];
    /** Additional style sources */
    styleSrc?: string[];
    /** Additional image sources */
    imgSrc?: string[];
    /** Additional connect sources (API calls) */
    connectSrc?: string[];
    /** Additional font sources */
    fontSrc?: string[];
    /** Frame ancestors */
    frameAncestors?: string[];
  };
  /** Enable HSTS (HTTP Strict Transport Security) */
  hsts?: {
    enabled: boolean;
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  /** Referrer Policy */
  referrerPolicy?: string;
  /** Permissions Policy (formerly Feature Policy) */
  permissionsPolicy?: Record<string, string[]>;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  frameOptions: 'SAMEORIGIN',
  csp: {
    allowInlineScripts: false,
    allowInlineStyles: true, // Required for styled-components/emotion
    scriptSrc: ['self'],
    styleSrc: ['self', 'unsafe-inline'],
    imgSrc: ['self', 'data:', 'blob:', 'https:'],
    connectSrc: ['self', 'https://api.vapi.ai', 'https://api.stripe.com', 'https://api.openrouter.ai', 'https://api.elevenlabs.io'],
    fontSrc: ['self', 'https://fonts.gstatic.com'],
    frameAncestors: ['self'],
  },
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: ['self'], // Needed for voice features
    geolocation: [],
    payment: ['self'],
  },
};

/**
 * Build Content Security Policy header value
 */
function buildCSP(config: SecurityHeadersConfig['csp'] = {}): string {
  const directives: string[] = [];

  // Default source
  directives.push("default-src 'self'");

  // Script sources
  const scriptSrc = ["'self'"];
  if (config.allowInlineScripts) {
    scriptSrc.push("'unsafe-inline'");
  }
  if (config.scriptSrc) {
    scriptSrc.push(...config.scriptSrc);
  }
  directives.push(`script-src ${scriptSrc.join(' ')}`);

  // Style sources
  const styleSrc = ["'self'"];
  if (config.allowInlineStyles) {
    styleSrc.push("'unsafe-inline'");
  }
  if (config.styleSrc) {
    styleSrc.push(...config.styleSrc.filter(s => s !== 'self' && s !== 'unsafe-inline'));
  }
  directives.push(`style-src ${styleSrc.join(' ')}`);

  // Image sources
  if (config.imgSrc && config.imgSrc.length > 0) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }

  // Connect sources (XHR, WebSocket, etc.)
  if (config.connectSrc && config.connectSrc.length > 0) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }

  // Font sources
  if (config.fontSrc && config.fontSrc.length > 0) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }

  // Frame ancestors
  if (config.frameAncestors && config.frameAncestors.length > 0) {
    directives.push(`frame-ancestors ${config.frameAncestors.join(' ')}`);
  }

  // Form action
  directives.push("form-action 'self'");

  // Base URI
  directives.push("base-uri 'self'");

  // Object source (prevent plugins)
  directives.push("object-src 'none'");

  // Upgrade insecure requests in production
  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Build Permissions Policy header value
 */
function buildPermissionsPolicy(permissions: Record<string, string[]> = {}): string {
  return Object.entries(permissions)
    .map(([feature, allowList]) => {
      if (allowList.length === 0) {
        return `${feature}=()`;
      }
      const values = allowList.map(v => v === 'self' ? 'self' : `"${v}"`).join(' ');
      return `${feature}=(${values})`;
    })
    .join(', ');
}

/**
 * Build HSTS header value
 */
function buildHSTS(config: SecurityHeadersConfig['hsts']): string | null {
  if (!config?.enabled || process.env.NODE_ENV !== 'production') {
    return null;
  }

  const parts = [`max-age=${config.maxAge || 31536000}`];
  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }
  if (config.preload) {
    parts.push('preload');
  }
  return parts.join('; ');
}

/**
 * Get all security headers as an object
 */
export function getSecurityHeaders(customConfig?: Partial<SecurityHeadersConfig>): Record<string, string> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const headers: Record<string, string> = {};

  // X-Frame-Options (legacy but still useful)
  if (config.frameOptions) {
    headers['X-Frame-Options'] = config.frameOptions;
  }

  // X-Content-Type-Options
  headers['X-Content-Type-Options'] = 'nosniff';

  // X-XSS-Protection (legacy but still provides protection in older browsers)
  headers['X-XSS-Protection'] = '1; mode=block';

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers['Referrer-Policy'] = config.referrerPolicy;
  }

  // Content-Security-Policy
  if (config.csp) {
    headers['Content-Security-Policy'] = buildCSP(config.csp);
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    headers['Permissions-Policy'] = buildPermissionsPolicy(config.permissionsPolicy);
  }

  // HSTS
  const hsts = buildHSTS(config.hsts);
  if (hsts) {
    headers['Strict-Transport-Security'] = hsts;
  }

  // Cross-Origin headers
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';
  headers['Cross-Origin-Resource-Policy'] = 'same-origin';

  return headers;
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  customConfig?: Partial<SecurityHeadersConfig>
): NextResponse {
  const headers = getSecurityHeaders(customConfig);

  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }

  return response;
}

/**
 * Create a NextResponse with security headers already applied
 */
export function createSecureResponse(
  body: BodyInit | null,
  init?: ResponseInit,
  headerConfig?: Partial<SecurityHeadersConfig>
): NextResponse {
  const response = new NextResponse(body, init);
  return applySecurityHeaders(response, headerConfig);
}

/**
 * Create a JSON response with security headers
 */
export function secureJsonResponse<T>(
  data: T,
  init?: Omit<ResponseInit, 'headers'> & { headers?: Record<string, string> },
  headerConfig?: Partial<SecurityHeadersConfig>
): NextResponse {
  const response = NextResponse.json(data, init);
  return applySecurityHeaders(response, headerConfig);
}
