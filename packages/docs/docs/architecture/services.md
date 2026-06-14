---
title: Services Reference
---

# Services

Detailed reference for each service in the architecture.

## MicService

Manages microphone input capture.

**Methods:**
- `start(callback)` — Start capturing audio
- `stop()` — Stop capturing and cleanup

**File:** `packages/web/src/app/core/services/mic.service.ts`

---

## WhisperService

Speech-to-text using Whisper.cpp WASM.

**Methods:**
- `process(audio)` — Process an audio chunk
- `reset()` — Clear state

**Observables:**
- `transcript$` — Running transcript text
- `utterance$` — Completed utterance events
- `status$` — Status messages

**File:** `packages/web/src/app/core/services/whisper.service.ts`

---

## ParserService

Extract structured data from text.

**Methods:**
- `extract(text)` — Parse all fields
- `directAnswer(field, text)` — Parse reply
- `correction(field, text)` — Parse correction
- `isYes(text)` / `isNo(text)` — Parse confirmation

**File:** `packages/web/src/app/core/services/parser.service.ts`

---

## AgentService

Conversational state machine.

**Methods:**
- `start()` — Initialize
- `handle(utterance)` — Process user input
- `reset()` — Reset state

**Properties:**
- `view` — Current form state
- `completed` — Whether form is complete

**File:** `packages/web/src/app/core/services/agent.service.ts`

---

## TtsService

Text-to-speech via Web Speech API.

**Methods:**
- `speak(text)` — Start speaking
- `stop()` — Cancel speech

**Properties:**
- `speaking` — Whether currently speaking

**File:** `packages/web/src/app/core/services/tts.service.ts`

---

See [Architecture Overview](./overview.md) for how services interact.
