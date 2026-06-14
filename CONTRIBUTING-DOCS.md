# Contributing to Documentation

This guide explains how to contribute to the Voice AI Form documentation.

## Quick Start

### Edit an Existing Page

1. **Locate the file** — Find the `.md` file in `packages/docs/docs/`
2. **Edit in Claude Code** — Open the file and make changes
3. **Preview** — Run `npm run docs:dev` and visit http://localhost:3000
4. **Commit** — Create a PR with your changes

### Create a New Page

1. **Choose a category** — Is it getting-started, architecture, features, guides, or api?
2. **Create the file** — Add `.md` file in the appropriate folder
3. **Add frontmatter** — Copy the template below
4. **Update sidebar** — Add entry to `packages/docs/sidebars.js`
5. **Link it** — Reference from related pages
6. **Preview & commit**

## File Template

```markdown
---
title: Your Page Title
---

# Your Page Title

Introduction paragraph.

## First Section

Content here.

### Subsection

More content.

---

**Next:** [Related Page](../path/to/page.md) | [Also See](../path/to/other.md)
```

## Front matter Fields

| Field | Required | Example |
|-------|----------|---------|
| `title` | Yes | "Barge-in Configuration" |
| `slug` | No | "/custom-path" |
| `sidebar_position` | No | 1 |

## Sidebar Navigation

Edit `packages/docs/sidebars.js` to:
- Reorder pages
- Add new sections
- Group related pages

Example:
```javascript
{
  label: 'Features',
  items: [
    'features/barge-in',
    'features/speech-recognition',
  ],
}
```

## Writing Style

### Do's

- ✅ **Practical** — Include examples and code
- ✅ **Clear** — Explain the "why" not just the "what"
- ✅ **Scannable** — Use headers, bullet points, tables
- ✅ **Tested** — Verify code examples work
- ✅ **Linked** — Cross-reference related docs

### Don'ts

- ❌ **Too technical** — Assume reader knows basics
- ❌ **Outdated** — Update docs when code changes
- ❌ **Typos** — Spell check before committing
- ❌ **Broken links** — Test links to other pages

## Markdown Features

### Code Blocks

```markdown
\`\`\`typescript
const greeting = "Hello";
\`\`\`
```

**Languages supported:** typescript, javascript, bash, html, json, python, java, go, etc.

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Links

```markdown
[Text](../path/to/page.md)        # Internal page
[External](https://example.com)   # External site
```

### Lists

```markdown
- Bullet point
- Another point
  - Nested point

1. Numbered item
2. Another item
   1. Nested number
```

### Quotes

```markdown
> This is a blockquote
> spanning multiple lines
```

## Documentation Structure

```
docs/
├── intro.md                   # Homepage
├── getting-started/           # Setup & quickstart
│   ├── quickstart.md
│   ├── installation.md
│   └── configuration.md
├── architecture/              # Design & systems
│   ├── overview.md
│   ├── services.md
│   ├── components.md
│   └── data-flow.md
├── features/                  # Feature deep-dives
│   ├── barge-in.md
│   ├── speech-recognition.md
│   ├── parsing.md
│   └── echo-cancellation.md
├── monorepo/                  # Project structure
│   ├── structure.md
│   ├── packages.md
│   ├── development.md
│   └── builds.md
├── guides/                    # How-to guides
│   ├── tuning-barge-in.md
│   ├── adding-languages.md
│   ├── deployment.md
│   └── troubleshooting.md
└── api/                       # API reference
    ├── services.md
    ├── components.md
    └── types.md
```

## Common Workflows

### Update Docs When Code Changes

1. **Change made** — Feature added or API modified
2. **Update doc** — Find related `.md` file(s)
3. **Update examples** — Code samples must match current implementation
4. **Test preview** — Run `npm run docs:dev`
5. **Commit together** — Code change + doc update in same PR

### Add a New Feature to Docs

1. **Create page** — Add `.md` file to appropriate folder
2. **Add to sidebar** — Update `sidebars.js`
3. **Link from overview** — Add reference to parent page
4. **Add to API docs** — Document any new services/components
5. **Add to troubleshooting** — Common issues?

### Document a Bug Fix

1. **Check existing docs** — Does troubleshooting section cover it?
2. **Add diagnostic** — How to identify the problem
3. **Add solution** — Steps to fix or workaround
4. **Test** — Verify the fix works
5. **Commit** — Include in bug fix PR

## Preview & Testing

### Start Dev Server

```bash
npm run docs:dev
```

Opens http://localhost:3000 (auto-reloads on save)

### Test Build

```bash
npm run docs:build
```

Generates static site in `build/` — catches issues before deploy

### Serve Production Build

```bash
npm run docs:serve
```

Tests the production build locally

### Clear Cache

```bash
npm run docs:clean
```

Clears Docusaurus cache (do this if styles don't update)

## Versioning Documentation

### Current Version

All docs in `docs/` folder are the "next" (development) version.

### Create a New Version

When releasing a major version:

```bash
npm run docusaurus docs:version 1.0
```

This:
1. Copies `docs/` to `versioned_docs/version-1.0/`
2. Creates `versions.json` entry
3. Clears `docs/` for next version
4. Adds version dropdown to navbar

### Update Multiple Versions

To fix a bug that affects older versions:

1. **Fix in** `versioned_docs/version-X.X/docs/`
2. **Also fix in** `docs/` (current version)
3. **Do not merge** versions (keep independent)

## Before You Commit

- [ ] Preview looks good (`npm run docs:dev`)
- [ ] Build succeeds (`npm run docs:build`)
- [ ] No broken links (check console)
- [ ] Code examples are tested
- [ ] Markdown is valid
- [ ] Sidebar updated if needed
- [ ] Frontmatter has `title`
- [ ] Links use relative paths (`../path/to/page.md`)

## Commit Message

```
docs: <category> — <description>

Examples:
docs: barge-in — add tuning guide for noisy environments
docs: architecture — clarify services data flow with diagram
docs: getting-started — update installation for Windows
```

## CI/CD

- **Build runs on PR** — Catches broken markdown/builds
- **Preview link available** — Deploy preview generated for review
- **Merge to main** — Auto-deploys to production

## Questions?

- **Questions about docs?** Open a [GitHub Issue](https://github.com/yourusername/voice-agent/issues)
- **Questions about contributing?** See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Happy documenting!** 📖

Your clear docs help others use and contribute to Voice AI Form.
