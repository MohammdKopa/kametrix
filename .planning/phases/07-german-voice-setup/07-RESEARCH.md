# Phase 7: German Voice Setup - Research

**Researched:** 2025-12-27
**Domain:** Vapi German voice configuration (TTS & STT)
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Vapi ecosystem for configuring German voice agents, including text-to-speech (TTS) and speech-to-text (STT) providers. The current Kametrix v1.0 implementation uses ElevenLabs for TTS with English voice "marissa" and Deepgram Nova-2 with English language.

Key finding: Converting to German requires changes in two places:
1. **TTS (voice)**: Switch from ElevenLabs English voice to Azure German voice `de-DE-KatjaNeural` (recommended by Vapi community for natural German phone conversations)
2. **STT (transcriber)**: Change Deepgram language from `en` to `de` (Nova-2 fully supports German)

The Vapi community specifically recommends Azure `de-DE-KatjaNeural` for German phone-based applications due to its natural sound and improved English word pronunciation for mixed-language contexts (common in business settings).

**Primary recommendation:** Use Azure TTS with `de-DE-KatjaNeural` voice and Deepgram Nova-2 with `language: "de"`. Update system prompts to German. Configure as defaults (no language selection UI needed).
</research_summary>

<standard_stack>
## Standard Stack

### Core (Recommended for German)
| Provider | Purpose | Voice/Model | Why Recommended |
|----------|---------|-------------|-----------------|
| Azure | TTS (voice) | `de-DE-KatjaNeural` | Vapi community recommended for German phone calls, natural sound, handles English words well |
| Deepgram | STT (transcriber) | `nova-2` with `de` language | Already in use, fully supports German with 8.4% word error rate |

### Supporting Options
| Provider | Purpose | Voice/Model | When to Use |
|----------|---------|-------------|-------------|
| ElevenLabs | TTS | `eleven_multilingual_v2` model | If more emotional range needed, use German community voices |
| Azure | Alternative voices | `de-DE-ConradNeural` (male) | If male voice preferred |
| Azure | HD voices | Upgraded emotional detection | If budget allows, more expressive |

### Current v1.0 Implementation (to be replaced)
| Component | Current | New (German) |
|-----------|---------|--------------|
| TTS Provider | `11labs` | `azure` |
| Voice ID | `marissa` (English) | `de-DE-KatjaNeural` |
| STT Provider | `deepgram` | `deepgram` (unchanged) |
| STT Model | `nova-2` | `nova-2` (unchanged) |
| STT Language | `en` | `de` |

**Installation:** No new packages needed - Vapi SDK handles provider switching.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/lib/vapi/
├── assistants.ts    # CREATE/UPDATE assistant config (modify voice/transcriber)
├── types.ts         # Add language-related types
├── client.ts        # No changes needed
└── phones.ts        # No changes needed
```

### Pattern 1: Hardcoded German Configuration
**What:** Remove language selection, hardcode German as the only option
**When to use:** German-market only product (Kametrix case)
**Example:**
```typescript
// src/lib/vapi/assistants.ts
const assistantConfig = {
  // ... other config
  voice: {
    provider: 'azure',
    voiceId: 'de-DE-KatjaNeural',
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'de',  // Changed from 'en'
  },
};
```

### Pattern 2: Azure Voice with Fallback
**What:** Configure fallback voices for reliability
**When to use:** Production deployments requiring high availability
**Example:**
```typescript
// Vapi voice configuration with fallback
{
  voice: {
    provider: 'azure',
    voiceId: 'de-DE-KatjaNeural',
    fallbackPlan: {
      voices: [
        {
          provider: 'azure',
          voiceId: 'de-DE-ConradNeural',  // Male fallback
        },
        {
          provider: '11labs',
          voiceId: 'some-german-voice-id',  // ElevenLabs fallback
          model: 'eleven_multilingual_v2',
        },
      ],
    },
  },
}
```

### Pattern 3: German System Prompt
**What:** Write system prompts in German for natural conversation
**When to use:** Phase 8 (German Prompts & Localization)
**Note:** Keep prompts in English for Phase 7, localize in Phase 8

### Anti-Patterns to Avoid
- **Adding language selection UI:** Not needed for German-only market
- **Using English voice IDs with German transcriber:** Mismatch causes confusion
- **Using ElevenLabs with non-multilingual model:** English-only models won't work for German
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| German pronunciation | Custom phoneme mapping | Azure Neural TTS | Azure trained on native German speakers |
| Mixed language handling | Language detection logic | Azure's cross-lingual capability | Handles English words in German context automatically |
| Voice quality tuning | Audio post-processing | Provider speed/pitch settings | Providers handle this optimally |
| Fallback logic | Custom retry/failover | Vapi `fallbackPlan` | Built into Vapi configuration |

**Key insight:** Vapi abstracts all voice provider complexity. Just change config values, no code logic changes needed.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Forgetting to Change Transcriber Language
**What goes wrong:** Agent speaks German but doesn't understand German callers
**Why it happens:** Only updating TTS voice, not STT language
**How to avoid:** Always update both `voice` AND `transcriber.language` together
**Warning signs:** High "didn't understand" responses, low call completion rates

### Pitfall 2: Using Wrong ElevenLabs Model
**What goes wrong:** Voice speaks English even with German text
**Why it happens:** Using `eleven_turbo_v2` (English-optimized) instead of `eleven_multilingual_v2`
**How to avoid:** If using ElevenLabs, always use `eleven_multilingual_v2` model
**Warning signs:** Words pronounced with English accent, unnatural speech

### Pitfall 3: System Prompt Language Mismatch
**What goes wrong:** Agent responds in English despite German voice
**Why it happens:** System prompt written in English, LLM continues in English
**How to avoid:** Either use German system prompt (Phase 8) OR explicitly instruct to respond in German
**Warning signs:** Mixed language responses

### Pitfall 4: Testing with English Speech
**What goes wrong:** Transcription fails during testing
**Why it happens:** Developer speaks English to test, but transcriber set to `de`
**How to avoid:** Test with actual German speech, or use text-based testing first
**Warning signs:** Empty transcripts, low confidence scores
</common_pitfalls>

<code_examples>
## Code Examples

### Current v1.0 English Configuration
```typescript
// src/lib/vapi/assistants.ts (lines 140-148) - CURRENT
const assistantConfig = {
  // ...
  voice: {
    provider: '11labs',
    voiceId: config.voiceId ?? 'marissa',
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en',
  },
};
```

### Target German Configuration
```typescript
// src/lib/vapi/assistants.ts - AFTER Phase 7
const assistantConfig = {
  // ...
  voice: {
    provider: 'azure',
    voiceId: 'de-DE-KatjaNeural',  // German female voice
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'de',  // German language
  },
};
```

### Update Function Changes
```typescript
// src/lib/vapi/assistants.ts - updateAssistant function
if (config.voiceId) {
  updatePayload.voice = {
    provider: 'azure',  // Changed from '11labs'
    voiceId: config.voiceId,  // Now expects Azure voice IDs
  };
}
```

### Greeting Message (Temporary English, Phase 8 will localize)
```typescript
// Phase 7: Keep English greeting for now
const greeting = config.greeting ??
  `Hello! Thank you for calling ${config.businessName}. How can I help you today?`;

// Phase 8 will change to:
const greeting = config.greeting ??
  `Guten Tag! Danke für Ihren Anruf bei ${config.businessName}. Wie kann ich Ihnen helfen?`;
```
</code_examples>

<sota_updates>
## State of the Art (2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ElevenLabs for all languages | Azure for German (recommended) | 2024 | Better German pronunciation, lower latency |
| Deepgram Nova-1 | Deepgram Nova-2/Nova-3 | 2024-2025 | 30% lower word error rate |
| Manual language detection | Provider auto-detect | 2024 | Simpler configuration |

**New tools/patterns to consider:**
- **Azure HD Voices:** Enhanced emotional detection (Feb 2025), available in EU regions
- **Deepgram Nova-3:** Added de-CH (Swiss German) support, useful if expanding to Switzerland
- **Vapi GPT Realtime:** Most natural voice but expensive, consider for premium tier

**Deprecated/outdated:**
- **Deepgram Nova-1:** Replaced by Nova-2 with better accuracy
- **ElevenLabs Turbo v2:** Not recommended for non-English, use Multilingual v2 instead
</sota_updates>

<open_questions>
## Open Questions

1. **Male voice alternative**
   - What we know: `de-DE-ConradNeural` is available as male option
   - What's unclear: User preference for male vs female voice
   - Recommendation: Default to Katja (female, more commonly used in reception), allow override via voiceId

2. **ElevenLabs German voice IDs**
   - What we know: Community has German voices, accessible via Voice Library
   - What's unclear: Specific voice IDs for high-quality German voices
   - Recommendation: Stick with Azure for Phase 7, evaluate ElevenLabs in future if needed

3. **Swiss German support**
   - What we know: Nova-3 supports de-CH, Azure has Swiss voices
   - What's unclear: Whether Kametrix will expand to Switzerland/Austria
   - Recommendation: Out of scope for Phase 7, revisit if market expands
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Vapi Docs - Multilingual Support](https://docs.vapi.ai/customization/multilingual) - Language configuration patterns
- Context7 /docs.vapi.ai/llmstxt - Voice provider configurations, API schemas
- Current codebase `src/lib/vapi/assistants.ts` - v1.0 implementation to modify

### Secondary (MEDIUM confidence)
- [Vapi Community - Best German Voice Model](https://vapi.ai/community/m/1451188865300959243) - Azure de-DE-KatjaNeural recommendation
- [Deepgram Nova-2 Language Support](https://deepgram.com/learn/nova-2-speech-to-text-api-expands-to-36-languages) - German included in 36 languages
- [Azure German Voices](https://json2video.com/ai-voices/azure/languages/german/) - Full list of de-DE voices
- [Azure Neural TTS Updates](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-neural-tts-improves-english-word-reading-for-mixed-lingual-text/3785920) - English word handling in German

### Tertiary (LOW confidence - needs validation)
- ElevenLabs German community voices - specific voice IDs not documented, would need API exploration
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Vapi voice/transcriber configuration
- Ecosystem: Azure TTS, Deepgram STT, ElevenLabs (alternative)
- Patterns: Provider switching, fallback configuration
- Pitfalls: Language mismatch, model selection, testing

**Confidence breakdown:**
- Standard stack: HIGH - Azure/Deepgram combo verified by Vapi community
- Architecture: HIGH - Simple config changes, no structural modifications
- Pitfalls: HIGH - Common issues documented in community discussions
- Code examples: HIGH - Based on actual v1.0 codebase

**Research date:** 2025-12-27
**Valid until:** 2026-01-27 (30 days - stable provider ecosystem)
</metadata>

---

*Phase: 07-german-voice-setup*
*Research completed: 2025-12-27*
*Ready for planning: yes*
