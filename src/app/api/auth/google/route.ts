import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies, validateSession } from '@/lib/auth';
import { getAuthUrl } from '@/lib/google/auth';

export async function GET() {
  try {
    // Verify user is logged in
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=not_authenticated', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    const sessionData = await validateSession(token);
    if (!sessionData) {
      return NextResponse.redirect(
        new URL('/login?error=session_expired', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // Generate OAuth URL and redirect to Google
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiate error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=google_auth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
