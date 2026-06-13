# Pipecat AI Backend

Real-time voice conversation backend using Pipecat AI framework. This provides an alternative to the client-side WebLLM implementation with support for:

- OpenAI Whisper (speech-to-text)
- OpenAI GPT-4 (LLM)
- ElevenLabs (text-to-speech)
- WebSocket transport for real-time communication with Next.js frontend

## Setup

### 1. Create Virtual Environment

```bash
cd packages/pipecat-backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with:
- `OPENAI_API_KEY` - Your OpenAI API key (for Whisper + GPT-4)
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key (for TTS)
- `WEBSOCKET_PORT` - Port for WebSocket server (default: 8765)

## Running the Server

```bash
python server.py
```

Server will start on `ws://localhost:8765`

## Architecture

```
Browser (Next.js)
    ↓
WebSocket Connection
    ↓
Pipecat Backend (Python)
    ↓
OpenAI Whisper → OpenAI GPT-4 → ElevenLabs TTS
```

## Comparison: Client-side vs Pipecat Backend

| Feature | Client-side (WebLLM) | Pipecat Backend |
|---------|----------------------|-----------------|
| **STT** | Transformers.js (local) | OpenAI Whisper (API) |
| **LLM** | TinyLlama (local) | GPT-4 (API) |
| **TTS** | Web Speech API | ElevenLabs (API) |
| **Setup** | No API keys needed | Requires API keys |
| **Speed** | Slower (CPU-bound) | Faster (cloud-based) |
| **Quality** | Good (for local) | Excellent (state-of-art) |
| **Cost** | Free (your compute) | Pay-per-use (API calls) |
| **Latency** | ~2-5s per interaction | ~1-2s per interaction |

## Integration with Next.js

The Next.js frontend can use either:

1. **Client-side mode** (default) - Uses local Whisper + WebLLM
2. **Pipecat mode** - Connects to this backend via WebSocket

Users can switch between modes in the UI.

## API Protocol

### Client → Server

```json
{
  "type": "audio",
  "data": [byte_array]
}
```

### Server → Client

```json
{
  "type": "transcription",
  "text": "user said this"
}
```

```json
{
  "type": "text",
  "text": "AI response"
}
```

## Development

### Adding Custom Processors

Create new processor classes in `processors/` directory and add to pipeline in `server.py`.

### Switching LLMs

Modify `create_pipeline()` to use different services:

```python
# Use Anthropic Claude instead of OpenAI
from pipecat.services.anthropic import AnthropicLLMService

llm = AnthropicLLMService(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    model="claude-opus",
)
```

### Using Custom TTS

Replace ElevenLabs with other providers:

```python
from pipecat.services.google import GoogleTextToSpeechService

tts = GoogleTextToSpeechService(
    api_key=os.getenv("GOOGLE_API_KEY"),
)
```

## Troubleshooting

### Connection refused

Ensure server is running on correct port. Check `WEBSOCKET_PORT` in `.env`.

### API key errors

Verify all API keys are set correctly in `.env` file.

### Audio quality issues

Adjust sample rate and bit depth in `server.py` configuration.

## Resources

- [Pipecat Documentation](https://docs.pipecat.ai/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
