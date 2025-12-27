# Phase 3: Vapi Integration - Research

**Researched:** 2025-12-24
**Domain:** Vapi Voice AI Platform - Assistant Creation, Phone Numbers, Webhooks
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Vapi ecosystem for building a self-serve voice AI platform. Vapi provides a comprehensive API and SDK for creating voice assistants, provisioning phone numbers, and handling call events via webhooks.

Key findings:
1. **TypeScript Server SDK** (`@vapi-ai/server-sdk`) is the primary integration path for Next.js backends
2. **Phone numbers** can be Vapi-provisioned (US free), Twilio-imported (international), or BYO-carrier
3. **Webhooks** require a publicly accessible Server URL with <7.5s response time
4. **Voice providers** include ElevenLabs, Deepgram, Cartesia, Azure, and Vapi's own voices
5. **Transcribers** primarily use Deepgram (nova-2 recommended) with fallback options

**Primary recommendation:** Use `@vapi-ai/server-sdk` for all Vapi API interactions. Configure Server URL for webhook events. Use Vapi-provisioned numbers for US customers, with Twilio import option for future international expansion.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @vapi-ai/server-sdk | 0.10.2 | Vapi API client | Official TypeScript SDK with typed interfaces |
| Next.js API Routes | 15.x | Webhook endpoints | Already in stack, handles POST for server events |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x | Webhook payload validation | Validate incoming Vapi webhook payloads |

### Voice/Transcription Providers (Configured in Vapi, not installed)
| Provider | Purpose | When to Use |
|----------|---------|-------------|
| Deepgram (transcriber) | Speech-to-text | Default, best for phone calls |
| ElevenLabs (voice) | Text-to-speech | High-quality voices, multilingual |
| Vapi voices | Text-to-speech | Free tier, good for testing |
| Cartesia (voice) | Text-to-speech | Fast, multilingual (sonic-2 model) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vapi-ai/server-sdk | Direct REST API | SDK provides types, retries, better DX |
| Vapi phone numbers | Twilio import | Twilio needed for international numbers |
| Deepgram transcriber | OpenAI Whisper | Deepgram lower latency for real-time |

**Installation:**
```bash
npm install @vapi-ai/server-sdk
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── vapi/
│       ├── client.ts          # VapiClient singleton
│       ├── assistants.ts      # Assistant CRUD operations
│       ├── phone-numbers.ts   # Phone number management
│       └── types.ts           # Extended types for our domain
├── app/
│   └── api/
│       └── webhooks/
│           └── vapi/
│               └── route.ts   # Server URL webhook handler
└── actions/
    └── vapi/
        ├── create-assistant.ts
        └── assign-phone-number.ts
```

### Pattern 1: VapiClient Singleton
**What:** Single VapiClient instance reused across requests
**When to use:** All server-side Vapi API calls
**Example:**
```typescript
// src/lib/vapi/client.ts
import { VapiClient } from "@vapi-ai/server-sdk";

let vapiClient: VapiClient | null = null;

export function getVapiClient(): VapiClient {
  if (!vapiClient) {
    vapiClient = new VapiClient({
      token: process.env.VAPI_API_KEY!,
    });
  }
  return vapiClient;
}
```

### Pattern 2: Assistant Creation with Structured Knowledge
**What:** Create assistant with system prompt containing business context
**When to use:** Wizard completion step
**Example:**
```typescript
// Source: Vapi official docs
import { getVapiClient } from "@/lib/vapi/client";

export async function createBusinessAssistant(config: {
  name: string;
  businessName: string;
  businessHours: string;
  services: string[];
  faqs: { question: string; answer: string }[];
}) {
  const client = getVapiClient();

  const systemPrompt = `You are ${config.name}, an AI assistant for ${config.businessName}.

## Business Information
- Business Name: ${config.businessName}
- Hours: ${config.businessHours}
- Services: ${config.services.join(", ")}

## FAQs
${config.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")}

## Guidelines
- Be friendly and professional
- Answer questions about the business accurately
- If unsure, offer to have someone call back
- Keep responses concise for voice interaction`;

  const assistant = await client.assistants.create({
    name: config.name,
    firstMessage: `Hello! Thank you for calling ${config.businessName}. How can I help you today?`,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
    },
    voice: {
      provider: "11labs",
      voiceId: "marissa", // or let user choose
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    maxDurationSeconds: 600, // 10 minute max call
  });

  return assistant;
}
```

### Pattern 3: Webhook Handler with Event Routing
**What:** Single endpoint handling all Vapi server events
**When to use:** Receiving call events
**Example:**
```typescript
// src/app/api/webhooks/vapi/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message } = body;

  switch (message.type) {
    case "status-update":
      await handleStatusUpdate(message);
      break;
    case "end-of-call-report":
      await handleEndOfCall(message);
      break;
    case "tool-calls":
      return handleToolCalls(message);
    default:
      console.log(`Unhandled event: ${message.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleStatusUpdate(message: any) {
  const { call, status } = message;
  // Update call record in database
  console.log(`Call ${call.id}: ${status}`);
}

async function handleEndOfCall(message: any) {
  const { call, artifact, endedReason } = message;
  // Log call to database with duration, transcript
  // Deduct credits (Phase 5)
}

function handleToolCalls(message: any) {
  // Return tool results for custom functions
  return NextResponse.json({
    results: message.toolCallList.map((tc: any) => ({
      toolCallId: tc.id,
      result: "OK",
    })),
  });
}
```

### Pattern 4: Phone Number Pool Management
**What:** Pre-provision phone numbers, assign from pool
**When to use:** User completes wizard, needs number assigned
**Example:**
```typescript
// Get available number from pool
export async function assignPhoneNumberToAgent(
  agentId: string,
  assistantId: string
) {
  const client = getVapiClient();

  // Get our available numbers from DB
  const availableNumber = await db.phoneNumber.findFirst({
    where: { agentId: null, status: "available" },
  });

  if (!availableNumber) {
    throw new Error("No phone numbers available");
  }

  // Update Vapi phone number to point to this assistant
  await client.phoneNumbers.update(availableNumber.vapiId, {
    assistantId: assistantId,
  });

  // Update our DB
  await db.phoneNumber.update({
    where: { id: availableNumber.id },
    data: { agentId, status: "assigned" },
  });

  return availableNumber;
}
```

### Anti-Patterns to Avoid
- **Creating VapiClient per request:** Wastes resources, use singleton
- **Not setting maxDurationSeconds:** Calls can run indefinitely, costing money
- **Hardcoding voice/transcriber in code:** Make configurable in wizard
- **Synchronous webhook responses taking >7.5s:** Will timeout, use async processing
- **Not storing Vapi IDs:** Always store `assistantId`, `phoneNumberId` in your DB
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voice synthesis | Custom TTS integration | Vapi voice providers | Already integrated, handles streaming |
| Speech recognition | Whisper API direct | Vapi transcriber config | Optimized for real-time, turn detection built in |
| Phone number provisioning | Twilio SDK directly | Vapi phone number API | Vapi handles SIP, routing, all telephony |
| Call state management | Custom WebSocket/polling | Vapi webhooks | Server URL events provide all state updates |
| Conversation history | Manual transcript assembly | Vapi artifact.messages | Full transcript with roles in end-of-call report |
| Voice activity detection | Custom audio analysis | Vapi turn detection | eotThreshold, eagerEotThreshold configs handle this |

**Key insight:** Vapi abstracts the entire voice AI pipeline (STT -> LLM -> TTS -> telephony). Building any component custom means maintaining complex real-time audio infrastructure. Use Vapi's providers and just configure them.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Webhook Response Timeout
**What goes wrong:** Vapi drops webhook, call fails or gets stuck
**Why it happens:** Webhook must respond within 7.5 seconds
**How to avoid:**
- Keep webhook handlers fast (<3s ideal)
- Do heavy processing asynchronously after responding
- Host webhook close to us-west-2 AWS region
**Warning signs:** Calls ending unexpectedly, missing end-of-call reports

### Pitfall 2: High Latency Responses
**What goes wrong:** User experiences 3-4 second delays instead of expected ~500ms
**Why it happens:** Default turn detection adds 1.5s+ wait, inefficient prompt design
**How to avoid:**
- Configure `eotThreshold` and `eagerEotThreshold` on transcriber
- Keep system prompts concise (<1000 tokens ideal)
- Use faster models (gpt-4o-mini for simple tasks)
- Enable voice caching for repeated phrases
**Warning signs:** Users asking "are you there?", low engagement

### Pitfall 3: Missing Assistant/Phone Mapping
**What goes wrong:** Calls go to wrong assistant or fail to route
**Why it happens:** Forgot to update phone number's assistantId
**How to avoid:**
- Always update phone number when assistant changes
- Store relationship in your DB as source of truth
- Verify mapping after wizard completion
**Warning signs:** Test calls reaching default/wrong assistant

### Pitfall 4: Credit Depletion Without Notice
**What goes wrong:** Vapi credits run out, all calls fail
**Why it happens:** No monitoring of Vapi account balance
**How to avoid:**
- Set up Vapi dashboard alerts
- Implement webhook for balance events (if available)
- Pre-check credits before expensive operations
**Warning signs:** Sudden call.start.error-subscription-insufficient-credits errors

### Pitfall 5: Not Storing Vapi IDs
**What goes wrong:** Can't update/delete resources, orphaned data
**Why it happens:** Only stored internal IDs, not Vapi's IDs
**How to avoid:**
- Store `vapiAssistantId`, `vapiPhoneNumberId` in your models
- Sync state between your DB and Vapi
- Handle deletion/cleanup properly
**Warning signs:** "Resource not found" errors, mismatched data
</common_pitfalls>

<code_examples>
## Code Examples

### VapiClient Initialization
```typescript
// Source: @vapi-ai/server-sdk docs
import { VapiClient } from "@vapi-ai/server-sdk";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});
```

### Create Assistant with All Configurations
```typescript
// Source: Vapi API reference
const assistant = await client.assistants.create({
  name: "Support Agent",
  firstMessage: "Hello! How can I help you today?",
  model: {
    provider: "openai",
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful support agent..." }
    ],
    temperature: 0.7,
  },
  voice: {
    provider: "11labs",
    voiceId: "marissa",
    model: "eleven_turbo_v2",
    stability: 0.5,
    similarityBoost: 0.75,
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
    smartFormat: true,
  },
  maxDurationSeconds: 600,
  endCallMessage: "Thank you for calling. Goodbye!",
  endCallPhrases: ["goodbye", "bye", "end call"],
});
```

### List Available Phone Numbers
```typescript
// Source: Vapi TypeScript SDK
const phoneNumbers = await client.phoneNumbers.list();

// Filter for unassigned numbers
const available = phoneNumbers.filter(pn => !pn.assistantId);
```

### Update Phone Number to Assign Assistant
```typescript
// Source: Vapi TypeScript SDK
await client.phoneNumbers.update(phoneNumberId, {
  assistantId: assistantId,
  name: "Business Line - Acme Corp",
});
```

### Webhook Handler Template (Next.js App Router)
```typescript
// Source: Community pattern, verified with Vapi docs
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    // Log for debugging
    console.log(`Vapi webhook: ${message.type}`);

    switch (message.type) {
      case "status-update":
        // Call status changed (ringing, in-progress, ended)
        break;

      case "transcript":
        // Real-time transcript update
        break;

      case "end-of-call-report":
        // Call completed - save to database
        const { call, artifact, endedReason } = message;
        await saveCallRecord({
          vapiCallId: call.id,
          duration: call.endedAt - call.startedAt,
          transcript: artifact.transcript,
          endedReason,
        });
        break;

      case "tool-calls":
        // Handle custom tool invocations
        return NextResponse.json({
          results: message.toolCallList.map((tc: any) => ({
            toolCallId: tc.id,
            result: JSON.stringify({ success: true }),
          })),
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom functions | Tools API | 2024 | Functions deprecated, use tools for custom actions |
| Basic transcription | Deepgram nova-2/nova-3 | 2024 | Much better accuracy, faster |
| Single voice provider | Multi-provider with fallback | 2024 | fallbackPlan ensures continuity |
| Fixed turn detection | Configurable eot thresholds | 2024 | Critical for latency optimization |

**New tools/patterns to consider:**
- **Workflows:** For complex multi-step conversations (state machine approach)
- **Squads:** Multiple assistants that can transfer between each other
- **Knowledge Bases:** Built-in RAG for document Q&A (query tool)
- **Assistant Hooks:** Automated actions on events (idle timeout, call ending)

**Deprecated/outdated:**
- **Custom Functions:** Use Tools API instead
- **serverUrl on functions:** Use server.url on assistant or phone number
- **Manual interruption handling:** Use firstMessageInterruptionsEnabled
</sota_updates>

<open_questions>
## Open Questions

1. **Phone Number Inventory Management**
   - What we know: Vapi charges ~$2-3/month per number, can provision via API
   - What's unclear: Best strategy for maintaining a pool (pre-provision vs on-demand)
   - Recommendation: Start with on-demand provisioning, add pooling later if needed

2. **Webhook Security**
   - What we know: Vapi supports credentialId for webhook authentication
   - What's unclear: Exact header format for verification
   - Recommendation: Implement signature verification in Phase 3, details in official docs

3. **Credit/Usage Tracking**
   - What we know: Vapi bills per minute, provides cost in end-of-call report
   - What's unclear: How to get real-time usage without waiting for call end
   - Recommendation: Use end-of-call report for now, explore Vapi billing API if exists
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /websites/docs_vapi_ai (Context7) - API reference, webhooks, assistants, phone numbers
- /vapiai/server-sdk-typescript (Context7) - TypeScript SDK methods and types
- https://docs.vapi.ai/server-url - Server URL configuration
- https://docs.vapi.ai/server-url/events - Webhook event types
- https://github.com/VapiAI/server-sdk-typescript - Official SDK repository

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/@vapi-ai/server-sdk - Package version (0.10.2)
- https://docs.vapi.ai/phone-calling - Phone number provisioning overview
- https://vapi.ai/blog/speech-latency - Latency optimization strategies

### Tertiary (LOW confidence - validated during implementation)
- Community patterns from Vapi forums - webhook handling approaches
- AssemblyAI blog on low latency - validated against official docs
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Vapi Voice AI Platform
- Ecosystem: @vapi-ai/server-sdk, Deepgram, ElevenLabs, OpenAI
- Patterns: Assistant creation, webhook handling, phone management
- Pitfalls: Latency, timeouts, ID mapping, credit management

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK, verified on npm
- Architecture: HIGH - Based on official docs and examples
- Pitfalls: HIGH - Documented in community forums, verified in docs
- Code examples: HIGH - From Context7/official sources

**Research date:** 2025-12-24
**Valid until:** 2025-01-24 (30 days - Vapi ecosystem stable)
</metadata>

---

*Phase: 03-vapi-integration*
*Research completed: 2025-12-24*
*Ready for planning: yes*
