# Setup Guide

## Prerequisites

- **Node.js** 18+ (required for native modules like better-sqlite3)
- **npm** or **pnpm**
- **Git**
- **Python 3.8+** (optional, for AI client reference scripts)

## Step 1: Scaffold Project

```bash
# Create project using Electron Forge
npx create-electron-app ai-browser --template=vite-typescript
cd ai-browser
```

## Step 2: Install Dependencies

```bash
# Core runtime
npm install better-sqlite3 @anthropic-ai/sdk zod

# React UI
npm install react react-dom zustand

# Development
npm install -D typescript tailwindcss @types/react @types/node
npm install -D @types/better-sqlite3
```

## Step 3: Configure Environment

```bash
# Copy template
cp .env.example .env
```

Edit `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx    # Required: get from console.anthropic.com
LOG_LEVEL=info                                   # debug | info | warn | error
```

## Step 4: Initialize Database

The database initializes automatically on first run. To manually seed demo data:

```bash
npm run seed-memory
```

This populates the user profile with demo data for the jury presentation:
- Name, email, phone
- Shipping and billing address
- Common form preferences

## Step 5: Configure TypeScript

Three tsconfig files needed:

**tsconfig.json** (base):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler"
  }
}
```

**tsconfig.main.json** (main process):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/main",
    "module": "CommonJS"
  },
  "include": ["electron-main/**/*", "agent-core/**/*", "semantic-parser/**/*", "shared/**/*"]
}
```

**tsconfig.renderer.json** (renderer process):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/renderer",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["renderer/**/*", "shared/**/*"]
}
```

## Step 6: Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: 'renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
    }
  },
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true
  }
});
```

## Step 7: Run Development

```bash
# Start development (hot reload)
npm run dev

# This starts both:
#   1. Vite dev server (renderer)
#   2. Electron with watch mode (main process)
```

## Step 8: Verify Setup

Open the app. You should see:
- ✅ Electron window opens with browser
- ✅ Sidebar visible on right side (may need Cmd+K to open)
- ✅ Press Cmd+K → CommandBar overlay appears
- ✅ No console errors in DevTools

## Troubleshooting

### `better-sqlite3` fails to build
This native module requires node-gyp. Run:
```bash
npm install --global node-gyp
npm rebuild better-sqlite3
```

### Electron DevTools issues on Windows
```bash
# Set environment variable
set ELECTRON_ENABLE_LOGGING=1
npm run dev
```

### `ANTHROPIC_API_KEY` not loaded
Electron main process reads `.env` via:
```typescript
import { config } from 'dotenv';
config(); // at top of electron-main/index.ts
```

### CDP debugger attach fails
The main window must be fully loaded before CDP attach. Ensure CDP attach happens in `did-finish-load` event, not `dom-ready`.

## Production Build

```bash
# Build and package
npm run make

# Output: out/make/ directory
# Windows: .exe installer
# macOS: .dmg file
# Linux: .AppImage
```

## Testing the Semantic Parser in Isolation

```bash
# Test parser on any URL (does not require full Electron app)
npm run test-parser -- https://example.com

# Expected output:
# {
#   "url": "https://example.com",
#   "pageIntent": "content",
#   "entities": [...],
#   "forms": [],
#   "actions": [...]
# }
```

## Demo Environment

For the jury demo, use local mock pages instead of real websites:

1. Start the mock server (included with project):
   ```bash
   npm run mock-server
   ```
   
2. Mock pages available at:
   - `http://localhost:3001/form` — shipping address form
   - `http://localhost:3001/products` — product listing grid
   - `http://localhost:3001/booking` — hotel booking flow

3. Seed mock-compatible memory:
   ```bash
   npm run seed-memory
   ```

## Python AI Client Setup (Optional)

For running the DeepSeek/Qwen reference scripts:

```bash
# Install Python dependencies
pip install requests

# Run DeepSeek integration test
python knowledge_base/api/reference/deepseek.py

# Run Qwen integration test
python knowledge_base/api/reference/qwen.py
```

> These require valid session tokens extracted from the respective browser sessions.
