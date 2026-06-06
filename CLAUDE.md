# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm start         # dev server at http://localhost:4200
npm run build     # production build → dist/
```

No test runner is configured.

## Architecture

Angular 17 standalone app. `AppComponent` is a thin shell that renders `VoiceFormComponent`, which orchestrates the full voice-to-form flow.

### Data flow

```
Mic → Whisper worker → Parser → Agent → TTS
                                    ↓
                               ReactiveForm
```

1. **MicService** — captures audio via `getUserMedia` and sends `Float32Array` chunks to a callback.
2. **WhisperService** — owns a Web Worker (`src/assets/whisper/whisper.worker.js`). Receives audio chunks via `postMessage`, emits transcription text and status through two `BehaviorSubject` observables (`transcript$`, `status$`).
3. **ParserService** — regex-based extraction of `name`, `phone`, `city` from raw transcript text. Supports English and several Indic language phrasings (Hindi, Telugu). Phone regex targets Indian mobile numbers (`+91` prefix, `[6-9]\d{9}`).
4. **AgentService** — tracks which of the three fields are still missing and what value each holds. `next()` returns the next missing field; `question()` returns the prompt string for that field.
5. **TtsService** — wraps the Web Speech API (`speechSynthesis`) for text-to-speech prompts.
6. **VoiceFormComponent** — wires the services together via constructor subscriptions and exposes `start()`, `stop()`, `reset()` to the template.

### Whisper assets

`src/assets/whisper/` contains a **placeholder** implementation (not a real WASM model). To enable real offline transcription, replace `whisper.js`, `whisper.wasm`, and `ggml-tiny.bin` with actual Whisper.cpp WASM build artifacts. The worker protocol is: receive `Float32Array` → post `{ type: 'transcript', text }` or `{ type: 'status', status }`.

### Angular config notes

- All components are standalone (no NgModule).
- Services are `providedIn: 'root'` (singleton via root injector).
- Worker URL uses `new URL(…, import.meta.url)` — Angular build handles the asset copy automatically.
