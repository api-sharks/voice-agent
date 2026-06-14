# Voice AI Form Documentation

Complete documentation site for Voice AI Form Advanced, built with Docusaurus.

## Quick Start

```bash
# From monorepo root
npm run docs:dev

# Open http://localhost:3000
```

## Build for Production

```bash
npm run docs:build
```

Output: `build/` directory (ready to deploy)

## Structure

```
docs/
├── docs/                        # Documentation pages
│   ├── intro.md                # Homepage
│   ├── getting-started/        # Quickstart & setup
│   ├── architecture/           # Design & services
│   ├── features/               # Feature guides
│   ├── monorepo/              # Project structure
│   ├── guides/                # How-to guides
│   └── api/                   # API reference
├── src/
│   ├── css/custom.css         # Custom styles
│   └── components/            # Custom React components
├── docusaurus.config.js       # Site configuration
├── sidebars.js               # Navigation structure
└── package.json              # Dependencies
```

## Features

- 📖 **Versioning** — Multiple documentation versions
- 🌙 **Dark mode** — Light and dark theme support
- 📱 **Responsive** — Mobile-friendly design
- 🔍 **Full-text search** — Built-in search functionality
- 📝 **Markdown** — Write docs in Markdown
- ⚡ **Fast** — Static site generation
- 🎨 **Customizable** — Tailored styling and components

## Writing Docs

### Add a New Page

1. Create `.md` file in appropriate `docs/` subdirectory
2. Add frontmatter:
   ```markdown
   ---
   title: My Page Title
   ---
   
   # Content here
   ```

3. Update `sidebars.js` to link the page

### Frontmatter Options

```markdown
---
title: Page Title          # Required
slug: /custom-url         # Optional custom URL
sidebar_position: 1       # Optional order in sidebar
---
```

## Customization

### Site Config

Edit `docusaurus.config.js` for:
- Site title and tagline
- GitHub repo links
- Footer links
- Navbar items
- Color scheme

### Sidebar Navigation

Edit `sidebars.js` to reorganize documentation structure.

### Styling

Edit `src/css/custom.css` for custom colors and layouts. Use CSS variables:

```css
:root {
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1e40af;
}
```

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### GitHub Pages

```bash
npm run build
npm run deploy
```

### Self-hosted

```bash
npm run build
# Deploy contents of `build/` directory
```

## Versioning

### Create a New Version

```bash
npm run docusaurus docs:version 2.0
```

This preserves current docs as version 2.0 and starts new "next" version.

### Manage Versions

- Edit `versions.json` to control which versions are available
- Each version has its own `versioned_docs/` folder

## Search

Full-text search is built-in (no configuration needed).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port: `npm start -- --port 3001` |
| Build fails | Clear cache: `npm run clear` |
| CSS not updating | Clear browser cache or use incognito mode |

## Learn More

- [Docusaurus Documentation](https://docusaurus.io/)
- [Markdown Guide](https://docusaurus.io/docs/markdown-features)
- [Configuration Reference](https://docusaurus.io/docs/api/docusaurus-config)

---

**See:** [Voice AI Form Docs](http://localhost:3000) | [Architecture](../web/CLAUDE.md)
