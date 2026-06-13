# Voice AI Assistant - Next.js + Whisper + WebLLM

A real-time voice AI assistant built with Next.js, Whisper (speech-to-text), and WebLLM (local LLM inference). Everything runs in the browser with no backend required.

## 🎯 Features

- **🎤 Speech Recognition** - Whisper.js for accurate speech-to-text
- **🧠 Local LLM** - WebLLM for on-device LLM inference (privacy-first)
- **🔊 Text-to-Speech** - Native Web Speech API for voice responses
- **⚡ Real-time** - Low-latency voice conversation
- **🔒 Privacy** - All processing happens locally in the browser
- **📱 Responsive** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Speech Recognition**: Transformers.js (Whisper)
- **LLM Inference**: @mlc-ai/web-llm
- **Audio**: Web Audio API + Web Speech API

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern browser with support for:
  - Web Audio API
  - MediaRecorder API
  - Web Workers
  - WebAssembly (WASM)

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Quick Start

1. **Initialize Engine** - Click "Initialize Engine" to load the LLM model
2. **Start Recording** - Click the microphone button to speak
3. **Stop Recording** - Click "Stop Recording" when done
4. **Get Response** - AI transcribes, generates response, and speaks it back

## 📁 Project Structure

```
voice-ai-nextjs/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   └── VoiceChat.tsx       # Main voice chat component
├── lib/
│   └── services/
│       ├── whisper.service.ts    # Speech-to-text
│       ├── webllm.service.ts     # LLM inference
│       ├── audio.service.ts      # Audio handling
│       └── index.ts              # Service exports
└── package.json
```

## 🔧 Configuration

### Changing the LLM Model

Edit in `components/VoiceChat.tsx`:

```typescript
await webllmService.initialize('TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC')
```

Available models:
- `TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC` (1.1B params, ~400MB)
- `Mistral-7B-Instruct-v0.2-q4f16_1-MLC` (7B params, ~3.5GB)
- `Llama-2-7b-chat-hf-q4f32_1-MLC` (7B params, ~3.5GB)

### Whisper Model Selection

Edit in `lib/services/whisper.service.ts`:

```typescript
transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
// Options: whisper-tiny, whisper-base, whisper-small, whisper-medium, whisper-large
```

## 📊 Performance Notes

- **First Load**: Models download on first use (can take 2-5 minutes)
- **Cached Models**: Subsequent loads use browser cache
- **Storage**: Models require 400MB - 3.5GB depending on model size
- **Memory**: Requires 2GB+ RAM for inference

## 🐛 Troubleshooting

### Microphone permission denied
- Allow microphone access when prompted
- Check browser settings

### Model loading is slow
- Normal for first-time setup
- Models are cached after download

### No speech detected
- Speak clearly at normal volume
- Ensure adequate silence at end

## 🔄 Available Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint
```

## 📚 Resources

- [Transformers.js](https://xenova.github.io/transformers.js/)
- [WebLLM](https://webllm.mlc.ai/)
- [Next.js Docs](https://nextjs.org/docs)
- [Whisper Models](https://huggingface.co/Xenova)

## ⚠️ Browser Requirements

- Modern browser with WASM support
- At least 2GB RAM
- Fast internet for initial model downloads
- Allows microphone access

## 🚀 Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel deploy
```

Ensure host supports:
- WASM and SharedArrayBuffer
- Cross-Origin-Opener-Policy headers

## 📄 License

MIT - Use freely for any project.
