# Voice Agent Monorepo - Quick Start

## ✅ Setup Complete

Your project has been converted to a Turbo monorepo with npm workspaces.

## 📦 Structure

```
voice-agent/
├── packages/
│   ├── web/               # Angular app (the main application)
│   └── shared/            # Shared services (for future use)
├── turbo.json            # Turbo configuration
├── tsconfig.json         # Root TypeScript config
└── package.json          # Root workspace config
```

## 🚀 Common Commands

```bash
# Install dependencies (run from root)
npm install

# Start development server
npm start
# Opens dev server at http://localhost:4200

# Build for production
npm run build
# Output: C:\Projects\voice-agent\dist\voice-ai-form-advanced

# Build shared package (when you add services there)
npm run build:shared
```

## 📂 File Locations

- **Source code**: `packages/web/src/`
- **Main app**: `packages/web/src/app/app.component.ts`
- **Voice form**: `packages/web/src/app/features/voice-form/`
- **Services**: `packages/web/src/app/core/services/`
- **Styles**: `packages/web/src/styles.css`
- **Assets** (Whisper WASM): `packages/web/src/assets/`

## 🔧 Next Steps

### Option 1: Keep All Code in Web Package (Simpler)
If you want a simple monorepo without service extraction:
- Continue developing in `packages/web/src/`
- Ignore the `packages/shared/` for now
- Use `npm start` and `npm run build` as before

### Option 2: Extract Shared Services (Advanced)
To move services to the shared package:
1. Move service files to `packages/shared/src/services/`
2. Update imports to use: `import { Service } from 'shared/services'`
3. Delete original service files from web package
4. Run `npm run build:shared` to compile shared package

Example of shared service export:
```typescript
// packages/shared/src/services/index.ts
export { AgentService } from './agent.service';
export { MicService } from './mic.service';
// ... etc
```

Then import in web app:
```typescript
import { AgentService } from 'shared/services';
```

## 🔗 Turbo for Advanced Usage

If you add more packages or want advanced build optimization:

```bash
# Use Turbo for parallel builds with caching
npx turbo run build

# Build specific package
npx turbo run build --filter=web

# List Turbo tasks
npx turbo build --dry
```

## 📝 Configuration Files

### turbo.json
Defines build caching and task dependencies. Currently configured for:
- `build` and `build:prod` tasks (cached)
- `dev` and `start` tasks (not cached, persistent)

### tsconfig.json (Root)
Defines TypeScript configuration and path mappings for the workspace.

### packages/web/angular.json
Angular CLI configuration with output path pointing to root `dist/`.

## ✨ Benefits of Monorepo

✅ Shared code between packages  
✅ Single dependency management  
✅ Faster builds with Turbo caching  
✅ Easier to extract services later  
✅ Better code organization  

## 📚 Learn More

- Full documentation: [README-MONOREPO.md](./README-MONOREPO.md)
- [Turbo Documentation](https://turbo.build/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
