# Voice AI Assistant - Project Guide

This is a real-time voice AI application built with Next.js, combining speech-to-text (Whisper), local LLM inference (WebLLM), and voice synthesis.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Development server at http://localhost:3000
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint checks
```

## Architecture

### Data Flow

```
User speaks
    ↓
[AudioService] captures audio via Web Audio API
    ↓
[WhisperService] transcribes with Whisper model (Transformers.js)
    ↓
[VoiceChat] sends to WebLLM for response
    ↓
[WebLLMService] generates response using local LLM
    ↓
[AudioService] speaks response via Web Speech API
    ↓
Back to listening
```

## Key Services

### WhisperService (lib/services/whisper.service.ts)

Handles speech-to-text conversion using Transformers.js.

**Methods:**
- `initialize()` - Load Whisper model
- `transcribe(audioBlob)` - Convert audio blob to text
- `transcribeFromFile(file)` - Convert audio file to text

**Model:** Xenova/whisper-tiny (can be changed to -base, -small, -medium, -large)

### WebLLMService (lib/services/webllm.service.ts)

Manages local LLM inference using MLC-AI's WebLLM.

**Methods:**
- `initialize(modelId, onProgress)` - Load LLM model
- `generateResponse(messages, temperature)` - Single response
- `streamResponse(messages, onChunk, temperature)` - Streaming response
- `isInitialized()` - Check engine status

**Default Model:** TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC

### AudioService (lib/services/audio.service.ts)

Handles audio recording and playback with Web Audio API.

**Methods:**
- `startRecording()` - Begin audio capture
- `stopRecording()` - End recording and return Blob
- `cancelRecording()` - Discard recording
- `speakText(text, lang)` - Text-to-speech via Web Speech API
- `stopSpeaking()` - Cancel speech output
- `isSpeaking()` / `getRecordingStatus()` - Check state

## Main Component

### VoiceChat (components/VoiceChat.tsx)

Single-component UI orchestrating the full voice conversation flow.

**States:**
- `engineReady` - WebLLM initialized
- `isRecording` - Audio being captured
- `isProcessing` - Transcription/response generation in progress
- `isInitializing` - Loading models

## Configuration

### Model Selection

**LLM Models** (change in VoiceChat.tsx):
- `TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC` - Smallest (~400MB)
- `Mistral-7B-Instruct-v0.2-q4f16_1-MLC` - Mid-size (~3.5GB)
- `Llama-2-7b-chat-hf-q4f32_1-MLC` - Larger (~3.5GB)

**Whisper Models** (change in whisper.service.ts):
- `whisper-tiny` - 75MB, fast but less accurate
- `whisper-base` - 140MB
- `whisper-small` - 450MB
- `whisper-medium` - 1.5GB
- `whisper-large` - 3.1GB, most accurate

## Performance Optimization

### First-Time Loading
1. Whisper model downloads automatically on first transcription
2. WebLLM model downloads on engine initialization
3. Models are cached in IndexedDB for subsequent loads

### Tips
- Use `whisper-tiny` for faster transcription
- Use `TinyLlama-1.1B` for faster responses
- Monitor DevTools for memory usage
- Clear IndexedDB if running into storage issues

## Development

### Adding Features
1. **Custom Response Processing** - Modify WebLLM response in VoiceChat.tsx
2. **Custom Audio Processing** - Extend AudioService with filters
3. **Custom UI** - Modify VoiceChat.tsx styles (Tailwind)
4. **Language Support** - Change `lang` parameter in speakText()

### Browser Requirements
- Modern browser with WASM support
- At least 2GB RAM
- Fast internet for initial model downloads
- Microphone access

## Limitations

- **Internet Required** - Initial model downloads
- **Browser Storage** - Models take 400MB - 3.5GB
- **Performance** - Depends on device CPU/RAM
- **Mobile** - Use smaller models

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Transformers.js](https://xenova.github.io/transformers.js/)
- [WebLLM Docs](https://webllm.mlc.ai/)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
