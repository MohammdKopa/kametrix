import { VapiClient } from '@vapi-ai/server-sdk';

const globalForVapi = globalThis as unknown as {
  vapiClient: VapiClient | undefined;
};

export function getVapiClient(): VapiClient {
  if (!globalForVapi.vapiClient) {
    globalForVapi.vapiClient = new VapiClient({
      token: process.env.VAPI_API_KEY!,
    });
  }
  return globalForVapi.vapiClient;
}
