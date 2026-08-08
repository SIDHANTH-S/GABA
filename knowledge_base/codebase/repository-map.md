# Repository Map

This document maps the important directories and files in the repository based on the current implementation.

## Root Level
- `apps/browser-shell/`: The Backend (Electron Main Process). Contains all native browser code, persistence, and AI agent execution logic.
- `apps/frontend/`: The Frontend (React/Vite). The UI overlay providing the Sidebar, Workspace, and visual feedback.
- `knowledge_base/`: The authoritative documentation layer (this directory).
- `shared/`: TypeScript interfaces (`types.ts`), constants (`constants.ts`), and the database schema (`schema.sql`) shared between backend and frontend.
- `user-data/`: Generated at runtime. Contains the `better-sqlite3` databases (e.g., `ai-browser.db`, `ai-browser.db-wal`).

---

## Backend (`apps/browser-shell`)

### `src/main.ts`
The primary entry point. Initializes the SQLite DB, spins up the Electron `BrowserWindow`, and instantiates the `BrowserRuntime`.

### `src/preload.ts`
The Context Bridge. Exposes `window.browser` and `window.electronAPI` safely to the React frontend.

### `src/runtime/`
The native managers that track state.
- `BrowserRuntime.ts`: The orchestrator and state broadcaster.
- `TabManager.ts` & `BrowserTab.ts`: Manages `WebContentsView` instances representing open tabs.
- `WindowManager.ts`: Resizes Chromium views to fit around the React UI overlays.

### `src/agent-core/`
The pipeline that executes AI commands.
- `pipeline.ts`: The top-level orchestrator (`Parse → Plan → Execute → Verify`).
- `llm-client.ts`: Connects to NVIDIA NIM APIs (`integrate.api.nvidia.com`). Handles PII redaction.
- `planner.ts`: Transforms user intent + DOM semantic model into a JSON `TaskPlan`.
- `executor.ts`: Iterates through the plan. Clicks, types, and navigates.
- `cdp-bridge.ts`: Wraps Electron's Chrome DevTools Protocol debugger. All DOM interactions pass through here.
- `ipc-handlers.ts`: The registry for all `ipcMain.handle` endpoints listening to the frontend.
- `memory-manager.ts`: Reads/writes to the SQLite DB.

### `src/semantic-parser/`
The heuristic DOM parser that avoids sending raw HTML to LLMs.
- `semantic-model-builder.ts`: Orchestrates all parsing.
- Extracts Entities, Forms, Actions, and Documents natively.

### `src/db/`
- `db.ts`: Initializes `better-sqlite3` in WAL mode and runs migrations.

---

## Frontend (`apps/frontend`)

### `src/main.tsx` & `App.tsx`
The React entry point. Imports global Tailwind CSS (`index.css`).

### `src/store/`
Zustand and React stores caching IPC data.
- `browser.ts`: Caches the `BrowserState` pushed by the backend.
- `agent-store.ts`: Caches the active `TaskPlan` and step progress.
- `ui-store.ts`: Manages local UI states (e.g., command bar visibility).

### `src/components/browser/`
- `workspace/AIWorkspace.tsx`: The primary Layout. Toggles the sidebar rail and positions content.
- `TabStrip.tsx`, `Toolbar.tsx`: Standard browser UI (forward, back, URL bar).

### `src/components/agent/`
- `HUD/HUD.tsx`: The visual display of the AI agent's executing plan and progress.
- `CommandBar/CommandBar.tsx`: The Cmd+K input where users type their AI intent.
- `Sidebar/Sidebar.tsx`: The right-hand panel containing memory, action logs, and contextual data.
- `Checkpoint/CheckpointModal.tsx`: The safety intercept modal asking the user to approve a destructive action.
