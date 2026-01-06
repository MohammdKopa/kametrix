import { NextRequest, NextResponse } from 'next/server';

/**
 * Security-Enhanced Middleware
 *
 * Provides:
 * - Authentication checking
 * - Security headers injection
 * - Request validation
 * - Suspicious activity detection
 */

// Paths to skip authentication check
const publicPaths = [
  '/api/auth',
  '/api/webhooks',
  '/login',
  '/register',
  '/',
];

// Paths that are completely public (no security headers modification needed)
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Security headers for all responses
 * These provide defense-in-depth against various attacks
 */
function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';

  const headers: Record<string, string> = {
    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy - don't leak full URLs
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions/Feature policy
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self), payment=(self)',

    // Cross-origin isolation
    'Cross-Origin-Opener-Policy': 'same-origin',
  };

  // Add HSTS in production
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Content Security Policy
  // Note: Using Report-Only initially to avoid breaking functionality
  // Switch to 'Content-Security-Policy' once validated
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for styled components
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.vapi.ai https://api.stripe.com https://api.openrouter.ai https://api.elevenlabs.io wss:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  if (isProduction) {
    cspDirectives.push('upgrade-insecure-requests');
  }

  // Use report-only mode initially for monitoring
  headers['Content-Security-Policy-Report-Only'] = cspDirectives.join('; ');

  return headers;
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();

  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }

  return response;
}

/**
 * Check for suspicious request patterns
 */
function isSuspiciousRequest(request: NextRequest): boolean {
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '';

  // Check for common attack patterns in URL
  const suspiciousPatterns = [
    /\.\.\//,           // Directory traversal
    /<script/i,         // XSS attempt in URL
    /union.*select/i,   // SQL injection
    /exec\(/i,          // Command injection
    /\0/,               // Null byte
    /%00/,              // URL encoded null byte
    /\x00/,             // Hex null byte
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.warn(`[SECURITY] Suspicious URL pattern detected: ${url.substring(0, 200)}`);
      return true;
    }
  }

  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    // Don't block, but log for monitoring
    console.log(`[SECURITY] Request with minimal/no user agent from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
  }

  return false;
}

/**
 * Validate session token format
 * Session tokens should be 64-character hex strings
 */
function isValidSessionFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets entirely
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for suspicious requests
  if (isSuspiciousRequest(request)) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Handle public paths - still apply security headers
  if (publicPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    // Redirect to login for page routes, return 401 for API routes
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      return applySecurityHeaders(response);
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(response);
  }

  // Validate session token format
  if (!isValidSessionFormat(sessionCookie.value)) {
    console.warn(`[SECURITY] Invalid session token format from ${request.headers.get('x-forwarded-for') || 'unknown'}`);

    // Clear the invalid cookie and redirect to login
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
      response.cookies.delete('session');
      return applySecurityHeaders(response);
    }

    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return applySecurityHeaders(response);
  }

  // For admin paths, we'll validate the role in the actual route handlers
  // since middleware can't access the database in edge runtime
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
