# Technology Stack

## Core Stack

### Runtime
- **Electron** - Native desktop app with full Chromium + Node.js access
- **Node.js** - Main process backend
- **Chromium** - Embedded browser engine

### Frontend
- **React 18** - UI component library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### State Management
- **Zustand** - Lightweight React state management
- Separate stores: agent-store, page-store, ui-store

### Data Persistence
- **better-sqlite3** - Synchronous SQLite for Node.js
- WAL mode enabled for concurrent reads
- Tables: user_profile, domain_memory, workflows, task_history

### Page Interaction
- **CDP (Chrome DevTools Protocol)** - Direct browser control via `debugger` API
- **Accessibility Tree** - Semantic DOM representation
- **Input.dispatchKeyEvent** - Real event simulation (not setAttribute)

### AI Services
- **Anthropic Claude** - LLM for task planning
- Model: claude-sonnet-4-6
- Temperature: 0 (deterministic)
- Max tokens: 1000 (compact plans only)

## Dependency Manifest

### Production Dependencies
```json
{
  "electron": "^28.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "zustand": "^4.4.0",
  "better-sqlite3": "^9.0.0",
  "@anthropic-ai/sdk": "^0.9.0",
  "zod": "^3.22.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.2.0",
  "vite": "^5.0.0",
  "@types/react": "^18.2.0",
  "@types/node": "^20.0.0",
  "tailwindcss": "^3.3.0",
  "electron-forge": "^7.0.0"
}
```

## Design System

### Aesthetic: Linear/Apple Style
- **Colors:** Dark theme, minimal palette
  - Background: `rgba(15, 15, 15, 0.92)`
  - Sidebar: `#1e1e1e` with `backdrop-filter: blur(20px)`
  - Accent: `#6366f1` (indigo)
  - Danger: `#ef4444` (red, for checkpoints)
  
- **Typography:**
  - UI: SF Pro / Inter (system font stack)
  - Code: SF Mono / JetBrains Mono
  - Sizes: 12px (labels), 14px (body), 16px (input), 18px (headers)

- **Motion:**
  - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
  - Duration: 150ms (quick), 200ms (standard)
  - Sidebar collapse: `transform: translateX(320px)`

### Component Patterns
- **Sidebar:** Fixed right, 320px width, 4 tab navigation
- **CommandBar:** Full-viewport overlay, centered 640px modal
- **HUD:** Fixed bottom-right, 280px wide, auto-dismiss after 2s
- **Checkpoint Modal:** Centered, 480px, red border for danger signal

## Architecture Decisions

### Why Electron?
✅ Full CDP access (debugger API)  
✅ Native desktop capabilities  
✅ Unified codebase (no separate extension manifest)  
✅ Complete window/menu control  

❌ Not browser extension (limited CDP, popup UX)  
❌ Not web app (can't inject into arbitrary sites)  

### Why CDP over Puppeteer?
✅ Built into Electron (no separate Chromium bundle)  
✅ Direct access via `webContents.debugger`  
✅ Lower memory footprint  

❌ Not Puppeteer (would bundle second Chromium)

### Why Semantic Parsing over Screenshots?
✅ Token efficient (1KB JSON vs 10KB+ image)  
✅ Accessible (respects ARIA labels, roles)  
✅ Fast (parse in <50ms, no API latency)  
✅ Privacy-preserving (no visual PII capture)  

❌ Not screenshot-based (unreliable OCR, expensive vision models)

### Why Zustand over Redux?
✅ Minimal boilerplate  
✅ No Provider wrapper needed  
✅ Excellent TypeScript inference  
✅ <1KB bundle size  

❌ Not Redux (overkill for sidebar state)  
❌ Not Context API (causes unnecessary re-renders)

### Why SQLite over JSON files?
✅ Atomic transactions  
✅ Indexed queries (fast history lookup)  
✅ Schema migrations  
✅ WAL mode for concurrent reads  

❌ Not JSON files (no query capabilities)  
❌ Not cloud DB (MVP is local-first)

## Forbidden Patterns (MVP)

### Do NOT use:
- ❌ Raw HTML in LLM prompts (use SemanticPageModel instead)
- ❌ Synchronous IPC (always use `invoke`/`handle`, never `sendSync`)
- ❌ `innerHTML` manipulation (use CDP for DOM changes)
- ❌ Global CSS injection (scope to sidebar only)
- ❌ Untyped IPC channels (all channels in `shared/constants.ts`)
- ❌ `eval()` or `new Function()` (security risk)
- ❌ Nested BrowserViews (causes z-index chaos)

### Always:
- ✅ Type all IPC payloads with Zod schemas
- ✅ Use `preload.js` for contextBridge exposure
- ✅ Redact PII before LLM calls (via `llm-client.ts`)
- ✅ Checkpoint before destructive actions
- ✅ Handle CDP session re-attach on navigation

## Development Tools

### Required
- **Node.js** 18+ (for native modules)
- **pnpm** or **npm** (package manager)
- **TypeScript** 5.2+ (strict mode)

### Optional
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript + JavaScript
  - Tailwind CSS IntelliSense

### Build Commands
```bash
npm run dev          # Start Vite dev server + Electron
npm run build        # Compile TypeScript + bundle renderer
npm run package      # Create distributable with Electron Forge
npm run lint         # ESLint check
npm run typecheck    # TypeScript validation
```

## Environment Variables

Required in `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...    # Claude API key
LOG_LEVEL=info                   # debug | info | warn | error
DB_PATH=./ai-browser.db          # SQLite database location
```

## Browser Compatibility

**Target:** Chromium 120+ (Electron 28+)

**Required APIs:**
- CDP v1.3 (Accessibility, DOM, Input, Page domains)
- WebContents debugger API
- IPC (ipcMain, ipcRenderer)

**Not using:**
- Chrome Extension APIs
- WebExtension manifest
- Browser-specific vendor prefixes

## Next Steps

- [Core Architecture Diagram](./README.md)
- [MVP Feature Specifications](../specs/mvp-spec.md)
- [Setup Development Environment](../dev/setup.md)
