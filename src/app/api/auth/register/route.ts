import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { registerLimiter, applyRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  validateEmail,
  validatePassword,
  sanitizeString,
  logRegistration,
  logRateLimitExceeded,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Apply rate limiting (3 requests per hour)
    const rateLimitResponse = await applyRateLimit(registerLimiter, `register:${ip}`);
    if (rateLimitResponse) {
      logRateLimitExceeded('/api/auth/register', ip).catch(console.error);
      return rateLimitResponse;
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password with enhanced security requirements
    const passwordValidation = validatePassword(password, {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false, // Don't require special chars for better UX
      disallowCommonPasswords: true,
    });

    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: passwordValidation.error,
          suggestions: passwordValidation.suggestions,
        },
        { status: 400 }
      );
    }

    // Sanitize name input
    const nameValidation = sanitizeString(name, {
      maxLength: 100,
      stripHtml: true,
      trimWhitespace: true,
    });

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailValidation.sanitized },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: emailValidation.sanitized!,
        passwordHash,
        name: nameValidation.sanitized || null,
        role: 'USER',
      },
    });

    // Create session
    const session = await createSession(user.id);

    // Log successful registration
    logRegistration(user.id, ip, userAgent).catch(console.error);

    // Set session cookie in response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      passwordStrength: passwordValidation.strength,
    }, { status: 201 });

    setSessionCookie(response, session.token, session.expiresAt);

    // Send welcome email (fire and forget - don't block registration)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
