import { getVapiClient } from './client';
import type { VapiPhoneNumber, PhoneOperationResult } from './types';

/**
 * List all phone numbers from the Vapi account
 */
export async function listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
  const client = getVapiClient();
  const phoneNumbers = await client.phoneNumbers.list();

  return phoneNumbers.map((pn) => ({
    id: pn.id,
    number: pn.number ?? '',
    name: pn.name ?? undefined,
    assistantId: pn.assistantId ?? null,
    createdAt: pn.createdAt ?? new Date().toISOString(),
  }));
}

/**
 * Assign an assistant to a phone number
 */
export async function assignAssistantToPhoneNumber(
  phoneNumberId: string,
  assistantId: string
): Promise<void> {
  const client = getVapiClient();
  await client.phoneNumbers.update({
    id: phoneNumberId,
    body: {
      assistantId,
    },
  });
}

/**
 * Remove assistant assignment from a phone number
 */
export async function unassignPhoneNumber(phoneNumberId: string): Promise<void> {
  const client = getVapiClient();
  await client.phoneNumbers.update({
    id: phoneNumberId,
    body: {
      assistantId: undefined, // Setting to undefined removes the assignment
    },
  });
}

/**
 * Gracefully remove assistant assignment from a phone number
 * Handles cases where the phone number may not exist or is already unassigned
 */
export async function unassignPhoneNumberGracefully(phoneNumberId: string): Promise<PhoneOperationResult> {
  const client = getVapiClient();
  try {
    await client.phoneNumbers.update({
      id: phoneNumberId,
      body: {
        assistantId: undefined,
      },
    });
    return { success: true, notFound: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = String(error).toLowerCase();

    // Handle "not found" errors gracefully - phone number doesn't exist in Vapi
    if (
      errorString.includes('not found') ||
      errorString.includes('phonenumber not found') ||
      errorString.includes('phone number not found') ||
      errorString.includes('404') ||
      (error && typeof error === 'object' && 'status' in error && (error as any).status === 404)
    ) {
      console.log(`Phone number ${phoneNumberId} not found in Vapi - may have been removed externally`);
      return { success: true, notFound: true };
    }

    // Return error for other failures
    console.error('Failed to unassign phone number from Vapi:', error);
    return { success: false, notFound: false, error: errorMessage };
  }
}
