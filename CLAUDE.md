# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a **Turbo monorepo** with npm workspaces:

- `packages/web` — Angular 17 web application
- `packages/shared` — Shared services and utilities (for future service extraction)

See [README-MONOREPO.md](./README-MONOREPO.md) for detailed setup.

## Commands

```bash
npm install              # install dependencies for all packages
npm start                # dev server at http://localhost:4200
npm run build            # production build → dist/
npm run dev:web          # dev server for web package only
npm run build:web        # build web package only
turbo run build          # build all packages with caching
```

No test runner is configured.

## Architecture

Angular 17 standalone app. `AppComponent` is a thin shell that renders `VoiceFormComponent`, which orchestrates the full voice-to-form flow.

### Data flow

```
Mic → Whisper (WASM) → Parser → Agent → TTS
                                    ↓
                               ReactiveForm
```

1. **MicService** — captures audio via `getUserMedia` at 16kHz mono (Whisper's expected rate) and sends `Float32Array` chunks to a callback.
2. **WhisperService** — drives the whisper.cpp `stream.wasm` build (`src/assets/whisper/stream.js`, loaded lazily via script tag on first audio chunk). The build spawns its own pthread workers for inference. The service buffers audio and uses RMS-based voice activity detection to push each utterance to `Module.set_audio` exactly once (after ~0.8s of trailing silence, or at the engine's 5s window cap) — the C++ side consumes-and-clears, so re-sending a rolling buffer would transcribe the same speech repeatedly. It polls `Module.get_transcribed()` every 250ms and emits through `transcript$` (cumulative text), `utterance$` (one emission per utterance), and `status$`. `process()` is invoked from `onaudioprocess`, which zone.js does not patch — all subject emissions are wrapped in `NgZone.run` or change detection won't fire.
3. **ParserService** — regex-based extraction of `name`, `phone`, `city` from raw transcript text. Supports English and several Indic language phrasings (Hindi, Telugu). Phone regex targets Indian mobile numbers (optional `+91`, `[6-9]\d{9}`, tolerant of digit-group spaces from Whisper). Also: `directAnswer(field, text)` reads a short utterance as a bare reply to the asked field, `correction(field, text)` extracts a replacement value from "no, it's X" phrasings, and `isYes`/`isNo` detect confirmations (NO is checked before YES so "that's not right" reads as no).
4. **AgentService** — conversational state machine (`asking → confirming → summary → completed`). Every captured value is read back for yes/no confirmation; all fields confirmed triggers a full summary verification. Explicit re-statements ("change my city to Mumbai", "my name is Rahul") are accepted as corrections in any phase, including after completion, and always re-confirmed. `handle(utterance)` returns the reply to speak or `null` to stay quiet; `view` exposes confirmed + pending values for the form.
5. **TtsService** — wraps the Web Speech API (`speechSynthesis`); `speaking` getter and `stop()` support barge-in.
6. **VoiceFormComponent** — wires the services together via constructor subscriptions and exposes `start()`, `stop()`, `reset()` to the template. Routes each `utterance$` emission through `agent.handle()`. While TTS is speaking, mic chunks are dropped unless they exceed a louder RMS threshold for ~0.5s — that's user barge-in: TTS is cancelled and the buffered chunks are transcribed.

### Whisper assets

`src/assets/whisper/` contains real whisper.cpp artifacts:

- `stream.js` — emscripten build of `examples/stream.wasm` (single file, WASM embedded, pthread-based) from https://ggml.ai/whisper.cpp/stream.wasm/
- `ggml-tiny.bin` — multilingual Whisper tiny model (~75MB) from https://huggingface.co/ggerganov/whisper.cpp

Embind API: `Module.init(modelPath, lang)` → instance, `Module.set_audio(instance, Float32Array)` (16kHz; the C++ thread consumes the last 5s window), `Module.get_transcribed()` (returns-and-clears), `Module.get_status()`. The transcription language is the `LANGUAGE` constant in `whisper.service.ts` (currently `'en'`; the model is multilingual, so `'hi'`, `'te'`, etc. also work).

**Cross-origin isolation is required** (the build uses SharedArrayBuffer). `ng serve` sets COOP/COEP headers via the `headers` option in `angular.json`; any production host must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, or transcription will fail with a clear status message.

### Angular config notes

- All components are standalone (no NgModule).
- Services are `providedIn: 'root'` (singleton via root injector).
