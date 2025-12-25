# Phase 4: Google Integrations - Research

**Researched:** 2025-12-25
**Domain:** Google OAuth2, Calendar API, Sheets API for voice agent integrations
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Google APIs ecosystem for implementing OAuth2 authentication, real-time calendar availability checking during voice calls, appointment booking, and automatic call logging to Sheets. The standard approach uses the official `googleapis` npm package with OAuth2Client for authentication.

Key finding: The OAuth2 flow for web applications is well-documented and straightforward, but **refresh token management requires careful attention** - Google only provides refresh tokens on first authorization (unless you force re-consent with `prompt: 'consent'`), and tokens can expire for various reasons (testing mode 7-day limit, user revocation, 6 months of inactivity, password changes for Gmail scopes).

For real-time availability during calls, the pattern is: Vapi tool call → webhook endpoint → freebusy query → return slots → Vapi books via events.insert. This is a proven pattern used by multiple voice AI booking systems.

**Primary recommendation:** Use `googleapis` for all Google API operations, store encrypted refresh tokens in the database per-user, implement the `tokens` event handler for automatic token refresh, and use freebusy.query for availability + events.insert for booking.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| googleapis | ^148.0.0 | Google API client | Official Google library, covers all APIs |
| google-auth-library | ^9.x | OAuth2 authentication | Official, handles token refresh automatically |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| google-spreadsheet | ^4.x | Sheets wrapper | Simpler API if only using Sheets (optional) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| googleapis | node-google-calendar | googleapis is official, covers all APIs |
| googleapis | google-spreadsheet | google-spreadsheet is simpler for Sheets but adds dependency |

**Installation:**
```bash
npm install googleapis google-auth-library
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── google/
│   │   ├── auth.ts          # OAuth2Client factory, token handling
│   │   ├── calendar.ts      # Calendar API helpers (freebusy, insert)
│   │   └── sheets.ts        # Sheets API helpers (create, append)
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── google/
│   │   │       ├── route.ts       # Initiate OAuth flow
│   │   │       └── callback/
│   │   │           └── route.ts   # Handle OAuth callback
│   │   └── google/
│   │       ├── calendar/
│   │       │   ├── availability/
│   │       │   │   └── route.ts   # Check freebusy (for Vapi tool)
│   │       │   └── book/
│   │       │       └── route.ts   # Create event (for Vapi tool)
│   │       └── sheets/
│   │           └── log/
│   │               └── route.ts   # Append call log row
```

### Pattern 1: OAuth2 Flow with Token Storage
**What:** Standard OAuth2 web application flow with database-backed token storage
**When to use:** Any user-facing Google integration
**Example:**
```typescript
// Source: google-auth-library official docs
import { OAuth2Client } from 'google-auth-library';

// Create client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
});

// Generate auth URL with offline access for refresh token
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',  // CRITICAL: Get refresh token
  prompt: 'consent',       // Force consent to always get refresh token
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

// Handle callback - exchange code for tokens
const { tokens } = await oauth2Client.getToken(authorizationCode);
// tokens.refresh_token - store encrypted in DB
// tokens.access_token - short-lived, auto-refreshes

// Listen for token refresh events
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // Update stored refresh token (rare, but handle it)
    await updateUserRefreshToken(userId, tokens.refresh_token);
  }
  // Access token auto-updates, no action needed
});
```

### Pattern 2: Calendar FreeBusy Query for Availability
**What:** Check calendar availability for a time range
**When to use:** Before offering appointment slots during voice call
**Example:**
```typescript
// Source: Google Calendar API v3 reference
import { google } from 'googleapis';

async function checkAvailability(
  oauth2Client: OAuth2Client,
  timeMin: Date,
  timeMax: Date
) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'America/New_York', // User's timezone
      items: [{ id: 'primary' }]     // Primary calendar
    }
  });

  const busySlots = response.data.calendars?.primary?.busy || [];
  return busySlots; // Array of { start, end }
}
```

### Pattern 3: Create Calendar Event
**What:** Book an appointment by inserting a calendar event
**When to use:** After confirming slot with caller
**Example:**
```typescript
// Source: Google Calendar API v3 reference
async function bookAppointment(
  oauth2Client: OAuth2Client,
  summary: string,
  start: Date,
  end: Date,
  attendeeEmail?: string
) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined
    }
  });

  return event.data;
}
```

### Pattern 4: Auto-Create Sheets and Append Logs
**What:** Create logging spreadsheet on first use, append rows for each call
**When to use:** Call logging to Google Sheets
**Example:**
```typescript
// Source: Google Sheets API v4 reference
import { google } from 'googleapis';

async function getOrCreateLogSheet(oauth2Client: OAuth2Client, userId: string) {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Check if sheet already exists (stored in DB)
  const existingSheetId = await getUserSheetId(userId);
  if (existingSheetId) return existingSheetId;

  // Create new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Kametrix Call Logs' },
      sheets: [{
        properties: { title: 'Calls' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: 'Date' } },
              { userEnteredValue: { stringValue: 'Caller' } },
              { userEnteredValue: { stringValue: 'Duration' } },
              { userEnteredValue: { stringValue: 'Agent' } },
              { userEnteredValue: { stringValue: 'Summary' } }
            ]
          }]
        }]
      }]
    }
  });

  const sheetId = spreadsheet.data.spreadsheetId!;
  await saveUserSheetId(userId, sheetId);
  return sheetId;
}

async function appendCallLog(
  oauth2Client: OAuth2Client,
  sheetId: string,
  callData: CallLogRow
) {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Calls!A:E',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        callData.date,
        callData.caller,
        callData.duration,
        callData.agent,
        callData.summary
      ]]
    }
  });
}
```

### Anti-Patterns to Avoid
- **Not using `access_type: 'offline'`:** You won't get a refresh token
- **Storing tokens in plain text:** Always encrypt at rest
- **Hardcoding client credentials:** Use environment variables
- **Ignoring the `tokens` event:** Miss refresh token updates
- **Testing mode in production:** Tokens expire after 7 days
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth2 flow | Custom token exchange | google-auth-library OAuth2Client | Handles token refresh, PKCE, all edge cases |
| Calendar availability | Manual event filtering | freebusy.query API | Optimized, handles recurring events, multi-calendar |
| Token encryption | Custom crypto | Use established patterns (sodium, node:crypto) | Security requires expertise |
| Spreadsheet creation | Drive API file creation | sheets.spreadsheets.create | Handles sheet structure, not just file |
| Slot calculation | Manual busy time subtraction | Well-tested interval libraries | Edge cases with overlapping events |

**Key insight:** Google's APIs handle complexity that isn't obvious - recurring events, timezone conversions, multi-calendar queries, and partial consent. The OAuth2Client handles token refresh automatically and emits events when tokens update.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Refresh Token Only Returned Once
**What goes wrong:** After first auth, refresh_token is undefined
**Why it happens:** Google only sends refresh token on first consent
**How to avoid:** Use `prompt: 'consent'` to force re-consent, or check for null and re-auth
**Warning signs:** Token expires after 1 hour and can't refresh

### Pitfall 2: Testing Mode 7-Day Token Expiry
**What goes wrong:** Refresh tokens suddenly stop working after ~7 days
**Why it happens:** OAuth consent screen in "Testing" mode expires tokens
**How to avoid:** Publish OAuth consent screen to "Production" or add test users
**Warning signs:** Works for a week then breaks for all users

### Pitfall 3: 50 Token Limit Per User
**What goes wrong:** Old tokens mysteriously stop working
**Why it happens:** Google limits 50 refresh tokens per user per app; new ones invalidate oldest
**How to avoid:** Reuse tokens, don't request new ones unnecessarily
**Warning signs:** Long-time users suddenly need to re-auth

### Pitfall 4: Wrong Scopes for Operations
**What goes wrong:** "Insufficient permission" errors
**Why it happens:** Calendar scope doesn't include Sheets, etc.
**How to avoid:** Request all needed scopes upfront, or use incremental auth
**Warning signs:** Some operations work, others fail with 403

### Pitfall 5: Token Refresh During Request
**What goes wrong:** Race conditions when multiple requests refresh simultaneously
**Why it happens:** Access token expires mid-request batch
**How to avoid:** googleapis library handles this; don't manually refresh
**Warning signs:** Intermittent auth errors under load

### Pitfall 6: Timezone Handling in Calendar
**What goes wrong:** Appointments booked at wrong times
**Why it happens:** Not specifying timezone in freebusy query or event creation
**How to avoid:** Always include `timeZone` parameter, use user's timezone
**Warning signs:** Events off by several hours
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Initialize OAuth2Client with Stored Tokens
```typescript
// Source: google-auth-library README
import { OAuth2Client } from 'google-auth-library';

export function createOAuth2Client(refreshToken?: string): OAuth2Client {
  const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  });

  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }

  return client;
}
```

### Vapi Tool Handler for Availability Check
```typescript
// Pattern from Vapi + Calendar integrations
export async function POST(req: Request) {
  const { message } = await req.json();

  // Vapi sends tool call with date/time parameters
  if (message.type === 'tool-calls') {
    const toolCall = message.toolCalls[0];
    if (toolCall.function.name === 'check_availability') {
      const { date } = toolCall.function.arguments;

      // Get user's OAuth client from stored token
      const userId = message.call.metadata?.userId;
      const oauth2Client = await getOAuth2ClientForUser(userId);

      // Query freebusy
      const slots = await getAvailableSlots(oauth2Client, new Date(date));

      return Response.json({
        results: [{
          toolCallId: toolCall.id,
          result: slots.length > 0
            ? `Available slots: ${slots.join(', ')}`
            : 'No availability on that date'
        }]
      });
    }
  }
}
```

### Complete OAuth Callback Handler
```typescript
// Source: Combined from google-auth-library and best practices
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect('/dashboard?error=google_auth_denied');
  }

  if (!code) {
    return NextResponse.redirect('/dashboard?error=no_code');
  }

  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Get user from session
  const sessionToken = cookies().get('session')?.value;
  const session = await getSession(sessionToken);

  if (!session) {
    return NextResponse.redirect('/login?error=no_session');
  }

  // Store encrypted refresh token
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      googleRefreshToken: encrypt(tokens.refresh_token!),
      googleConnectedAt: new Date()
    }
  });

  return NextResponse.redirect('/dashboard?success=google_connected');
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| googleapis v100+ | googleapis v148+ | Ongoing | TypeScript types improved, API coverage |
| Manual token refresh | Auto-refresh via `tokens` event | 2020+ | Less code, more reliable |
| Separate auth library | googleapis includes auth | Always | Can use either |

**New tools/patterns to consider:**
- **Incremental authorization:** Request scopes as needed, not all upfront
- **Cross-Account Protection (RISC):** Get notified when tokens are revoked

**Deprecated/outdated:**
- **googleapis v3 Sheets API:** Use v4
- **Manual token refresh loops:** Let library handle it
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Vapi tool call authentication**
   - What we know: Vapi sends tool calls to webhooks, we need user context
   - What's unclear: Best way to pass userId through Vapi call metadata
   - Recommendation: Store userId in Vapi call metadata when call starts, retrieve in tool handler

2. **Sheets ID persistence**
   - What we know: Need to store spreadsheet ID per user
   - What's unclear: Store in User model vs separate GoogleIntegration model
   - Recommendation: Add to User model for simplicity (single calendar, single sheet per user)
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- /googleapis/google-auth-library-nodejs - OAuth2 flow, token handling
- /googleapis/google-api-nodejs-client - API client patterns
- [Google Calendar API v3 Reference](https://developers.google.com/workspace/calendar/api/v3/reference) - freebusy, events.insert
- [Google Sheets API v4 Reference](https://developers.google.com/sheets/api/reference/rest/v4) - spreadsheets.create, values.append
- [Google OAuth2 Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) - token storage, security

### Secondary (MEDIUM confidence)
- [Building Voice AI with Vapi and Google Calendar](https://taritas.com/blog/building-a-voice-ai-workflow-with-vapi-and-google-calendar) - integration pattern
- [n8n Booking System Workflow](https://n8n.io/workflows/8635-complete-booking-system-with-google-calendar-business-hours-and-rest-api/) - availability checking patterns
- [duohub Google Calendar Voice Agent](https://github.com/duohub-ai/google-calendar-voice-agent) - voice + calendar example

### Tertiary (LOW confidence - needs validation)
- None - all findings verified with primary sources
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Google OAuth2, Calendar API v3, Sheets API v4
- Ecosystem: googleapis npm, google-auth-library
- Patterns: OAuth flow, freebusy query, event insertion, sheet creation
- Pitfalls: Token expiry, testing mode, scope requirements

**Confidence breakdown:**
- Standard stack: HIGH - official Google libraries, well-documented
- Architecture: HIGH - patterns from official docs and production examples
- Pitfalls: HIGH - documented in official troubleshooting guides
- Code examples: HIGH - adapted from official library READMEs

**Research date:** 2025-12-25
**Valid until:** 2026-01-25 (30 days - Google APIs are stable)
</metadata>

---

*Phase: 04-google-integrations*
*Research completed: 2025-12-25*
*Ready for planning: yes*
