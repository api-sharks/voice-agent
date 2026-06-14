# Voice AI Form Advanced

**Angular 17 standalone application** for a conversational voice-driven form collection with barge-in (interrupt) support.

## Features

- 🎤 **Microphone capture** — Real-time audio input at 16kHz mono
- 🗣️ **Whisper.cpp WASM** — Offline speech-to-text (tiny model, ~75MB)
- 🎯 **Smart parsing** — Extract name, phone, city from natural speech
- 💬 **Conversational flow** — Asks questions, reads back values, asks for confirmation
- 🤐 **Barge-in support** — Interrupt the bot mid-sentence using RMS-based detection
- 🔊 **Web Speech API** — Browser-native text-to-speech with improved timeout handling
- 🌍 **Multilingual** — English and Indic language support (Hindi, Telugu)

## Quick Start

```bash
npm install
npm start
```

Open http://localhost:4200

## Architecture

```
Microphone → Web Audio API → RMS-based barge-in detection
                                        ↓
                                 Whisper.cpp WASM
                                        ↓
                              Regex-based parser
                                        ↓
                            Conversational agent
                                        ↓
                          Web Speech API (TTS)
```

## How It Works

### Core Flow

1. **Listening** — Mic captures audio, processed into Whisper
2. **Speaking** — Agent generates a question, TTS speaks it
3. **Interruption** — While TTS plays, if user speaks loudly enough, bot stops and listens (barge-in)
4. **Parsing** — User's utterance is extracted for the form field
5. **Confirmation** — Agent reads back the value and asks for yes/no
6. **Repeat** — Next field, same process

### Barge-in Detection

While the bot is speaking, the system monitors mic RMS energy:
- If RMS > 0.04 for ~0.5s sustained, the bot stops
- Those audio chunks are sent to Whisper
- Normal flow resumes with the user's input

See [DUPLEX_COMMUNICATION.md](./DUPLEX_COMMUNICATION.md) for detailed barge-in configuration.

## Project Structure

See [STRUCTURE.md](./STRUCTURE.md) for full monorepo layout.

**Main app:** `packages/web/` (Angular)
- Components: `AppComponent`, `VoiceFormComponent`
- Services: `MicService`, `WhisperService`, `ParserService`, `AgentService`, `TtsService`
- Assets: `src/assets/whisper/` contains Whisper WASM and model

## Configuration

### Barge-in Sensitivity

Edit `VoiceFormComponent` to adjust:

```typescript
const BARGE_IN_RMS = 0.04;      // Energy threshold (higher = harder to interrupt)
const BARGE_IN_CHUNKS = 2;      // ~0.5s at 16kHz (increase for less sensitive)
```

### Language Support

Edit `WhisperService` `LANGUAGE` constant:

```typescript
const LANGUAGE = 'en';  // or 'hi', 'te', etc. (model is multilingual)
```

### Transcription Language

Parser supports:
- **English** — "My name is John"
- **Hindi** — "Mera naam John hai"
- **Telugu** — "Naa peru John"

Phone regex targets Indian mobile numbers: `[6-9]\d{9}` (with optional `+91` prefix).

## Cross-origin Isolation (Required)

Whisper.cpp uses `SharedArrayBuffer`, which requires strict cross-origin headers.

- **Development:** `ng serve` already sets headers (see `angular.json`)
- **Production:** Host must send:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```

Without these headers, you'll see: *"ShareArrayBuffer unavailable — cross-origin isolation required."*

## Build

```bash
npm run build:web     # Production build → packages/web/dist/

# Or via Turbo:
turbo run build
```

## Testing

1. Open http://localhost:4200
2. Click **Start** to begin
3. Wait for greeting and first question
4. Speak clearly (e.g., "My name is John")
5. Bot reads it back — say "yes" to confirm or "no" to correct
6. Interrupt the bot mid-sentence by speaking loudly

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Mic permission denied | Check browser settings, reload, try again |
| "Cross-origin isolation required" | Ensure COOP/COEP headers (see above) |
| Barge-in not working | Increase speaker volume, move closer to mic, or lower `BARGE_IN_RMS` |
| Whisper too slow | Model is on HDD? Move to SSD, or pre-load via DevTools |
| Parser misses city | Add to regex in `ParserService`, or use "change my city to X" |

## Next Steps

- Customize the form fields in `AgentService`
- Add more languages by extending `ParserService`
- Integrate a real LLM backend via REST API
- Deploy to production with proper CORS/isolation headers

See [CLAUDE.md](./CLAUDE.md) for architecture deep-dive.
