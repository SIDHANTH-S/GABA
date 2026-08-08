# Development Guide

## Contents

- [Setup](./setup.md) — getting the environment running
- [Testing](./testing.md) — running tests and the semantic parser CLI

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# → Edit .env and add ANTHROPIC_API_KEY

# Start development
npm run dev
```

## Directory Map

```
ai-browser/                         ← Project root
├── package.json                    ← npm scripts + electron-forge config
├── tsconfig.json                   ← Base TypeScript config (strict)
├── vite.config.ts                  ← Renderer bundler config
├── .env.example                    ← Required env vars
│
├── electron-main/                  ← Main process (Node.js)
│   ├── index.ts                    ← Entry point
│   ├── window-manager.ts           ← Window + BrowserView lifecycle
│   ├── cdp-bridge.ts               ← Chrome DevTools Protocol interface
│   ├── ipc-handlers.ts             ← All IPC channel registrations
│   ├── global-shortcuts.ts         ← Cmd+K and hotkeys
│   ├── tab-manager.ts              ← Multi-tab tracking
│   └── db.ts                       ← SQLite initialization
│
├── renderer/                       ← Renderer process (React)
│   ├── index.html
│   ├── main.tsx                    ← React root
│   ├── App.tsx                     ← Root component
│   ├── components/
│   │   ├── Sidebar/                ← 4-tab sidebar panel
│   │   ├── CommandBar/             ← Cmd+K overlay
│   │   ├── HUD/                    ← Progress overlay
│   │   └── Checkpoint/             ← Blocking confirm modal
│   ├── hooks/                      ← IPC subscription hooks
│   └── store/                      ← Zustand state
│
├── agent-core/                     ← AI logic (runs in main process)
│   ├── pipeline.ts                 ← Orchestrator
│   ├── planner.ts                  ← LLM → TaskPlan
│   ├── executor.ts                 ← CDP execution
│   ├── verifier.ts                 ← Checkpoint gating
│   ├── memory-manager.ts           ← SQLite CRUD
│   ├── extractor.ts                ← JSON/CSV export
│   ├── workflow-recorder.ts        ← CDP event capture
│   ├── workflow-replayer.ts        ← Replay automation
│   └── llm-client.ts               ← Anthropic SDK wrapper
│
├── semantic-parser/                ← Local page parsing (zero API calls)
│   ├── dom-extractor.ts            ← CDP AX tree fetcher
│   ├── entity-detector.ts          ← Regex + heuristics
│   ├── form-analyzer.ts            ← Form field inference
│   ├── page-classifier.ts          ← Page intent detection
│   ├── document-detector.ts        ← PDF + invoice detection
│   ├── action-discoverer.ts        ← Clickable action labels
│   ├── tab-intent-classifier.ts    ← Per-tab intent
│   └── semantic-model-builder.ts   ← Assembles final model
│
├── shared/                         ← Shared by main + renderer
│   ├── types.ts                    ← All TypeScript interfaces
│   ├── constants.ts                ← IPC channels, config
│   ├── schema.sql                  ← SQLite DDL
│   └── utils.ts                    ← Pure utility functions
│
└── scripts/
    ├── test-parser.ts              ← CLI: test parser on any URL
    └── seed-memory.ts              ← Seeds demo user profile
```

## Key Implementation Rules

1. **shared/types.ts is the single source of truth** for all data structures. Never duplicate type definitions.

2. **All IPC channels are defined in shared/constants.ts.** Never use string literals for IPC channel names.

3. **semantic-parser/ never makes network calls** (other than CDP to the local browser). Zero API calls, zero latency dependency.

4. **agent-core/ runs in main process.** It has access to Node.js, CDP, SQLite. Never import renderer-specific code.

5. **renderer/ never imports from electron directly.** Uses `window.electronAPI` exposed via `preload.js`.

6. **PII is always redacted** before any string reaches `llm-client.ts:callLLM()`.

7. **Checkpoint is a Promise gate**, not an event. The executor awaits the user's decision before proceeding.

## Common Issues

### CDP session drops after navigation
CDP re-attaches automatically via `did-navigate` event listener in `cdp-bridge.ts`. Ensure the event handler is registered.

### Sidebar BrowserView mispositioned
Call `setBounds()` on window resize event. The BrowserView does NOT reflow automatically.

### SQLite SQLITE_BUSY error
Enable WAL mode: `db.pragma('journal_mode = WAL')`. This allows concurrent reads while a write is in progress.

### TypeScript strict mode errors
`tsconfig.json` uses strict mode. Use Zod for runtime validation of API responses and IPC payloads.

## Next Steps

- [Setup Guide](./setup.md)
- [Testing Guide](./testing.md)
- [Feature Specs](../specs/feature-matrix.md)
