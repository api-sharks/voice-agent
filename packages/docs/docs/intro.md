---
slug: /
---

# Welcome to Voice AI Form Advanced

Welcome to the documentation for **Voice AI Form Advanced**, an Angular 17 standalone application for conversational voice-driven form collection with barge-in (interrupt) support.

## What is Voice AI Form Advanced?

This project demonstrates a complete voice-first user interface for collecting structured information (name, phone, city) through natural conversation. Users can speak to provide information, interrupt the bot mid-sentence, and naturally correct themselves.

### Key Features

🎤 **Real-time Speech Recognition**
- Offline Whisper.cpp WASM for privacy-first transcription
- 16kHz mono audio capture with echo cancellation

🗣️ **Natural Conversation**
- Conversational agent that asks questions and confirms details
- Reads back values for verification
- Accepts corrections in natural language

🤐 **Interrupt Support (Barge-in)**
- Detect when user speaks while bot is speaking
- RMS-based energy detection
- Stop bot immediately and process user input

🌍 **Multilingual Support**
- English, Hindi, Telugu language support
- Extensible regex-based parser

🔊 **Browser-native TTS**
- Web Speech API for text-to-speech
- Improved timeout handling for longer utterances

## Quick Navigation

- **[Getting Started](./getting-started/quickstart)** — Set up and run the app in 5 minutes
- **[Architecture](./architecture/overview)** — Understand the system design
- **[Features](./features/barge-in)** — Deep dive into key capabilities
- **[Guides](./guides/tuning-barge-in)** — How-to guides and best practices
- **[Monorepo Structure](./monorepo/structure)** — Navigate the project layout

## Try It Out

```bash
npm install
npm start
```

Then open http://localhost:4200 and click **Start** to begin a voice conversation.

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Angular 17 |
| **Speech-to-Text** | Whisper.cpp WASM (offline) |
| **Text-to-Speech** | Web Speech API |
| **Audio Processing** | Web Audio API |
| **State Management** | RxJS |
| **Build System** | Turbo monorepo with npm workspaces |

## Project Structure

```
voice-agent/
├── packages/
│   ├── web/              # Main Angular app
│   ├── shared/           # Shared services
│   ├── nextjs/           # Next.js variant (optional)
│   └── docs/             # This documentation
├── CLAUDE.md             # Architecture guide
├── DUPLEX_COMMUNICATION.md  # Barge-in details
└── README.md             # Quick reference
```

## Next Steps

1. **[Quick Start](./getting-started/quickstart)** — Get the app running
2. **[Architecture Overview](./architecture/overview)** — Understand how it works
3. **[Tuning Guide](./guides/tuning-barge-in)** — Customize for your environment
4. **[Troubleshooting](./guides/troubleshooting)** — Common issues and solutions

## Support

- 📖 **Documentation** — You're reading it!
- 🐛 **Issues** — [GitHub Issues](https://github.com/yourusername/voice-agent/issues)
- 💬 **Discussions** — [GitHub Discussions](https://github.com/yourusername/voice-agent/discussions)

---

**Last updated:** {new Date().toISOString().split('T')[0]}
