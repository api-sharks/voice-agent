# Hybrid Voice AI Setup: Client-side + Pipecat Backend

This monorepo supports two voice conversation architectures:

1. **Client-side Mode** (WebLLM) - Everything runs in the browser
2. **Pipecat Backend Mode** - Uses Python backend with OpenAI + ElevenLabs

## Quick Start

### Client-side Mode (Default)

```bash
# Start Next.js dev server only
npm run dev:nextjs

# Visit http://localhost:3000
# Uses: Whisper (Transformers.js) → WebLLM (TinyLlama) → Web Speech API
```

**Pros:** No API keys needed, fully local, instant setup
**Cons:** Slower, lower quality, limited to small models

### Pipecat Backend Mode (Recommended for Production)

#### Step 1: Setup Backend

```bash
# Navigate to backend
cd packages/pipecat-backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 2: Configure API Keys

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add:
# OPENAI_API_KEY=sk_...your_openai_key...
# ELEVENLABS_API_KEY=...your_elevenlabs_key...
```

Get API keys:
- [OpenAI](https://platform.openai.com/api-keys) - Whisper + GPT-4
- [ElevenLabs](https://elevenlabs.io/api) - Text-to-speech

#### Step 3: Run Backend

```bash
python server.py
# Server starts on ws://localhost:8765
```

#### Step 4: Start Frontend

In another terminal:

```bash
# From monorepo root
npm run dev:nextjs
# Visit http://localhost:3000/pipecat
```

## Switching Between Modes

### Option A: Environment Variable

```bash
# .env.local in packages/nextjs/
NEXT_PUBLIC_VOICE_MODE=pipecat  # or 'webllm' (default)
```

### Option B: UI Toggle (Recommended)

Update the home page to show mode selector:

```typescript
'use client';

import { VoiceChat } from '@/components/VoiceChat';
import { PipecatChat } from '@/components/PipecatChat';
import { useState } from 'react';

export default function Home() {
  const [mode, setMode] = useState<'webllm' | 'pipecat'>('webllm');

  return (
    <div>
      <div className="flex gap-2 p-4 bg-slate-900">
        <button
          onClick={() => setMode('webllm')}
          className={mode === 'webllm' ? 'bg-blue-600' : 'bg-slate-700'}
        >
          Client-side (WebLLM)
        </button>
        <button
          onClick={() => setMode('pipecat')}
          className={mode === 'pipecat' ? 'bg-blue-600' : 'bg-slate-700'}
        >
          Backend (Pipecat)
        </button>
      </div>

      {mode === 'webllm' && <VoiceChat />}
      {mode === 'pipecat' && <PipecatChat />}
    </div>
  );
}
```

## Architecture Comparison

### Client-side (WebLLM)

```
Browser
├─ Whisper (Transformers.js)
├─ LLM (TinyLlama in WASM)
└─ Web Speech API
```

**Models:**
- Whisper-tiny: 75MB
- TinyLlama: 1.1B
- Web Speech API (built-in)

**Latency:** 2-5 seconds per interaction
**Cost:** $0 (your compute)

### Pipecat Backend

```
Browser ──WebSocket── Python Server
                      ├─ OpenAI Whisper (API)
                      ├─ OpenAI GPT-4 (API)
                      └─ ElevenLabs TTS (API)
```

**Models:**
- Whisper: State-of-art speech recognition
- GPT-4: Most capable language model
- ElevenLabs: Realistic voice synthesis

**Latency:** 1-2 seconds per interaction
**Cost:** $0.005-0.03 per interaction (API calls)

## Estimated Costs (Pipecat Mode)

Per interaction:
- Whisper: ~$0.006 (30 seconds audio)
- GPT-4: ~0.01 per 1K tokens (~$0.015 for typical response)
- ElevenLabs: ~$0.03 per minute of audio (~$0.01 for typical response)

**Total:** ~$0.03 per 30-second interaction
**Example:** 100 interactions/day = $3/day = $90/month

Use smaller models to reduce costs:
- Switch to GPT-3.5-turbo (70% cheaper)
- Use ElevenLabs "Standard" voices (cheaper than "Premium")

## Troubleshooting

### Pipecat Server Won't Start

```bash
# Check Python version (requires 3.8+)
python --version

# Check if port 8765 is in use
lsof -i :8765  # macOS/Linux
netstat -ano | findstr :8765  # Windows

# Try different port in .env
WEBSOCKET_PORT=8766
```

### WebSocket Connection Refused

- Ensure Pipecat server is running
- Check URL: should be `ws://localhost:8765` (not `wss://`)
- Check firewall settings

### OpenAI API Errors

```bash
# Test API key
python -c "import openai; openai.api_key = 'your_key'; print(openai.Model.list())"
```

### Audio Quality Issues

In `packages/pipecat-backend/server.py`, adjust audio settings:

```python
AudioRawFrame(
    sample_rate=16000,  # 16kHz is standard for Whisper
    channels=1,  # Mono
    audio_bytes_per_sample=2,  # 16-bit
)
```

## Production Deployment

### Option 1: Separate Services

- Deploy Next.js to **Vercel** or **Netlify**
- Deploy Pipecat backend to **Railway**, **Render**, or **AWS**

### Option 2: Docker

```dockerfile
# Dockerfile for Pipecat backend
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "server.py"]
```

```bash
docker build -t pipecat-backend .
docker run -p 8765:8765 -e OPENAI_API_KEY=$OPENAI_API_KEY pipecat-backend
```

### Option 3: Serverless Functions

Use FastAPI + WebSocket on serverless platforms (AWS Lambda, Google Cloud Functions require special setup for WebSocket support).

## Advanced Configuration

### Custom LLM Provider

In `packages/pipecat-backend/server.py`:

```python
# Use Anthropic Claude
from pipecat.services.anthropic import AnthropicLLMService

llm = AnthropicLLMService(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    model="claude-opus",
)
```

### Custom Voice Provider

```python
# Use Google Cloud TTS
from pipecat.services.google import GoogleTextToSpeechService

tts = GoogleTextToSpeechService(
    api_key=os.getenv("GOOGLE_API_KEY"),
    voice="en-US-Neural2-A",
)
```

### Add Sentiment Analysis

```python
from pipecat.processors.sentiment_analyzer import SentimentAnalyzer

pipeline = Pipeline([
    whisper,
    sentiment_analyzer,
    llm,
    tts,
])
```

## File Structure

```
voice-agent/
├── packages/
│   ├── nextjs/
│   │   ├── components/
│   │   │   ├── VoiceChat.tsx          # Client-side mode
│   │   │   └── PipecatChat.tsx        # Pipecat mode
│   │   ├── lib/services/
│   │   │   ├── audio.service.ts
│   │   │   ├── whisper.service.ts
│   │   │   ├── webllm.service.ts
│   │   │   └── pipecat.service.ts    # NEW: WebSocket client
│   │   └── ...
│   ├── pipecat-backend/               # NEW: Python backend
│   │   ├── server.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── README.md
│   ├── web/
│   └── shared/
├── package.json
├── turbo.json
└── PIPECAT-SETUP.md                  # This file
```

## Next Steps

1. Try both modes to understand the trade-offs
2. Use client-side for demos/testing (no API keys)
3. Use Pipecat for production (better quality)
4. Consider cost optimization for high-volume usage
5. Implement custom processors for your use case

## Resources

- [Pipecat Documentation](https://docs.pipecat.ai/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
