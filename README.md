# Voice AI Form Advanced

Angular standalone app for a voice-driven form flow with:

- microphone capture
- worker-based Whisper integration path
- multilingual parsing for name, phone, and city
- conversational follow-up prompts
- browser speech synthesis for text-to-speech

## Run

```bash
npm install
npm start
```

Then open `http://localhost:4200`.

## Whisper Assets

This repo ships with a safe placeholder Whisper layer so the app can run immediately.

To swap in real offline transcription assets later, replace the placeholder files in [src/assets/whisper](/C:/Users/WaheedAhmedHyder/Documents/Codex/2026-04-24/https-chatgpt-com-s-t-69eb295ca97481918b45d77cd66a7df3/src/assets/whisper):

- `whisper.js`
- `whisper.wasm`
- `ggml-tiny.bin`

The worker entry point is [src/assets/whisper/whisper.worker.js](/C:/Users/WaheedAhmedHyder/Documents/Codex/2026-04-24/https-chatgpt-com-s-t-69eb295ca97481918b45d77cd66a7df3/src/assets/whisper/whisper.worker.js).

## Notes

- Browser microphone permission is required.
- Text-to-speech uses the built-in Web Speech API.
- The parser is regex-based and easy to extend for more languages or fields.
