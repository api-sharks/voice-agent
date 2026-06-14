---
title: Configuration
---

# Configuration

Environment variables and configuration options.

## Environment Variables

Create a `.env` file in `packages/web/`:

```env
# Language
WHISPER_LANGUAGE=en

# API Keys (if using Pipecat backend)
OPENAI_API_KEY=sk_...
ELEVENLABS_API_KEY=...
```

## Angular Configuration

Edit `packages/web/angular.json` for:
- Build optimizations
- CORS/isolation headers
- Asset paths

---

**See:** [CLAUDE.md](../../CLAUDE.md) for architecture configuration.
