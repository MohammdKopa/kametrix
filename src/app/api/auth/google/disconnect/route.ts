import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies, validateSession } from '@/lib/auth';
import { disconnectGoogle } from '@/lib/google/auth';

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Verify user is logged in
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = await validateSession(token);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Disconnect Google account
    await disconnectGoogle(sessionData.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    );
  }
}
