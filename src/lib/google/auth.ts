import { OAuth2Client } from 'google-auth-library';
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
 * Get an authenticated OAuth2Client for a user by retrieving and decrypting their stored token
 * @param userId - The user's ID
 * @returns OAuth2Client with credentials set, or null if user hasn't connected Google
 */
export async function getOAuth2ClientForUser(
  userId: string
): Promise<OAuth2Client | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  });

  if (!user?.googleRefreshToken) {
    return null;
  }

  try {
    const decryptedToken = decrypt(user.googleRefreshToken);
    const client = createOAuth2Client(decryptedToken);

    // Listen for token refresh events to update stored token if needed
    client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // New refresh token issued - update database
        const encryptedToken = encrypt(tokens.refresh_token);
        await prisma.user.update({
          where: { id: userId },
          data: { googleRefreshToken: encryptedToken },
        });
      }
    });

    return client;
  } catch {
    // Decryption failed - token is invalid
    return null;
  }
}

/**
 * Save Google OAuth tokens for a user
 */
export async function saveGoogleTokens(
  userId: string,
  refreshToken: string
): Promise<void> {
  const encryptedToken = encrypt(refreshToken);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleRefreshToken: encryptedToken,
      googleConnectedAt: new Date(),
    },
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
      googleSheetId: null,
      googleConnectedAt: null,
    },
  });
}
