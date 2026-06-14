---
title: Installation
---

# Installation Guide

Detailed setup instructions for different environments.

## System Requirements

- **Node.js:** 18.0.0 or higher
- **npm:** 9.0.0 or higher
- **RAM:** 2GB minimum (4GB+ recommended)
- **Disk:** 1GB free space (for node_modules + Whisper model)
- **Browser:** Modern browser with Web Audio API support

## Clone the Repository

```bash
git clone https://github.com/yourusername/voice-agent.git
cd voice-agent
```

## Install Dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo.

**On Windows?** You may need to open PowerShell as Administrator.

## Verify Installation

```bash
npm run build:web
```

If build succeeds, installation is complete.

## Platform-Specific Notes

### Windows

No special setup needed. PowerShell works fine.

```bash
npm install
npm start
```

### macOS / Linux

Standard npm workflow:

```bash
npm install
npm start
```

If you get permission errors:

```bash
# Don't use sudo; instead configure npm
npm config set prefix ~/.npm
export PATH=~/.npm/bin:$PATH
```

### Docker (Optional)

To run in a container:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:web

EXPOSE 4200
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t voice-agent .
docker run -p 4200:4200 voice-agent
```

## Verify the Setup

```bash
# Start dev server
npm start

# In another terminal, verify it's running
curl http://localhost:4200
```

You should see the HTML for the app.

---

**Next:** [Configuration](./configuration.md) | [Quick Start](./quickstart.md)
