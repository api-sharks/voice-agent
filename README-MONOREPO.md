# Voice Agent Monorepo

This is a Turbo monorepo containing the Voice AI Form application and shared packages.

## 📁 Workspace Structure

```
voice-agent/
├── packages/
│   ├── web/                 # Angular web application
│   │   ├── src/            # Source code
│   │   ├── angular.json    # Angular CLI configuration
│   │   └── package.json    # Web app dependencies
│   │
│   └── shared/             # Shared services and utilities
│       ├── src/            # Source code
│       │   └── services/   # Shared services
│       └── package.json    # Shared package dependencies
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
npm run dev:web
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
| `npm start` | Start dev server |
| `npm run build` | Build all packages |
| `npm run dev:web` | Dev server for web only |
| `npm run build:web` | Build web only |
| `npm run turbo:build` | Full Turbo build with caching |

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
