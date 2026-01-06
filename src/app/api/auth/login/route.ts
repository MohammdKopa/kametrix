import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/auth';
import { authLimiter, applyRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  validateEmail,
  logLoginSuccess,
  logLoginFailure,
  logRateLimitExceeded,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Apply rate limiting (5 requests per 15 minutes)
    const rateLimitResponse = await applyRateLimit(authLimiter, `login:${ip}`);
    if (rateLimitResponse) {
      // Log rate limit exceeded
      logRateLimitExceeded('/api/auth/login', ip).catch(console.error);
      return rateLimitResponse;
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password presence (don't validate format - user might have old password)
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: emailValidation.sanitized },
    });

    if (!user) {
      // Log failed login attempt (user not found)
      logLoginFailure(email, 'User not found', ip, userAgent).catch(console.error);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed login attempt (wrong password)
      logLoginFailure(email, 'Invalid password', ip, userAgent).catch(console.error);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Log successful login
    logLoginSuccess(user.id, ip, userAgent).catch(console.error);

    // Set session cookie in response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
