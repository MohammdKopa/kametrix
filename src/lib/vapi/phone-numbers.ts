import { getVapiClient } from './client';
import type { VapiPhoneNumber } from './types';

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
