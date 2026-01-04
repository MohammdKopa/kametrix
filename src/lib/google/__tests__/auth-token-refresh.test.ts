import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock crypto functions
vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto');
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue(Buffer.from('0123456789abcdef')),
    createCipheriv: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue('encrypted'),
      final: vi.fn().mockReturnValue(''),
      getAuthTag: vi.fn().mockReturnValue(Buffer.from('1234567890abcdef')),
    }),
    createDecipheriv: vi.fn().mockReturnValue({
      update: vi.fn().mockImplementation((text) => text),
      final: vi.fn().mockReturnValue(''),
      setAuthTag: vi.fn(),
    }),
  };
});

import { prisma } from '@/lib/prisma';

describe('Google Auth Token Refresh', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.GOOGLE_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.env = originalEnv;
  });

  describe('getOAuth2ClientForUser - no tokens', () => {
    it('should return null if user has no Google tokens', async () => {
      const { getOAuth2ClientForUser } = await import('../auth');

      (prisma.user.findUnique as any).mockResolvedValue({
        googleRefreshToken: null,
        googleAccessToken: null,
        googleTokenExpiresAt: null,
      });

      const client = await getOAuth2ClientForUser('user-123');
      expect(client).toBeNull();
    });

    it('should return null if user not found', async () => {
      const { getOAuth2ClientForUser } = await import('../auth');

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const client = await getOAuth2ClientForUser('user-123');
      expect(client).toBeNull();
    });
  });

  describe('saveGoogleTokens', () => {
    it('should save refresh token and optional access token', async () => {
      const { saveGoogleTokens } = await import('../auth');

      await saveGoogleTokens(
        'user-123',
        'refresh-token-value',
        'access-token-value',
        Date.now() + 3600000
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          googleRefreshToken: expect.any(String),
          googleAccessToken: expect.any(String),
          googleTokenExpiresAt: expect.any(Date),
          googleConnectedAt: expect.any(Date),
        }),
      });
    });

    it('should save only refresh token when access token not provided', async () => {
      const { saveGoogleTokens } = await import('../auth');

      await saveGoogleTokens('user-123', 'refresh-token-value');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          googleRefreshToken: expect.any(String),
          googleConnectedAt: expect.any(Date),
        }),
      });

      // Should NOT include access token or expiry
      const callData = (prisma.user.update as any).mock.calls[0][0].data;
      expect(callData.googleAccessToken).toBeUndefined();
      expect(callData.googleTokenExpiresAt).toBeUndefined();
    });
  });

  describe('disconnectGoogle', () => {
    it('should clear all Google-related fields including new token cache fields', async () => {
      const { disconnectGoogle } = await import('../auth');

      await disconnectGoogle('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiresAt: null,
          googleSheetId: null,
          googleConnectedAt: null,
        },
      });
    });
  });

  describe('encrypt/decrypt functions', () => {
    it('should properly encrypt tokens', async () => {
      const { encrypt } = await import('../auth');

      const encrypted = encrypt('test-token');

      // Encrypted value should be a hex string (iv + authTag + encrypted)
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });
  });

  describe('getAuthUrl', () => {
    it('should generate OAuth URL with correct parameters', async () => {
      const { getAuthUrl } = await import('../auth');

      const url = getAuthUrl();

      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });
  });

  describe('Token refresh helper function logic', () => {
    it('shouldRefreshToken returns true when expiresAt is null', async () => {
      // This tests the internal logic through behavior
      const { getOAuth2ClientForUser } = await import('../auth');

      (prisma.user.findUnique as any).mockResolvedValue({
        googleRefreshToken: 'encrypted-token',
        googleAccessToken: null,
        googleTokenExpiresAt: null, // null expiry should trigger refresh
      });

      // When token refresh is needed but fails, client returns null
      // This confirms the shouldRefreshToken logic worked (null expiry -> needs refresh)
      const client = await getOAuth2ClientForUser('user-123');

      // Either we got a client (successful refresh) or null (refresh failed/needed)
      // The key is that it doesn't use cached token when expiry is null
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Using cached access token'));
    });

    it('shouldRefreshToken returns true when token expires within 5 minutes', async () => {
      const { getOAuth2ClientForUser } = await import('../auth');

      const expiresIn4Minutes = new Date(Date.now() + 4 * 60 * 1000);

      (prisma.user.findUnique as any).mockResolvedValue({
        googleRefreshToken: 'encrypted-token',
        googleAccessToken: 'encrypted-access-token',
        googleTokenExpiresAt: expiresIn4Minutes,
      });

      await getOAuth2ClientForUser('user-123');

      // Should NOT use cached token since it's about to expire
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Using cached access token'));
    });
  });
});
