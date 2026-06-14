---
title: Quick Start
---

# Quick Start (5 minutes)

Get the Voice AI Form running in just a few steps.

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **npm 9+** (comes with Node.js)
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **Microphone** (for input) and **speakers** (for bot audio)

## Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/voice-agent.git
cd voice-agent
npm install
```

## Step 2: Start Development Server

```bash
npm start
```

This starts the Angular dev server at **http://localhost:4200**.

## Step 3: Allow Microphone Access

When the page loads, your browser will ask for microphone permission. Click **Allow**.

## Step 4: Start the Conversation

1. Click the **Start** button
2. Listen to the greeting and first question
3. Speak clearly: *"My name is John"*
4. Bot will read it back: *"I heard, your name is John. Is that correct?"*
5. Say **"Yes"** to confirm, or **"No"** to correct

## Step 5: Try Barge-in

While the bot is speaking, interrupt it by speaking loudly. The bot will stop immediately and listen to you.

## What Happens Next?

The bot guides you through:

1. ✅ **Name** — "What is your name?"
2. ✅ **Phone** — "What is your phone number?"
3. ✅ **City** — "What is your city?"
4. ✅ **Summary** — "Let me confirm..." (reads back all fields)

When all three fields are confirmed, you'll see: **"Form completed."**

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Mic permission denied | Check browser settings, reload, try again |
| Can't hear the bot | Check speaker volume, unmute browser |
| Bot doesn't understand speech | Speak clearly and slowly |
| Barge-in not working | Speak louder, or increase speaker volume |
| Whisper takes a long time | Model is being loaded; wait for first transcription (cached after) |

## What Just Happened?

```
🎤 Microphone → Web Audio API (16kHz mono)
                         ↓
                   Whisper.cpp WASM
                         ↓
                  Regex-based Parser
                         ↓
                 Conversational Agent
                         ↓
                  Web Speech API (TTS)
```

All speech-to-text happens **offline on your device** — nothing is sent to the cloud.

## Next Steps

- **[Architecture](../architecture/overview)** — Understand how the system works
- **[Barge-in Guide](../guides/tuning-barge-in)** — Fine-tune interrupt detection
- **[Monorepo Guide](../monorepo/structure)** — Explore the project structure
- **[Troubleshooting](../guides/troubleshooting)** — Common issues and solutions

---

**Stuck?** Check [Troubleshooting](../guides/troubleshooting) or open a [GitHub Issue](https://github.com/yourusername/voice-agent/issues).
