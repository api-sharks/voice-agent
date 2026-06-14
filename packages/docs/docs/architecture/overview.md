---
title: Architecture Overview
---

# Architecture Overview

Voice AI Form is built on a modular service-based architecture with clear separation of concerns.

## High-Level Flow

```
User speaks → Microphone → Audio chunks → RMS-based VAD
                                              ↓
                    Barge-in detection? (if bot speaking)
                         ↙              ↖
                       YES               NO
                         ↓                ↓
                  Stop TTS,          Normal flow:
                  transcribe       Process chunks →
                     ↓                   ↓
                  ─────────────────────────
                         ↓
                  Whisper.cpp WASM
                         ↓
                  Raw text transcript
                         ↓
                  Regex-based Parser
                         ↓
                  Extracted values (name, phone, city)
                         ↓
                  Conversational Agent
                         ↓
                  Decision: ask, confirm, or summarize
                         ↓
                  Web Speech API (TTS)
                         ↓
                  User hears response
```

## Services

### MicService
Manages microphone input via Web Audio API.

- Initializes `AudioContext` at 16kHz (Whisper's sample rate)
- Creates `ScriptProcessorNode` to capture chunks (4096 samples ≈ 256ms)
- Enables **echo cancellation**, **noise suppression**, **auto gain control** via `getUserMedia` constraints
- Calls a callback for each audio chunk

### WhisperService
Offline speech-to-text using Whisper.cpp WASM.

- Lazily loads `/assets/whisper/stream.js` on first audio chunk
- Buffers audio and uses RMS-based voice activity detection (VAD)
- Emits `utterance$` when a complete utterance is detected (~0.8s of silence)
- Emits `transcript$` for cumulative text (used for UI feedback)

### ParserService
Extracts structured data from raw transcript text.

- Regex-based extraction for: **name**, **phone**, **city**
- Multilingual support: English, Hindi, Telugu
- Methods:
  - `extract(text)` — Parse all fields from general speech
  - `directAnswer(field, text)` — Parse a short reply ("John", "9876543210")
  - `correction(field, text)` — Parse a correction ("no, it's Mumbai")
  - `isYes(text)` / `isNo(text)` — Detect confirmation

### AgentService
Conversational state machine for form collection.

**States:**
```
asking → confirming → (all confirmed?) → summary → completed
  ↑                                          ↓
  └──────────── (user corrects) ────────────┘
```

**Methods:**
- `start()` — Initialize with greeting
- `handle(utterance)` — Process user input, return bot reply
- `view` — Current state (confirmed + pending fields)
- `completed` — Whether all fields are filled and confirmed

### TtsService
Browser-native text-to-speech via Web Speech API.

- `speak(text)` — Start speaking
- `stop()` — Cancel speech immediately (used for barge-in)
- `speaking` getter — Check if currently speaking

## Components

### VoiceFormComponent
Orchestrates the entire voice flow.

**Key Responsibilities:**
1. **Mic management** — `start()`, `stop()`
2. **Barge-in detection** — RMS energy check while TTS is active
3. **Audio processing** — Routes chunks to Whisper or buffers for barge-in
4. **Utterance handling** — Routes transcribed utterances to Agent
5. **Form display** — Updates form fields as Agent confirms values

**Barge-in Logic:**
```typescript
if (!tts.speaking) {
  // Normal: transcribe audio
  whisper.process(chunk);
} else {
  // Bot is talking: listen for interruption
  if (rms(chunk) > BARGE_IN_RMS) {
    bargeInBuffer.push(chunk);
    if (bargeInBuffer.length >= BARGE_IN_CHUNKS) {
      tts.stop();
      bargeInBuffer.forEach(c => whisper.process(c));
    }
  }
}
```

## Data Flow Example

**User says:** *"My name is John"*

1. **MicService** captures audio in chunks
2. **VoiceFormComponent.onAudioChunk()** routes to WhisperService
3. **WhisperService** detects silence after ~0.8s and emits `utterance$`
4. **VoiceFormComponent.handleUtterance()** receives "My name is John"
5. **AgentService.handle()** processes it:
   - Parser extracts: `{ name: "John" }`
   - Agent asks: *"Is your name John?"* (reads it back)
   - Returns reply
6. **TtsService.speak()** outputs the confirmation question
7. User says: *"Yes"*
8. **Repeat from step 1** — next field

## Key Design Decisions

### Why RMS-based Barge-in?
- **Simple** — Single float calculation per chunk
- **Fast** — No ML overhead, ~256ms latency
- **Works** — Echo cancellation filters bot audio, so only user's voice is loud
- **Configurable** — Easy to tune threshold and duration

### Why Offline Whisper?
- **Privacy** — No audio sent to cloud
- **Reliability** — Works without internet
- **Cost** — No API calls
- **Tradeoff** — Slower than cloud (but acceptable for form flow)

### Why Regex Parser?
- **Lightweight** — No ML models needed
- **Predictable** — Deterministic output
- **Extensible** — Add new fields easily
- **Multilingual** — Easy to add language variants

### Why Web Speech API for TTS?
- **Built-in** — Available on all modern browsers
- **Free** — No API keys or costs
- **Configurable** — Voice, rate, pitch adjustments
- **Tradeoff** — Quality varies by browser, limited voice options

## Cross-origin Isolation

**Requirement:** Whisper.cpp uses `SharedArrayBuffer`, which requires strict cross-origin headers.

**Development:** `ng serve` already sets headers in `angular.json`:
```json
"headers": [
  {
    "key": "Cross-Origin-Opener-Policy",
    "value": "same-origin"
  },
  {
    "key": "Cross-Origin-Embedder-Policy",
    "value": "require-corp"
  }
]
```

**Production:** Host must send these headers in HTTP responses.

## Error Handling

| Error | Recovery |
|-------|----------|
| Mic permission denied | Show message, let user retry |
| Whisper WASM load fails | Fallback to Web Speech API (if implemented) |
| TTS timeout | Continue listening (bot gives up mid-phrase) |
| Parser can't extract field | Agent re-asks the question |

## Performance

| Metric | Value |
|--------|-------|
| Audio chunk size | 4096 samples (256ms at 16kHz) |
| Whisper buffer | 5s sliding window (consumes and clears) |
| Silence threshold | ~0.8s |
| Barge-in detection latency | ~256ms (one chunk) |
| Barge-in sustain duration | ~500ms (2 chunks at BARGE_IN_RMS) |

## Scalability

**Current scope:** Single user, offline, no backend.

**To add multi-user or cloud backend:**
1. Add WebSocket service
2. Route transcripts to server instead of local Agent
3. Use server-side conversational AI (e.g., OpenAI, Anthropic)
4. Return TTS text to client

See [Pipecat integration](../monorepo/packages) for hybrid approach.

---

**Next:** [Services Detail](./services.md) | [Data Flow](./data-flow.md)
