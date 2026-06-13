# Voice Agent Monorepo - Complete Structure

## Directory Layout

```
voice-agent/
│
├── 📄 package.json              # Root workspace config
├── 📄 turbo.json                # Turbo build system config
├── 📄 tsconfig.json             # Root TypeScript config
│
├── 📚 Documentation
│   ├── README.md                # Original repo README
│   ├── README-MONOREPO.md       # Full monorepo documentation
│   ├── MONOREPO-QUICKSTART.md   # Quick start guide
│   ├── CLAUDE.md                # Project guidance
│   └── STRUCTURE.md             # This file
│
├── packages/
│   │
│   ├── 🌐 web/
│   │   ├── 📄 package.json
│   │   ├── 📄 angular.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 tsconfig.app.json
│   │   │
│   │   └── src/
│   │       ├── 📄 main.ts
│   │       ├── 📄 index.html
│   │       ├── 📄 styles.css
│   │       │
│   │       ├── app/
│   │       │   ├── app.component.ts
│   │       │   ├── core/
│   │       │   │   └── services/
│   │       │   │       ├── agent.service.ts
│   │       │   │       ├── mic.service.ts
│   │       │   │       ├── parser.service.ts
│   │       │   │       ├── tts.service.ts
│   │       │   │       └── whisper.service.ts
│   │       │   └── features/
│   │       │       └── voice-form/
│   │       │           ├── voice-form.component.ts
│   │       │           ├── voice-form.component.html
│   │       │           └── voice-form.component.css
│   │       │
│   │       └── assets/
│   │           └── whisper/
│   │               ├── stream.js        (Whisper WASM)
│   │               ├── ggml-tiny.bin    (Model)
│   │               ├── stream.wasm
│   │               └── README.txt
│   │
│   ├── 🚀 nextjs/
│   │   ├── 📄 package.json
│   │   ├── 📄 next.config.js
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 tailwind.config.js
│   │   ├── 📄 postcss.config.js
│   │   │
│   │   ├── 📚 Documentation
│   │   │   ├── README.md        # Full documentation
│   │   │   ├── CLAUDE.md        # Architecture guide
│   │   │   ├── SETUP.md         # Configuration guide
│   │   │   └── .env.example     # Environment template
│   │   │
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Main page
│   │   │   ├── globals.css
│   │   │   └── favicon.ico
│   │   │
│   │   ├── components/
│   │   │   └── VoiceChat.tsx    # Main voice interface
│   │   │
│   │   ├── lib/
│   │   │   └── services/
│   │   │       ├── whisper.service.ts      # Speech-to-text
│   │   │       ├── webllm.service.ts       # LLM inference
│   │   │       ├── audio.service.ts        # Audio handling
│   │   │       └── index.ts                # Service exports
│   │   │
│   │   ├── public/              # Static assets
│   │   └── node_modules/
│   │
│   └── 🔧 shared/
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       │
│       └── src/
│           ├── 📄 index.ts
│           └── services/
│               └── index.ts
│
└── node_modules/
```

## Package Descriptions

### 🌐 `packages/web/` - Angular Voice Form App
**Tech**: Angular 17, TypeScript, Whisper.cpp, RxJS
**Purpose**: Traditional voice form with structured flow
**Port**: 4200
**Build**: `ng build` → `dist/voice-ai-form-advanced/`

**Key Components**:
- `AppComponent` - Main shell
- `VoiceFormComponent` - Form orchestration
- Services: Agent, Mic, Parser, TTS, Whisper

### 🚀 `packages/nextjs/` - Next.js Voice AI Assistant
**Tech**: Next.js 15, React 19, TypeScript, Tailwind CSS
**Purpose**: Real-time voice conversation in browser
**Port**: 3000
**Build**: `next build` → `.next/`

**Key Components**:
- `VoiceChat` - Main voice interface
- `WhisperService` - Transformers.js for speech-to-text
- `WebLLMService` - MLC-AI WebLLM for local inference
- `AudioService` - Web Audio API + Web Speech API

**Features**:
- ✅ 100% browser-based (no backend)
- ✅ Local LLM inference (privacy-first)
- ✅ Real-time transcription & response
- ✅ Model caching in IndexedDB

### 🔧 `packages/shared/` - Shared Services
**Tech**: TypeScript, Angular
**Purpose**: Reusable code across packages
**Build**: `tsc` → `dist/`

**Placeholder structure** for future service extraction.

## How to Use This Monorepo

### Start Development
```bash
# Install all packages
npm install

# Start Angular app
npm run dev:web

# OR start Next.js app (in another terminal)
npm run dev:nextjs
```

### Build for Production
```bash
# Build specific package
npm run build:web
npm run build:nextjs

# Build everything
npm run turbo:build
```

### Key Differences Between Apps

| Feature | Angular (web) | Next.js (nextjs) |
|---------|---------------|------------------|
| Framework | Angular 17 | Next.js 15 |
| UI Framework | Angular Components | React Components |
| Styling | CSS | Tailwind CSS |
| Speech Recognition | Whisper.cpp WASM | Transformers.js |
| LLM | Not included | WebLLM (local) |
| Backend | Optional | None (100% browser) |
| Form Type | Structured form | Free conversation |
| Target | Production | Real-time chat |

## Development Workflows

### Adding a Feature to Angular App
1. Create component/service in `packages/web/src/`
2. Update `packages/web/angular.json` if needed
3. Run `npm run dev:web` to see changes

### Adding a Feature to Next.js App
1. Create component in `packages/nextjs/components/`
2. Or service in `packages/nextjs/lib/services/`
3. Run `npm run dev:nextjs` to see changes

### Sharing Code Between Apps
1. Add to `packages/shared/src/`
2. Build: `npm run build:shared`
3. Import: `import { Feature } from 'shared'`

## Performance Tips

### Angular App
- Uses production Whisper.cpp WASM build
- Good for structured, confirmed input
- Optimized for accuracy over speed

### Next.js App
- Uses smaller Whisper-tiny model
- Focuses on real-time conversation
- WebLLM offers inference flexibility

### Both
- Clear cache: DevTools → Application → Clear storage
- Monitor memory: DevTools → Performance tab
- Use smaller models on mobile devices

## Troubleshooting

### Port Already in Use
```bash
# Windows: Kill process on port
taskkill /PID <PID> /F

# Or use different port
npm --workspace=nextjs run dev -- -p 3001
```

### Dependencies Not Working
```bash
# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Build Failures
```bash
# Clear everything and rebuild
npm run clean 2>/dev/null
rm -rf packages/*/dist packages/*/.next packages/*/.angular
npm install
npm run turbo:build
```

## Next Steps

1. **Read the docs**: Start with `README-MONOREPO.md`
2. **Try Angular app**: `npm run dev:web` → http://localhost:4200
3. **Try Next.js app**: `npm run dev:nextjs` → http://localhost:3000
4. **Customize**: Edit services, components, and configs
5. **Deploy**: Follow guides in each package's README

---

**Created with Turbo + npm workspaces**
