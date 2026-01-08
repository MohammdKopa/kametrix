import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Vapi Webhook Authentication
 *
 * Vapi supports multiple authentication methods:
 * 1. HMAC-SHA256 signature in x-vapi-signature header
 * 2. Direct secret token in x-vapi-secret header
 * 3. Bearer token in Authorization header
 *
 * This module supports all three methods for maximum compatibility.
 */

interface VapiAuthHeaders {
  signature: string | null; // x-vapi-signature (HMAC)
  secret: string | null; // x-vapi-secret (direct token)
  authorization: string | null; // Authorization header (Bearer token)
  timestamp: string | null; // x-timestamp header (for HMAC with timestamp)
}

/**
 * Verify Vapi webhook using the most appropriate method
 *
 * Tries verification methods in order of security preference:
 * 1. HMAC-SHA256 signature (most secure)
 * 2. Direct secret comparison (simple but less secure)
 * 3. Bearer token (standard API auth)
 *
 * @param payload - Raw request body as string
 * @param headers - Auth headers from request
 * @param secret - VAPI_WEBHOOK_SECRET from environment
 * @returns Object with isValid boolean and method used
 */
export function verifyVapiWebhook(
  payload: string,
  headers: VapiAuthHeaders,
  secret: string | undefined
): { isValid: boolean; method: string; debug?: string } {
  // Fail if secret not configured
  if (!secret || secret.trim() === '') {
    return { isValid: false, method: 'none', debug: 'VAPI_WEBHOOK_SECRET not configured' };
  }

  // Debug: Log what headers we received (without exposing secrets)
  const receivedHeaders = {
    hasSignature: !!headers.signature,
    signatureLength: headers.signature?.length || 0,
    hasSecret: !!headers.secret,
    secretLength: headers.secret?.length || 0,
    hasAuth: !!headers.authorization,
  };

  // Method 1: Try HMAC-SHA256 signature verification
  if (headers.signature && headers.signature.trim() !== '') {
    // Try with timestamp first if present (Vapi format: {timestamp}.{body})
    if (headers.timestamp) {
      const payloadWithTimestamp = `${headers.timestamp}.${payload}`;
      const isValidWithTimestamp = verifyHmacSignature(payloadWithTimestamp, headers.signature, secret);
      if (isValidWithTimestamp) {
        return { isValid: true, method: 'hmac-sha256-timestamp' };
      }
    }

    // Try without timestamp (just body)
    const isValid = verifyHmacSignature(payload, headers.signature, secret);
    if (isValid) {
      return { isValid: true, method: 'hmac-sha256' };
    }

    // HMAC failed - log debug info with detailed comparison
    const expectedSig = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
    const expectedWithTimestamp = headers.timestamp
      ? createHmac('sha256', secret).update(`${headers.timestamp}.${payload}`, 'utf8').digest('hex')
      : 'N/A';
    console.error('HMAC Debug:', {
      receivedSig: headers.signature,
      expectedSig: expectedSig,
      expectedWithTimestamp,
      timestamp: headers.timestamp,
      payloadLength: payload.length,
      payloadPreview: payload.substring(0, 200),
      secretLength: secret.length,
    });
    return {
      isValid: false,
      method: 'hmac-sha256',
      debug: `HMAC mismatch. Received sig length: ${headers.signature.length}, Expected sig length: ${expectedSig.length}. Headers: ${JSON.stringify(receivedHeaders)}`,
    };
  }

  // Method 2: Try direct secret token comparison (x-vapi-secret header)
  if (headers.secret && headers.secret.trim() !== '') {
    const isValid = verifyDirectSecret(headers.secret, secret);
    if (isValid) {
      return { isValid: true, method: 'direct-secret' };
    }
    return {
      isValid: false,
      method: 'direct-secret',
      debug: `Direct secret mismatch. Headers: ${JSON.stringify(receivedHeaders)}`,
    };
  }

  // Method 3: Try Bearer token from Authorization header
  if (headers.authorization) {
    const isValid = verifyBearerToken(headers.authorization, secret);
    if (isValid) {
      return { isValid: true, method: 'bearer-token' };
    }
    return {
      isValid: false,
      method: 'bearer-token',
      debug: `Bearer token mismatch. Headers: ${JSON.stringify(receivedHeaders)}`,
    };
  }

  // No auth headers provided
  return {
    isValid: false,
    method: 'none',
    debug: `No authentication headers found. Headers: ${JSON.stringify(receivedHeaders)}`,
  };
}

/**
 * Verify HMAC-SHA256 signature
 */
function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Generate expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature.toLowerCase(), 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature.toLowerCase(), 'utf8');

    // Buffers must be same length for timingSafeEqual
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Verify direct secret token (timing-safe)
 */
function verifyDirectSecret(providedSecret: string, expectedSecret: string): boolean {
  try {
    const providedBuffer = Buffer.from(providedSecret, 'utf8');
    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    console.error('Direct secret verification error:', error);
    return false;
  }
}

/**
 * Verify Bearer token from Authorization header
 */
function verifyBearerToken(authHeader: string, expectedSecret: string): boolean {
  try {
    // Extract token from "Bearer <token>" format
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return false;
    }

    const token = match[1];
    const tokenBuffer = Buffer.from(token, 'utf8');
    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch (error) {
    console.error('Bearer token verification error:', error);
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use verifyVapiWebhook instead
 */
export function verifyVapiSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): boolean {
  const result = verifyVapiWebhook(
    payload,
    { signature, secret: null, authorization: null, timestamp: null },
    secret
  );
  return result.isValid;
}

/**
 * Extract all relevant auth headers from a request
 */
export function extractVapiAuthHeaders(headers: Headers): VapiAuthHeaders {
  return {
    signature: headers.get('x-vapi-signature'),
    secret: headers.get('x-vapi-secret'),
    authorization: headers.get('authorization'),
    timestamp: headers.get('x-timestamp'),
  };
}
