import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the dependencies
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn(),
    drive: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

describe('Google Sheets Integration', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('SheetsOperationResult type', () => {
    it('should have the correct structure for success', async () => {
      // Import the function to test its return type
      const { appendCallLog } = await import('../sheets');

      // Create mock sheets client
      const mockAppend = vi.fn().mockResolvedValue({ data: {} });
      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    it('should return error details on failure', async () => {
      const { appendCallLog } = await import('../sheets');

      const mockError = new Error('API Error');
      const mockAppend = vi.fn().mockRejectedValue(mockError);
      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on 429 rate limit error', async () => {
      const { appendCallLog } = await import('../sheets');

      let callCount = 0;
      const mockAppend = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          const error = new Error('Rate limit exceeded') as any;
          error.code = 429;
          return Promise.reject(error);
        }
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(callCount).toBe(3); // Initial + 2 retries
    });

    it('should retry on 503 service unavailable', async () => {
      const { appendCallLog } = await import('../sheets');

      let callCount = 0;
      const mockAppend = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          const error = new Error('Service unavailable') as any;
          error.code = 503;
          return Promise.reject(error);
        }
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should not retry on 400 bad request', async () => {
      const { appendCallLog } = await import('../sheets');

      let callCount = 0;
      const mockAppend = vi.fn().mockImplementation(() => {
        callCount++;
        const error = new Error('Bad request') as any;
        error.code = 400;
        return Promise.reject(error);
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result.success).toBe(false);
      expect(callCount).toBe(1); // No retries for 400
    });

    it('should retry on network errors', async () => {
      const { appendCallLog } = await import('../sheets');

      let callCount = 0;
      const mockAppend = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('ECONNRESET'));
        }
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      const result = await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date(),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });
  });

  describe('verifySheetConnection', () => {
    it('should return healthy true on success', async () => {
      const { verifySheetConnection } = await import('../sheets');

      const mockList = vi.fn().mockResolvedValue({ data: { files: [] } });
      const mockDrive = {
        files: {
          list: mockList,
        },
      };
      (google.drive as any).mockReturnValue(mockDrive);

      const mockOAuth2Client = {} as any;
      const result = await verifySheetConnection(mockOAuth2Client);

      expect(result.healthy).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return helpful message on token expiration', async () => {
      const { verifySheetConnection } = await import('../sheets');

      const mockList = vi.fn().mockRejectedValue(new Error('Token has been expired'));
      const mockDrive = {
        files: {
          list: mockList,
        },
      };
      (google.drive as any).mockReturnValue(mockDrive);

      const mockOAuth2Client = {} as any;
      const result = await verifySheetConnection(mockOAuth2Client);

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('reconnect your Google account');
    });

    it('should return helpful message on invalid_grant', async () => {
      const { verifySheetConnection } = await import('../sheets');

      const mockList = vi.fn().mockRejectedValue(new Error('invalid_grant'));
      const mockDrive = {
        files: {
          list: mockList,
        },
      };
      (google.drive as any).mockReturnValue(mockDrive);

      const mockOAuth2Client = {} as any;
      const result = await verifySheetConnection(mockOAuth2Client);

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('reconnect your Google account');
    });
  });

  describe('Data formatting', () => {
    it('should format duration correctly', async () => {
      const { appendCallLog } = await import('../sheets');

      let capturedValues: any[] = [];
      const mockAppend = vi.fn().mockImplementation(({ requestBody }) => {
        capturedValues = requestBody.values[0];
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date('2025-01-04T10:30:00Z'),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        durationSeconds: 125, // 2m 5s
        status: 'completed',
      });

      // Duration should be in format "Xm Ys"
      expect(capturedValues[4]).toBe('2m 5s');
    });

    it('should format seconds-only duration correctly', async () => {
      const { appendCallLog } = await import('../sheets');

      let capturedValues: any[] = [];
      const mockAppend = vi.fn().mockImplementation(({ requestBody }) => {
        capturedValues = requestBody.values[0];
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date('2025-01-04T10:30:00Z'),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        durationSeconds: 45, // Less than a minute
        status: 'completed',
      });

      // Duration should be in format "Xs"
      expect(capturedValues[4]).toBe('45s');
    });

    it('should handle appointment booked string', async () => {
      const { appendCallLog } = await import('../sheets');

      let capturedValues: any[] = [];
      const mockAppend = vi.fn().mockImplementation(({ requestBody }) => {
        capturedValues = requestBody.values[0];
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date('2025-01-04T10:30:00Z'),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
        appointmentBooked: 'Tomorrow at 10:00 AM',
      });

      // Appointment should be the string value
      expect(capturedValues[7]).toBe('Tomorrow at 10:00 AM');
    });

    it('should handle appointment booked boolean', async () => {
      const { appendCallLog } = await import('../sheets');

      let capturedValues: any[] = [];
      const mockAppend = vi.fn().mockImplementation(({ requestBody }) => {
        capturedValues = requestBody.values[0];
        return Promise.resolve({ data: {} });
      });

      const mockSheets = {
        spreadsheets: {
          values: {
            append: mockAppend,
          },
        },
      };
      (google.sheets as any).mockReturnValue(mockSheets);

      const mockOAuth2Client = {} as any;
      await appendCallLog(mockOAuth2Client, 'test-sheet-id', {
        startedAt: new Date('2025-01-04T10:30:00Z'),
        phoneNumber: '+1234567890',
        agentName: 'Test Agent',
        status: 'completed',
        appointmentBooked: true,
      });

      // Appointment should be "Yes"
      expect(capturedValues[7]).toBe('Yes');
    });
  });
});
