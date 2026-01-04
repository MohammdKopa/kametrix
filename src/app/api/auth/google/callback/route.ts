import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies, validateSession } from '@/lib/auth';
import { exchangeCodeForTokens, saveGoogleTokens } from '@/lib/google/auth';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Check for error from Google
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard?error=google_auth_denied`, baseUrl)
      );
    }

    // Get authorization code
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=no_code`, baseUrl)
      );
    }

    // Verify user is logged in
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=not_authenticated', baseUrl)
      );
    }

    const sessionData = await validateSession(token);
    if (!sessionData) {
      return NextResponse.redirect(
        new URL('/login?error=session_expired', baseUrl)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      console.error('No refresh token received from Google');
      return NextResponse.redirect(
        new URL(`/dashboard?error=no_refresh_token`, baseUrl)
      );
    }

    // Save encrypted tokens to database (including access token for caching)
    await saveGoogleTokens(
      sessionData.user.id,
      tokens.refresh_token,
      tokens.access_token || undefined,
      tokens.expiry_date || undefined
    );

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(`/dashboard?success=google_connected`, baseUrl)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=google_auth_failed`, baseUrl)
    );
  }
}
