import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify Vapi webhook signature using HMAC-SHA256
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from x-vapi-signature header
 * @param secret - VAPI_WEBHOOK_SECRET from environment
 * @returns true if signature is valid, false otherwise
 */
export function verifyVapiSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): boolean {
  // Fail if secret not configured
  if (!secret || secret.trim() === '') {
    return false;
  }

  // Fail if no signature provided
  if (!signature || signature.trim() === '') {
    return false;
  }

  try {
    // Generate expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    // Buffers must be same length for timingSafeEqual
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error('Vapi signature verification error:', error);
    return false;
  }
}
