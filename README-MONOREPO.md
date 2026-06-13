# Voice Agent Monorepo

This is a Turbo monorepo containing:
- **web** - Angular 17 voice form application
- **nextjs** - Next.js 16 voice AI assistant (client-side + Pipecat backend)
- **pipecat-backend** - Python backend for advanced voice AI
- **shared** - Shared services and utilities

**Hybrid Architecture:** Choose between client-side (WebLLM) or backend-powered (Pipecat) voice conversation.

## 📁 Workspace Structure

```
voice-agent/
├── packages/
│   ├── web/                 # Angular 17 voice form app
│   │   ├── src/            # Angular source code
│   │   ├── angular.json    # Angular CLI configuration
│   │   └── package.json    # Dependencies
│   │
│   ├── nextjs/              # Next.js voice AI assistant
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── lib/services/   # Services (Whisper, WebLLM, Audio)
│   │   ├── public/         # Static assets
│   │   ├── next.config.js  # Next.js configuration
│   │   └── package.json    # Dependencies
│   │
│   └── shared/             # Shared services and utilities
│       ├── src/            # TypeScript source
│       │   └── services/   # Shared services
│       └── package.json    # Dependencies
│
├── turbo.json             # Turbo configuration
├── tsconfig.json          # Root TypeScript configuration
├── package.json           # Root workspace configuration
└── README-MONOREPO.md     # This file
```

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

### Development

Run the development server:

```bash
npm start
# or
npm run dev
```

This starts the Angular dev server at `http://localhost:4200`.

Run a specific package:

```bash
npm run dev:web        # Angular app at http://localhost:4200
npm run dev:nextjs     # Next.js app at http://localhost:3000
```

### Building

Build all packages:

```bash
npm run build
```

Build only the web app:

```bash
npm run build:web
```

Build with production configuration:

```bash
npm run turbo:build
```

## 📦 Packages

### `web`

The main Angular 17 application containing:
- Voice form component
- Audio input handling
- UI and styling

**Commands:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production

**Dependencies:**
- `@angular/*` - Angular framework
- `rxjs` - Reactive programming
- `shared` - Local shared package

### `nextjs`

Next.js 16 voice AI assistant with **hybrid mode support**:

**Mode 1: Client-side (Default)**
- Speech-to-text (Whisper via Transformers.js)
- Local LLM inference (WebLLM)
- Text-to-speech (Web Speech API)
- No backend required, no API keys needed

**Mode 2: Pipecat Backend (Optional)**
- WebSocket connection to Python backend
- OpenAI Whisper for speech-to-text
- OpenAI GPT-4 for LLM
- ElevenLabs for premium text-to-speech
- Better quality, faster responses

**Commands:**
- `npm run dev:nextjs` - Dev server at http://localhost:3000 (client-side mode)
- `npm run build:nextjs` - Production build
- Visit `/pipecat` route for Pipecat-powered mode (requires backend running)

**Technologies:**
- Transformers.js for Whisper (client-side)
- @mlc-ai/web-llm for LLM inference (client-side)
- WebSocket for Pipecat backend communication
- Web Audio API for audio recording
- Web Speech API for voice output

**See also:**
- `packages/nextjs/README.md` - Full documentation
- `packages/nextjs/CLAUDE.md` - Architecture guide
- `PIPECAT-SETUP.md` - Hybrid setup guide

### `pipecat-backend`

Python backend for advanced voice AI features using Pipecat framework:

**Included:**
- OpenAI Whisper (state-of-art speech recognition)
- OpenAI GPT-4 (most capable language model)
- ElevenLabs (premium voice synthesis)
- WebSocket transport for real-time communication
- Voice Activity Detection (VAD)
- Conversation memory management

**Commands:**
- `npm run pipecat:setup` - Initial setup (Python venv + dependencies)
- `npm run pipecat:install` - Install Python dependencies
- `npm run pipecat:dev` - Start WebSocket server on ws://localhost:8765

**Setup (first time):**
```bash
# 1. Setup Python environment
npm run pipecat:setup

# 2. Add API keys to packages/pipecat-backend/.env
OPENAI_API_KEY=sk_...
ELEVENLABS_API_KEY=...

# 3. Run the server
npm run pipecat:dev
```

**See also:**
- `packages/pipecat-backend/README.md` - Full documentation
- `PIPECAT-SETUP.md` - Hybrid setup guide

### `shared`

Reusable services and utilities:
- Services (Agent, Mic, Parser, TTS, Whisper)
- Utility functions
- Shared types

**Commands:**
- `npm run build` - Build TypeScript
- `npm run dev` - Watch mode

**Current structure (placeholder):**
```
shared/
├── src/
│   ├── index.ts
│   └── services/
│       └── index.ts
└── dist/  (generated)
```

## 🎤 Hybrid Voice Architecture

This monorepo supports two voice conversation modes:

### Client-side Mode (Default)
```
Browser
├─ Whisper (Transformers.js)
├─ LLM (TinyLlama in WASM)
└─ TTS (Web Speech API)
```

**Pros:** No API keys, no backend, instant setup
**Cons:** Slower, lower quality, limited model sizes
**Setup Time:** 2 minutes

### Pipecat Backend Mode (Production)
```
Browser ──WebSocket── Python Server
                      ├─ OpenAI Whisper
                      ├─ OpenAI GPT-4
                      └─ ElevenLabs TTS
```

**Pros:** Better quality, faster, most capable models
**Cons:** Requires API keys, server deployment
**Setup Time:** 10 minutes
**Cost:** ~$0.03-0.05 per interaction

### Quick Start (Hybrid)

**Step 1: Client-side only (no setup)**
```bash
npm run dev:nextjs
# Visit http://localhost:3000
```

**Step 2: Add Pipecat backend (optional)**
```bash
# In one terminal
npm run pipecat:setup
npm run pipecat:dev

# In another terminal
npm run dev:nextjs
# Visit http://localhost:3000/pipecat
```

**See:** `PIPECAT-SETUP.md` for detailed hybrid setup guide

## 🔧 Turbo Features

### Caching

Turbo caches build outputs to speed up builds:
- `build` and `build:prod` tasks are cached
- Cache invalidation happens when inputs change

### Task Dependencies

- `build` depends on `^build` (upstream builds first)
- This ensures shared package is built before web app

### Filtering

Run tasks for specific packages:

```bash
# Build only the web package
turbo run build --filter=web

# Build only shared
turbo run build --filter=shared

# Run for changed packages only
turbo run build --filter=[HEAD^]
```

## 📝 TypeScript Configuration

### Path Mapping

The monorepo uses path mapping for cleaner imports:

```typescript
import { MyService } from 'shared/services';
```

Instead of:

```typescript
import { MyService } from '../../../packages/shared/src/services';
```

Mappings are configured in:
- `tsconfig.json` (root)
- `packages/web/tsconfig.json`
- `packages/shared/tsconfig.json`

## 🔀 Migrating Services to Shared Package

To move services from the web app to the shared package:

1. Copy service files to `packages/shared/src/services/`
2. Export them in `packages/shared/src/services/index.ts`
3. Update imports in web app to use `import { Service } from 'shared/services'`
4. Remove original service files from `packages/web/src/app/core/services/`

### Example:

**Before (in web app):**
```typescript
import { AgentService } from './app/core/services/agent.service';
```

**After (with shared package):**
```typescript
import { AgentService } from 'shared/services';
```

## 🛠️ Development Workflow

### Adding a New Dependency

**To root workspace:**
```bash
npm install package-name --workspace
```

**To a specific package:**
```bash
npm install package-name --workspace web
# or
npm install package-name --workspace shared
```

### Linking Packages

Packages can reference each other via `workspace:*` protocol in package.json:

```json
{
  "dependencies": {
    "shared": "workspace:*"
  }
}
```

## 📊 Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies for all packages |
| `npm start` | Start Angular dev server (http://localhost:4200) |
| `npm run dev:web` | Angular dev server (http://localhost:4200) |
| `npm run dev:nextjs` | Next.js dev server (http://localhost:3000) |
| `npm run build` | Build Angular app |
| `npm run build:web` | Build Angular app |
| `npm run build:nextjs` | Build Next.js app |
| `npm run build:shared` | Build shared package |
| `npm run turbo:build` | Full Turbo build with caching |
| `npm run pipecat:setup` | Setup Pipecat Python backend (first time) |
| `npm run pipecat:install` | Install Pipecat dependencies |
| `npm run pipecat:dev` | Start Pipecat server (ws://localhost:8765) |

## 🐛 Troubleshooting

### Module Resolution Issues

If TypeScript can't find modules from shared:
- Ensure `tsconfig.json` paths are correct
- Run `npm install` to ensure workspace links are established
- Clear `.turbo` cache: `rm -rf .turbo`

### Build Failures

If builds fail:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear dist directories: `rm -rf dist packages/*/dist`
3. Check TypeScript errors: `npx tsc --noEmit`

## 📚 Resources

- [Turbo Documentation](https://turbo.build/docs)
- [Angular Documentation](https://angular.io/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
