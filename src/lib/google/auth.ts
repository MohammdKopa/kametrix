import { OAuth2Client, Credentials } from 'google-auth-library';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

// Google OAuth configuration
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
];

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Buffer time before token expiry to trigger refresh (5 minutes)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function getRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
}

function getEncryptionKey(): Buffer {
  const key = process.env.GOOGLE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('GOOGLE_ENCRYPTION_KEY environment variable is required');
  }
  // Key should be 32 bytes (64 hex chars) for AES-256
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value using AES-256-GCM
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv (hex) + authTag (hex) + encrypted (hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypt an encrypted string value
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  // Extract iv, authTag, and encrypted data
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
    'hex'
  );
  const encrypted = encryptedText.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Create an OAuth2Client instance
 * @param refreshToken - Optional decrypted refresh token to set credentials
 */
export function createOAuth2Client(refreshToken?: string): OAuth2Client {
  const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: getRedirectUri(),
  });

  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }

  return client;
}

/**
 * Generate Google OAuth authorization URL
 * Uses offline access and forces consent to always get refresh token
 */
export function getAuthUrl(): string {
  const client = createOAuth2Client();

  return client.generateAuthUrl({
    access_type: 'offline', // CRITICAL: Get refresh token
    prompt: 'consent', // CRITICAL: Force consent to always get refresh token
    scope: GOOGLE_SCOPES,
  });
}

/**
 * Exchange authorization code for tokens
 * @returns The tokens from Google OAuth
 */
export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Check if the access token needs to be refreshed
 * @param expiresAt - Token expiration timestamp
 * @returns true if token is expired or will expire soon
 */
function shouldRefreshToken(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  const now = Date.now();
  const expiryTime = expiresAt.getTime();
  return now >= expiryTime - TOKEN_REFRESH_BUFFER_MS;
}

/**
 * Refresh the access token using the refresh token
 * @param client - OAuth2Client with refresh token set
 * @param userId - User ID for storing updated tokens
 * @returns The new credentials or null if refresh failed
 */
async function refreshAccessToken(
  client: OAuth2Client,
  userId: string
): Promise<Credentials | null> {
  try {
    console.log(`[Google Auth] Refreshing access token for user ${userId}`);

    // Force a token refresh
    const { credentials } = await client.refreshAccessToken();

    // Update stored tokens in database
    const updateData: {
      googleAccessToken?: string;
      googleTokenExpiresAt?: Date;
      googleRefreshToken?: string;
    } = {};

    if (credentials.access_token) {
      updateData.googleAccessToken = encrypt(credentials.access_token);
    }

    if (credentials.expiry_date) {
      updateData.googleTokenExpiresAt = new Date(credentials.expiry_date);
    }

    // Google may issue a new refresh token during refresh
    if (credentials.refresh_token) {
      updateData.googleRefreshToken = encrypt(credentials.refresh_token);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      console.log(`[Google Auth] Updated stored tokens for user ${userId}`);
    }

    return credentials;
  } catch (error) {
    console.error(`[Google Auth] Failed to refresh token for user ${userId}:`, error);

    // Check if this is a permanent auth failure (token revoked, etc.)
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    if (
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('token has been revoked') ||
      errorMessage.includes('token has been expired')
    ) {
      // Clear the invalid tokens from database
      console.log(`[Google Auth] Clearing invalid tokens for user ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiresAt: null,
          googleConnectedAt: null,
        },
      });
    }

    return null;
  }
}

/**
 * Get an authenticated OAuth2Client for a user by retrieving and decrypting their stored token
 * Automatically refreshes the access token if expired or about to expire
 * @param userId - The user's ID
 * @returns OAuth2Client with credentials set, or null if user hasn't connected Google
 */
export async function getOAuth2ClientForUser(
  userId: string
): Promise<OAuth2Client | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!user?.googleRefreshToken) {
    return null;
  }

  try {
    const decryptedRefreshToken = decrypt(user.googleRefreshToken);
    const client = createOAuth2Client(decryptedRefreshToken);

    // Check if we have a valid cached access token
    const needsRefresh = shouldRefreshToken(user.googleTokenExpiresAt);

    if (!needsRefresh && user.googleAccessToken) {
      // Use cached access token
      try {
        const decryptedAccessToken = decrypt(user.googleAccessToken);
        client.setCredentials({
          refresh_token: decryptedRefreshToken,
          access_token: decryptedAccessToken,
          expiry_date: user.googleTokenExpiresAt?.getTime(),
        });
        console.log(`[Google Auth] Using cached access token for user ${userId}`);
      } catch {
        // Access token decryption failed, will refresh below
        console.log(`[Google Auth] Cached access token invalid, refreshing for user ${userId}`);
      }
    }

    // Proactively refresh if token is expired or will expire soon
    if (needsRefresh) {
      const credentials = await refreshAccessToken(client, userId);
      if (!credentials) {
        // Token refresh failed - user needs to reconnect
        return null;
      }
      // Set the new credentials on the client
      client.setCredentials(credentials);
    }

    // Listen for token refresh events during API calls
    client.on('tokens', async (tokens) => {
      console.log(`[Google Auth] Token event received for user ${userId}`);
      const updateData: {
        googleAccessToken?: string;
        googleTokenExpiresAt?: Date;
        googleRefreshToken?: string;
      } = {};

      if (tokens.access_token) {
        updateData.googleAccessToken = encrypt(tokens.access_token);
      }

      if (tokens.expiry_date) {
        updateData.googleTokenExpiresAt = new Date(tokens.expiry_date);
      }

      if (tokens.refresh_token) {
        // New refresh token issued - update database
        updateData.googleRefreshToken = encrypt(tokens.refresh_token);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
      }
    });

    return client;
  } catch (error) {
    // Decryption failed - token is invalid
    console.error(`[Google Auth] Token decryption failed for user ${userId}:`, error);
    return null;
  }
}

/**
 * Save Google OAuth tokens for a user
 * @param userId - User ID
 * @param refreshToken - Refresh token from OAuth
 * @param accessToken - Optional access token from OAuth
 * @param expiryDate - Optional token expiry date (timestamp in ms)
 */
export async function saveGoogleTokens(
  userId: string,
  refreshToken: string,
  accessToken?: string,
  expiryDate?: number
): Promise<void> {
  const encryptedRefreshToken = encrypt(refreshToken);

  const updateData: {
    googleRefreshToken: string;
    googleConnectedAt: Date;
    googleAccessToken?: string;
    googleTokenExpiresAt?: Date;
  } = {
    googleRefreshToken: encryptedRefreshToken,
    googleConnectedAt: new Date(),
  };

  if (accessToken) {
    updateData.googleAccessToken = encrypt(accessToken);
  }

  if (expiryDate) {
    updateData.googleTokenExpiresAt = new Date(expiryDate);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

/**
 * Disconnect Google account for a user
 */
export async function disconnectGoogle(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleRefreshToken: null,
      googleAccessToken: null,
      googleTokenExpiresAt: null,
      googleSheetId: null,
      googleConnectedAt: null,
    },
  });
}
