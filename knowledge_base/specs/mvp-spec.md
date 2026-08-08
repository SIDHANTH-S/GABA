# AI-Native Execution Browser — MVP Technical Specification
> Version 1.0 | Hand-off document for AI coding agents
> Status: PRESCRIPTIVE IMPLEMENTATION SPEC — follow exactly

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Complete File Structure](#2-complete-file-structure)
3. [File-by-File Specification](#3-file-by-file-specification)
4. [Data Models](#4-data-models)
5. [Agent Pipeline Specification](#5-agent-pipeline-specification)
6. [10 Demo Features Implementation Plan](#6-10-demo-features-implementation-plan)
7. [Setup & Run Instructions](#7-setup--run-instructions)

---

## 1. EXECUTIVE SUMMARY

### Project Definition
The AI-Native Execution Browser is an Electron-based desktop application that wraps a Chromium browser with a semantic AI agent layer, enabling users to issue natural-language commands that are converted into deterministic web interactions — clicking, filling, extracting, and navigating — without any manual effort. The AI operates invisibly in a collapsible sidebar and transparent HUD overlay, never obscuring the active webpage, and pauses for user verification before any destructive action (form submission, payment). All page understanding is performed locally via accessibility-tree parsing; the LLM is invoked only for planning and disambiguation, never for raw HTML processing.

### MVP Success Criteria (Jury Demo)
| Criterion | Pass Condition |
|---|---|
| Command execution | `Cmd+K` → natural language → visible task completion in ≤ 15s |
| Live page understanding | Sidebar updates with entities/actions within 2s of page load |
| Smart form fill | Profile mapped to any form with ≥ 85% field accuracy |
| Workflow replay | Record → replay cycle works end-to-end without error |
| Verification checkpoint | Modal fires before every form submit/payment action |
| No LLM for parsing | Semantic parser produces `SemanticPageModel` with zero API calls |
| Extraction | Any table/list page exports valid JSON or CSV |
| Visual polish | Linear/Apple aesthetic; no visible lag in sidebar re-renders |

---

## 2. COMPLETE FILE STRUCTURE

```
ai-browser/
├── package.json                        # Root monorepo scripts + Electron build config
├── tsconfig.json                       # Base TS config (strict mode)
├── tsconfig.main.json                  # Extends base; targets electron-main/
├── tsconfig.renderer.json              # Extends base; targets renderer/ with DOM lib
├── .env.example                        # All required env vars with placeholders
├── vite.config.ts                      # Vite config for renderer bundle
├── forge.config.ts                     # Electron Forge packaging config
│
├── electron-main/                      # Node.js main process (no DOM access)
│   ├── index.ts                        # App entry: creates windows, registers IPC
│   ├── window-manager.ts               # BrowserWindow lifecycle, sidebar injection
│   ├── cdp-bridge.ts                   # CDP session: attach, DOM query, JS inject
│   ├── ipc-handlers.ts                 # All ipcMain.handle() registrations
│   ├── global-shortcuts.ts             # Cmd+K and other global hotkey bindings
│   ├── tab-manager.ts                  # Multi-tab state, group management
│   └── db.ts                           # better-sqlite3 init, migration runner
│
├── renderer/                           # Chromium renderer process (React + DOM)
│   ├── index.html                      # Shell HTML loaded by Electron
│   ├── main.tsx                        # React root render, global store init
│   ├── App.tsx                         # Root component: Sidebar + CommandBar + HUD
│   │
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx             # Collapsible sidebar shell (320px)
│   │   │   ├── EntityPanel.tsx         # Displays extracted SemanticEntity list
│   │   │   ├── ActionPanel.tsx         # Clickable detected page actions
│   │   │   ├── MemoryPanel.tsx         # Domain memory + past task history
│   │   │   └── DocumentPanel.tsx       # Detected PDF/bill actions hub
│   │   │
│   │   ├── CommandBar/
│   │   │   ├── CommandBar.tsx          # Cmd+K modal overlay with input + results
│   │   │   ├── CommandInput.tsx        # Autofocus input with intent suggestions
│   │   │   └── SuggestionList.tsx      # Context-aware command suggestions
│   │   │
│   │   ├── HUD/
│   │   │   ├── HUD.tsx                 # Transparent bottom-right overlay container
│   │   │   ├── TaskProgress.tsx        # Step progress bar + current action label
│   │   │   └── StepBadge.tsx           # Individual step status pill component
│   │   │
│   │   └── Checkpoint/
│   │       ├── CheckpointModal.tsx     # Blocking modal before destructive actions
│   │       └── ActionDiff.tsx          # Shows what agent is about to do
│   │
│   ├── hooks/
│   │   ├── usePageContext.ts           # Subscribes to SemanticPageModel updates via IPC
│   │   ├── useAgent.ts                 # Starts tasks, subscribes to TaskPlan status
│   │   ├── useMemory.ts                # Read/write UserMemory via IPC
│   │   ├── useCommandBar.ts            # Cmd+K open/close + history state
│   │   └── useCheckpoint.ts            # Receives checkpoint events, resolves promises
│   │
│   └── store/
│       ├── agent-store.ts              # Zustand: TaskPlan, current step, errors
│       ├── page-store.ts               # Zustand: SemanticPageModel for current tab
│       └── ui-store.ts                 # Zustand: sidebar open, HUD visible, modals
│
├── agent-core/                         # AI agent logic (runs in main process)
│   ├── pipeline.ts                     # Orchestrator: Intent→Parse→Plan→Execute→Verify
│   ├── planner.ts                      # LLM call: SemanticPageModel+intent → TaskPlan
│   ├── executor.ts                     # Executes AgentAction[] via CDP bridge
│   ├── verifier.ts                     # Pre-action checks + checkpoint gating
│   ├── memory-manager.ts               # CRUD for UserMemory + DomainMemory in SQLite
│   ├── extractor.ts                    # JSON/CSV export from SemanticPageModel data
│   ├── workflow-recorder.ts            # Intercepts CDP events → WorkflowRecording
│   ├── workflow-replayer.ts            # Replays WorkflowRecording via executor
│   └── llm-client.ts                   # Anthropic SDK wrapper with PII redaction
│
├── semantic-parser/                    # Local parsing; ZERO external API calls
│   ├── dom-extractor.ts                # CDP accessibility tree → raw node tree
│   ├── entity-detector.ts              # Regex + heuristics → SemanticEntity[]
│   ├── form-analyzer.ts                # Form fields → SemanticForm[] with type inference
│   ├── page-classifier.ts              # URL + DOM signals → PageIntent
│   ├── document-detector.ts            # Finds PDF links, invoice tables, bill patterns
│   ├── action-discoverer.ts            # Finds clickable actions with semantic labels
│   ├── tab-intent-classifier.ts        # Per-tab intent for smart grouping
│   └── semantic-model-builder.ts       # Assembles full SemanticPageModel from all parsers
│
├── shared/                             # Imported by both main + renderer (no Node/DOM APIs)
│   ├── types.ts                        # ALL TypeScript interfaces (single source of truth)
│   ├── constants.ts                    # IPC channel names, config defaults, regex patterns
│   ├── schema.sql                      # SQLite DDL (tables, indexes)
│   └── utils.ts                        # Pure functions: redactPII, normalizeSelector, etc.
│
└── scripts/
    ├── test-parser.ts                  # Standalone CLI: parse any URL, print SemanticPageModel
    └── seed-memory.ts                  # Seeds SQLite with demo user profile for jury demo
```

---

## 3. FILE-BY-FILE SPECIFICATION

### 3.1 `electron-main/index.ts`

**Purpose:** Electron app entry point. Initializes the database, creates the main browser window, registers all IPC handlers, and starts the CDP session after page load.

**Key exports:**
```typescript
// No exports — this is the entry module.
// Called by Electron's `main` field in package.json.
```

**Critical implementation:**
```typescript
import { app, BrowserWindow } from 'electron';
import { initDB } from './db';
import { createMainWindow } from './window-manager';
import { registerIPCHandlers } from './ipc-handlers';
import { registerGlobalShortcuts } from './global-shortcuts';

app.whenReady().then(async () => {
  await initDB();
  const win = await createMainWindow();
  registerIPCHandlers(win);
  registerGlobalShortcuts(win);
});

// PITFALL: Do NOT call new BrowserWindow() before app.whenReady() resolves.
// PITFALL: webPreferences must include { contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
// PITFALL: nodeIntegration must be FALSE — use IPC bridge exclusively.
```

**Dependencies:** `electron`, `./db`, `./window-manager`, `./ipc-handlers`, `./global-shortcuts`

---

### 3.2 `electron-main/window-manager.ts`

**Purpose:** Creates and manages the `BrowserWindow`. Injects the sidebar React app as a `<webview>`-equivalent overlay using a secondary `BrowserView`. Handles resize/reposition on window resize.

**Key exports:**
```typescript
export function createMainWindow(): Promise<BrowserWindow>;
export function getSidebarView(): BrowserView;
export function injectHUDScript(win: BrowserWindow): void;
// HUD is injected via CDP executeScript, not a BrowserView
```

**Critical implementation notes:**
- The main window loads user-navigated URLs directly (no custom protocol wrapper needed for MVP).
- The sidebar is a `BrowserView` anchored to the right: `setBounds({ x: win.width - 320, y: 0, width: 320, height: win.height })`.
- On sidebar collapse, `setBounds({ width: 0 })` — do NOT `hide()` the view as it causes CDP detach.
- The HUD overlay is injected via `cdp-bridge.ts` as a `position: fixed` DOM element into the target page — not a BrowserView. This avoids z-index battles.
- `webPreferences` for the main content view: `{ contextIsolation: true, sandbox: true }`.

**Dependencies:** `electron`, `./cdp-bridge`

---

### 3.3 `electron-main/cdp-bridge.ts`

**Purpose:** Central interface to Chrome DevTools Protocol. Opens a CDP session on the main content window, exposes typed methods for DOM queries, JS execution, accessibility tree extraction, and input simulation.

**Key exports:**
```typescript
export async function attachCDP(win: BrowserWindow): Promise<CDPSession>;

export async function getAccessibilityTree(session: CDPSession): Promise<AXNode[]>;

export async function querySelector(
  session: CDPSession,
  selector: string
): Promise<NodeId | null>;

export async function clickElement(
  session: CDPSession,
  nodeId: NodeId
): Promise<void>;

export async function fillInput(
  session: CDPSession,
  nodeId: NodeId,
  value: string
): Promise<void>;

export async function navigateTo(
  session: CDPSession,
  url: string
): Promise<void>;

export async function executeScript<T>(
  session: CDPSession,
  script: string
): Promise<T>;

export async function extractPageSource(
  session: CDPSession
): Promise<{ url: string; title: string; }>;

// NEVER expose raw HTML extraction — extract accessibility tree only.
```

**Critical implementation notes:**
- Use `electron`'s built-in `session.webContents.debugger` API (not puppeteer) to avoid bundling Chromium.
- `attachCDP`: call `win.webContents.debugger.attach('1.3')`.
- For `fillInput`: use `Input.dispatchKeyEvent` sequence, NOT `DOM.setAttributeValue`. This fires real browser events.
- Accessibility tree: `Accessibility.getFullAXTree` — filter out `role: 'none'` and `role: 'generic'` nodes before returning.
- CDP session re-attaches automatically on navigation via `did-navigate` event on `webContents`.
- **Pitfall:** `debugger.sendCommand` is async but doesn't reject on CDP errors — always check `response.exceptionDetails`.

**Dependencies:** `electron`, `shared/types`

---

### 3.4 `electron-main/ipc-handlers.ts`

**Purpose:** Single file registering all `ipcMain.handle()` calls. Acts as the API gateway between renderer process and main process services.

**Key exports:**
```typescript
export function registerIPCHandlers(win: BrowserWindow): void;
```

**Complete IPC channel registry** (all channels defined in `shared/constants.ts`):

| Channel | Direction | Payload | Response |
|---|---|---|---|
| `page:get-semantic-model` | R→M | `void` | `SemanticPageModel` |
| `page:subscribe-updates` | M→R (push) | `SemanticPageModel` | — |
| `agent:run-task` | R→M | `{ intent: string }` | `TaskPlan` |
| `agent:task-progress` | M→R (push) | `TaskPlanUpdate` | — |
| `agent:checkpoint-request` | M→R (push) | `CheckpointPayload` | — |
| `agent:checkpoint-resolve` | R→M | `{ approved: boolean }` | `void` |
| `memory:get-profile` | R→M | `void` | `UserProfile` |
| `memory:get-domain` | R→M | `{ domain: string }` | `DomainMemory` |
| `memory:set-profile` | R→M | `Partial<UserProfile>` | `void` |
| `workflow:start-recording` | R→M | `void` | `void` |
| `workflow:stop-recording` | R→M | `{ name: string }` | `WorkflowRecording` |
| `workflow:replay` | R→M | `{ id: string }` | `TaskPlan` |
| `workflow:list` | R→M | `void` | `WorkflowRecording[]` |
| `extract:page-data` | R→M | `{ format: 'json' \| 'csv' }` | `string` |
| `tabs:get-groups` | R→M | `void` | `TabGroup[]` |
| `tabs:group-by-intent` | R→M | `void` | `TabGroup[]` |

**Push channel implementation pattern:**
```typescript
// For M→R push channels, store win reference and use:
win.webContents.send(CHANNELS.AGENT_TASK_PROGRESS, update);
// Renderer subscribes via: ipcRenderer.on(channel, handler)
```

---

### 3.5 `electron-main/global-shortcuts.ts`

**Purpose:** Registers system-wide keyboard shortcuts independent of window focus.

**Key exports:**
```typescript
export function registerGlobalShortcuts(win: BrowserWindow): void;
export function unregisterAll(): void;
```

**Implementation:**
```typescript
import { globalShortcut, BrowserWindow } from 'electron';
import { CHANNELS } from '../shared/constants';

export function registerGlobalShortcuts(win: BrowserWindow): void {
  // Cmd+K (Mac) / Ctrl+K (Win/Linux)
  globalShortcut.register('CommandOrControl+K', () => {
    win.webContents.send(CHANNELS.UI_TOGGLE_COMMAND_BAR);
    // Also send to sidebar BrowserView
  });

  globalShortcut.register('Escape', () => {
    win.webContents.send(CHANNELS.UI_DISMISS_OVERLAYS);
  });
}
// PITFALL: globalShortcut.register returns false if already registered.
// Always call unregisterAll() in app.on('will-quit').
```

---

### 3.6 `electron-main/tab-manager.ts`

**Purpose:** Tracks open tabs (via `webContents.id`), stores per-tab intent, and implements smart grouping logic.

**Key exports:**
```typescript
export interface TabState {
  id: number;
  url: string;
  title: string;
  intent: PageIntent;
  groupId?: string;
}

export function registerTab(webContents: WebContents): void;
export function getTabStates(): TabState[];
export function assignTabToGroup(tabId: number, groupId: string): void;
export async function autoGroupByIntent(): Promise<TabGroup[]>;
```

**Algorithm for `autoGroupByIntent`:**
1. Get all `TabState` entries.
2. Cluster by `intent` field (from `tab-intent-classifier.ts`).
3. For tabs with `intent === 'unknown'`, cluster by domain (e.g., all `google.com` tabs together).
4. Assign human-readable group names via `planner.ts` LLM call with minimal prompt.
5. Persist groups to SQLite via `memory-manager.ts`.
6. Use Electron's `webContents` API to visually group tabs (MVP: highlight via injected CSS border on tab bar).

---

### 3.7 `electron-main/db.ts`

**Purpose:** Initializes `better-sqlite3`, runs schema migrations from `shared/schema.sql`, and exports a singleton `db` instance.

**Key exports:**
```typescript
import Database from 'better-sqlite3';
export let db: Database.Database;
export async function initDB(): Promise<void>;
export function runMigration(sql: string): void;
```

**Implementation notes:**
- DB file path: `app.getPath('userData') + '/ai-browser.db'`.
- On init: read `shared/schema.sql`, split by `--;` delimiter, execute each statement.
- Enable WAL mode: `db.pragma('journal_mode = WAL')` for concurrent read performance.
- Enable foreign keys: `db.pragma('foreign_keys = ON')`.

---

### 3.8 `renderer/main.tsx`

**Purpose:** React 18 root render. Sets up Zustand stores and renders `<App />`.

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
```

---

### 3.9 `renderer/App.tsx`

**Purpose:** Root component. Renders sidebar, command bar, HUD, and checkpoint modal. Initializes page context subscription on mount.

```typescript
import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CommandBar } from './components/CommandBar/CommandBar';
import { HUD } from './components/HUD/HUD';
import { CheckpointModal } from './components/Checkpoint/CheckpointModal';
import { usePageContext } from './hooks/usePageContext';
import { useCheckpoint } from './hooks/useCheckpoint';

export default function App() {
  const { subscribeToPageUpdates } = usePageContext();
  const { isCheckpointOpen } = useCheckpoint();

  useEffect(() => {
    const unsub = subscribeToPageUpdates();
    return unsub;
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <CommandBar />
      <HUD />
      {isCheckpointOpen && <CheckpointModal />}
    </div>
  );
}
```

---

### 3.10 `renderer/components/Sidebar/Sidebar.tsx`

**Purpose:** Collapsible 320px right-side panel. Tabs: Entities | Actions | Memory | Documents.

**Design spec (Linear/Apple aesthetic):**
- Background: `rgba(15, 15, 15, 0.92)` with `backdrop-filter: blur(20px)`.
- Tab strip: 4 icon tabs at top, 32px height, `#1e1e1e` bg.
- Active tab: `#2a2a2a` bg, `#ffffff` icon.
- Collapse trigger: 8px-wide drag handle on left edge.
- Transition: `transform: translateX(0 → 320px)`, `transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- No rounded corners on sidebar edges that touch window border.

**Key exports:**
```typescript
export function Sidebar(): JSX.Element;
// Uses useUIStore() for open/closed state
// Uses usePageContext() for SemanticPageModel data
```

---

### 3.11 `renderer/components/CommandBar/CommandBar.tsx`

**Purpose:** `Cmd+K` overlay. Full-viewport dimmed background with centered 640px input modal. Converts user text → calls `agent:run-task` IPC.

**Visual spec:**
- Overlay: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`.
- Input box: `#1a1a1a` bg, 1px `#333` border, 48px height, 16px font, SF Mono / JetBrains Mono.
- Placeholder: `"What do you want to do?"` in `#555`.
- Suggestions list: 4 context-aware items below input, rendered from `SuggestionList.tsx`.
- On submit: input box transforms to progress state (pulsing left border `#6366f1`).

**Key implementation:**
```typescript
const handleSubmit = async (intent: string) => {
  setIsLoading(true);
  const plan = await window.electronAPI.runTask({ intent });
  useAgentStore.getState().setActivePlan(plan);
  setIsLoading(false);
  onClose();
};
// PITFALL: CommandBar must render in the sidebar BrowserView, NOT injected into the page.
```

---

### 3.12 `renderer/components/HUD/HUD.tsx`

**Purpose:** Transparent `position: fixed` bottom-right overlay. Shows active task name + step progress.

**Visual spec:**
- Container: `bottom: 24px; right: 24px; width: 280px`.
- Background: `rgba(10,10,10,0.85)`, `border-radius: 12px`, `border: 1px solid #2a2a2a`.
- Progress bar: `height: 2px`, gradient `#6366f1 → #818cf8`, animated fill.
- Step label: 12px, `#aaa`, truncated at 240px.
- Entry animation: slide up + fade in, 150ms.
- Auto-dismisses 2s after `status: 'complete'`.

**Key exports:**
```typescript
export function HUD(): JSX.Element | null;
// Returns null when no active TaskPlan
// Subscribes to useAgentStore().activePlan
```

---

### 3.13 `renderer/components/Checkpoint/CheckpointModal.tsx`

**Purpose:** BLOCKING modal that fires before any destructive action. User must explicitly approve or cancel.

**Visual spec:**
- Full-viewport overlay: `rgba(0,0,0,0.8)`.
- Modal card: 480px wide, `#111` bg, `border: 1px solid #ef4444` (red, danger signal).
- Title: "Action Required" in 18px semibold.
- `ActionDiff.tsx` shows a before/after table of what agent will fill/submit.
- Two buttons: "Cancel" (`#222` bg) and "Approve & Continue" (`#ef4444` bg).

**Critical implementation:**
```typescript
// Checkpoint is a Promise-based gate in the agent pipeline.
// Modal resolves/rejects a promise held by verifier.ts.
// DO NOT implement as fire-and-forget event.
```

---

### 3.14 `renderer/hooks/usePageContext.ts`

```typescript
import { useEffect } from 'react';
import { usePageStore } from '../store/page-store';

export function usePageContext() {
  const setModel = usePageStore(s => s.setModel);

  function subscribeToPageUpdates(): () => void {
    const handler = (_: unknown, model: SemanticPageModel) => setModel(model);
    window.electronAPI.onPageUpdate(handler);
    return () => window.electronAPI.offPageUpdate(handler);
  }

  return { subscribeToPageUpdates, model: usePageStore(s => s.model) };
}
```

---

### 3.15 `renderer/store/agent-store.ts`

```typescript
import { create } from 'zustand';
import { TaskPlan, PlanStep } from '../../shared/types';

interface AgentStore {
  activePlan: TaskPlan | null;
  setActivePlan: (plan: TaskPlan) => void;
  updateStep: (stepId: string, update: Partial<PlanStep>) => void;
  clearPlan: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  activePlan: null,
  setActivePlan: (plan) => set({ activePlan: plan }),
  updateStep: (stepId, update) => set(state => ({
    activePlan: state.activePlan ? {
      ...state.activePlan,
      steps: state.activePlan.steps.map(s =>
        s.id === stepId ? { ...s, ...update } : s
      )
    } : null
  })),
  clearPlan: () => set({ activePlan: null })
}));
```

---

### 3.16 `agent-core/pipeline.ts`

**Purpose:** Top-level orchestrator. Called by `ipc-handlers.ts` for `agent:run-task`. Returns `TaskPlan` immediately (for HUD display) and executes steps async.

**Key exports:**
```typescript
export async function runPipeline(
  intent: string,
  win: BrowserWindow,
  session: CDPSession
): Promise<TaskPlan>;
```

**Full pipeline flow:** See [Section 5](#5-agent-pipeline-specification).

---

### 3.17 `agent-core/planner.ts`

**Purpose:** Takes `SemanticPageModel` + user intent string → calls Claude API → returns structured `TaskPlan`.

**Key exports:**
```typescript
export async function planTask(
  intent: string,
  model: SemanticPageModel,
  memory: DomainMemory | null
): Promise<TaskPlan>;
```

**LLM prompt strategy:**
```
System: You are a browser automation planner. Output ONLY valid JSON matching TaskPlan schema.
User: 
  Page context: {compact SemanticPageModel — entities, forms, actions only}
  User intent: "{intent}"
  User memory: {relevant DomainMemory fields}
  
  Generate a TaskPlan. For each step, use only selectors from the provided page context.
  Mark steps with isDestructive=true if they involve form submission or payment.
  Max 10 steps.
```
- **Token budget:** Compact the `SemanticPageModel` before injection — strip DOM selectors, keep only semantic labels. Full selectors are re-resolved by executor at runtime.
- **Response parsing:** Strip markdown fences, parse JSON, validate against `TaskPlan` schema with `zod`.

---

### 3.18 `agent-core/executor.ts`

**Purpose:** Executes a `TaskPlan` step-by-step via `cdp-bridge.ts`. Emits progress events via IPC. Handles retries and error recovery.

**Key exports:**
```typescript
export async function executePlan(
  plan: TaskPlan,
  session: CDPSession,
  win: BrowserWindow,
  onProgress: (update: TaskPlanUpdate) => void,
  onCheckpoint: (payload: CheckpointPayload) => Promise<boolean>
): Promise<void>;
```

**Execution loop:**
```typescript
for (const step of plan.steps) {
  emitProgress(step.id, 'running');
  
  if (step.action.requiresUserConfirmation) {
    const approved = await onCheckpoint({ step, plan });
    if (!approved) { emitProgress(step.id, 'skipped'); continue; }
  }
  
  let success = false;
  for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
    try {
      await executeAction(step.action, session);
      success = true;
      break;
    } catch (e) {
      if (attempt === step.maxRetries) throw e;
      await sleep(500 * (attempt + 1)); // exponential backoff
    }
  }
  
  emitProgress(step.id, success ? 'success' : 'failed');
}
```

**`executeAction` dispatch table:**
```typescript
const actionHandlers: Record<ActionType, (payload, session) => Promise<void>> = {
  click:      (p, s) => cdp.clickElement(s, await cdp.querySelector(s, p.selector!)),
  fill:       (p, s) => cdp.fillInput(s, await cdp.querySelector(s, p.selector!), p.value!),
  navigate:   (p, s) => cdp.navigateTo(s, p.url!),
  extract:    (p, s) => extractor.extract(s, p.extractTarget!),
  download:   (p, s) => cdp.executeScript(s, `window.open('${p.url}', '_blank')`),
  wait:       (p, _) => sleep(p.duration ?? 1000),
  scroll:     (p, s) => cdp.executeScript(s, `window.scrollBy(0, ${p.duration ?? 400})`),
  'group-tabs': (p, s) => tabManager.autoGroupByIntent(),
  checkpoint: (p, _) => Promise.resolve(), // handled by caller
};
```

---

### 3.19 `agent-core/verifier.ts`

**Purpose:** Pre-execution safety checks. Implements the checkpoint Promise gate.

**Key exports:**
```typescript
export function isDestructiveAction(action: AgentAction): boolean;

export async function requestCheckpoint(
  payload: CheckpointPayload,
  win: BrowserWindow
): Promise<boolean>;
// Sends IPC push to renderer, returns Promise that resolves when user responds.
// Timeout: 60 seconds → auto-cancel.
```

**Checkpoint gate implementation:**
```typescript
// In verifier.ts — checkpoint resolver map
const pendingCheckpoints = new Map<string, (approved: boolean) => void>();

export async function requestCheckpoint(payload, win): Promise<boolean> {
  const id = crypto.randomUUID();
  win.webContents.send(CHANNELS.AGENT_CHECKPOINT_REQUEST, { ...payload, id });
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingCheckpoints.delete(id);
      resolve(false); // auto-cancel on timeout
    }, 60_000);
    
    pendingCheckpoints.set(id, (approved) => {
      clearTimeout(timeout);
      resolve(approved);
    });
  });
}

// Called from ipc-handlers.ts when renderer sends checkpoint-resolve:
export function resolveCheckpoint(id: string, approved: boolean): void {
  pendingCheckpoints.get(id)?.(approved);
  pendingCheckpoints.delete(id);
}
```

---

### 3.20 `agent-core/llm-client.ts`

**Purpose:** Thin Anthropic SDK wrapper. Enforces PII redaction before every call.

**Key exports:**
```typescript
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string>;

export function redactPII(text: string): string;
// Redacts: credit card numbers, SSN, passwords, full addresses
// Uses patterns from shared/constants.ts
// Logs redaction count but NOT redacted values
```

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callLLM(system, user, opts = {}) {
  const redactedUser = redactPII(user);
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 1000,
    temperature: opts.temperature ?? 0,
    system,
    messages: [{ role: 'user', content: redactedUser }]
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

---

### 3.21 `agent-core/memory-manager.ts`

**Purpose:** All reads/writes to UserMemory and DomainMemory in SQLite.

**Key exports:**
```typescript
export function getUserProfile(): UserProfile;
export function setUserProfile(profile: Partial<UserProfile>): void;
export function getDomainMemory(domain: string): DomainMemory | null;
export function upsertDomainMemory(domain: string, update: Partial<DomainMemory>): void;
export function saveFormInputs(domain: string, inputs: Record<string, string>): void;
export function listWorkflows(): WorkflowRecording[];
export function saveWorkflow(recording: WorkflowRecording): void;
export function getWorkflow(id: string): WorkflowRecording | null;
```

---

### 3.22 `agent-core/extractor.ts`

**Purpose:** Converts the current page's `SemanticPageModel` into JSON or CSV string.

**Key exports:**
```typescript
export function extractToJSON(model: SemanticPageModel): string;
export function extractToCSV(model: SemanticPageModel): string;
```

**Algorithm:**
1. Prioritize `model.entities` — group by type, output as `{ type: string; value: string; }[]`.
2. If page has tabular data (detected via `role: 'grid'` or `role: 'rowgroup'` in AX tree), extract row-by-row.
3. If page is a product listing, extract `{ name, price, url }` per item.
4. CSV: first row = column headers, subsequent rows = values. Use `papaparse` for serialization.

---

### 3.23 `agent-core/workflow-recorder.ts`

**Purpose:** Intercepts CDP Network + Input events to build a `WorkflowRecording` from user actions.

**Key exports:**
```typescript
export function startRecording(session: CDPSession): void;
export function stopRecording(name: string): WorkflowRecording;
export function isRecording(): boolean;
```

**What gets recorded:**
- `Input.dispatchKeyEvent` → `fill` steps.
- `DOM` click events (intercepted via injected listener) → `click` steps.
- `Page.frameNavigated` → `navigate` steps.
- **NOT recorded:** Mouse moves, scrolls, hover events.
- Debounce consecutive keystrokes into single `fill` steps (300ms gap = new step).

---

### 3.24 `semantic-parser/dom-extractor.ts`

**Purpose:** Fetches and normalizes the full accessibility tree from CDP into a flat `AXNode[]`.

**Key exports:**
```typescript
export interface AXNode {
  nodeId: string;
  role: string;
  name: string;
  value?: string;
  description?: string;
  children: AXNode[];
  domNodeId?: number;
  boundingBox?: DOMRect;
  properties: Record<string, unknown>;
}

export async function extractAXTree(session: CDPSession): Promise<AXNode[]>;
export function flattenTree(root: AXNode): AXNode[];
export function filterRelevantNodes(nodes: AXNode[]): AXNode[];
// Removes: role=none, role=generic with no name, hidden nodes
```

**CRITICAL:** Never pass raw HTML to any downstream function. Only `AXNode[]` objects flow through the parser chain.

---

### 3.25 `semantic-parser/form-analyzer.ts`

**Purpose:** Identifies form elements in the AX tree and infers semantic field types from labels/attributes.

**Key exports:**
```typescript
export function analyzeForms(nodes: AXNode[]): SemanticForm[];
export function inferFieldType(node: AXNode): SemanticFieldType;
```

**Type inference rules (priority order):**
```typescript
const TYPE_RULES: [RegExp, SemanticFieldType][] = [
  [/first.?name|given.?name/i,       'firstName'],
  [/last.?name|family.?name|surname/i,'lastName'],
  [/full.?name|your.?name/i,          'fullName'],
  [/e.?mail/i,                        'email'],
  [/phone|mobile|tel/i,               'phone'],
  [/street|address.?1|addr/i,         'address'],
  [/city|town/i,                      'city'],
  [/state|province|region/i,          'state'],
  [/zip|postal/i,                     'zip'],
  [/country/i,                        'country'],
  [/card.?number|cc.?num/i,           'creditCard'],
  [/cvv|cvc|security.?code/i,         'cvv'],
  [/expir|exp.?date/i,                'expiry'],
  [/user.?name|login/i,               'username'],
  [/password|passcode/i,              'password'],
  [/search/i,                         'search'],
];
// Match against: node.name (label), node.description (aria-description), node.properties.placeholder
```

---

### 3.26 `semantic-parser/semantic-model-builder.ts`

**Purpose:** Orchestrates all sub-parsers and assembles the final `SemanticPageModel`.

**Key exports:**
```typescript
export async function buildSemanticModel(
  session: CDPSession,
  url: string
): Promise<SemanticPageModel>;
```

**Assembly flow:**
```typescript
export async function buildSemanticModel(session, url) {
  const [pageInfo, axNodes] = await Promise.all([
    cdp.extractPageSource(session),
    domExtractor.extractAXTree(session)
  ]);
  
  const flat = domExtractor.flattenTree(axNodes[0]);
  const relevant = domExtractor.filterRelevantNodes(flat);
  
  const [entities, forms, actions, documents, intent] = await Promise.all([
    entityDetector.detectEntities(relevant),
    formAnalyzer.analyzeForms(relevant),
    actionDiscoverer.discoverActions(relevant),
    documentDetector.detectDocuments(relevant),
    pageClassifier.classifyIntent(url, relevant)
  ]);

  return {
    url,
    title: pageInfo.title,
    pageIntent: intent,
    timestamp: Date.now(),
    entities,
    forms,
    actions,
    navigation: extractNavItems(relevant),
    documents,
    metadata: {}
  };
}
```

---

## 4. DATA MODELS

### 4.1 Complete TypeScript Interfaces (`shared/types.ts`)

```typescript
// ============================================================
// PAGE UNDERSTANDING
// ============================================================

export type PageIntent =
  | 'checkout'
  | 'form-fill'
  | 'article'
  | 'dashboard'
  | 'search'
  | 'document'
  | 'product-listing'
  | 'login'
  | 'unknown';

export interface SemanticPageModel {
  url: string;
  title: string;
  pageIntent: PageIntent;
  timestamp: number;
  entities: SemanticEntity[];
  forms: SemanticForm[];
  actions: PageAction[];
  navigation: NavItem[];
  documents: DetectedDocument[];
  metadata: Record<string, string>;
}

export type EntityType =
  | 'price' | 'date' | 'person' | 'address'
  | 'product' | 'email' | 'phone' | 'url'
  | 'order-number' | 'percentage';

export interface SemanticEntity {
  id: string;
  type: EntityType;
  value: string;
  normalizedValue?: string;    // e.g. "$1,299.00" → 1299.00
  confidence: number;          // 0.0–1.0
  domSelector: string;         // CSS selector for highlighting
}

export type SemanticFieldType =
  | 'firstName' | 'lastName' | 'fullName'
  | 'email' | 'phone'
  | 'address' | 'city' | 'state' | 'zip' | 'country'
  | 'creditCard' | 'cvv' | 'expiry'
  | 'username' | 'password'
  | 'search' | 'generic';

export interface FormField {
  id: string;
  label: string;
  semanticType: SemanticFieldType;
  selector: string;
  required: boolean;
  inputType: string;           // HTML input type attribute
  currentValue?: string;
  placeholder?: string;
  options?: SelectOption[];    // populated for <select> elements
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SemanticForm {
  id: string;
  formSelector: string;
  submitSelector: string;
  fields: FormField[];
  isDestructive: boolean;      // true if checkout/payment/delete
  submitLabel?: string;
}

export interface PageAction {
  id: string;
  label: string;
  selector: string;
  type: 'click' | 'navigate' | 'download' | 'submit';
  context: string;             // e.g. "navigation", "content", "cta"
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface DetectedDocument {
  type: 'pdf' | 'invoice' | 'bill' | 'report' | 'spreadsheet';
  url: string;
  title: string;
  selector: string;
  size?: string;
}

// ============================================================
// USER MEMORY
// ============================================================

export interface UserProfile {
  id: string;                  // local UUID, generated on first run
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: AddressData;
  custom: Record<string, string>;
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface DomainMemory {
  domain: string;
  lastVisited: number;
  formInputs: Record<string, string>;   // semanticFieldType → value
  preferences: Record<string, unknown>;
  taskHistory: string[];               // last 20 intent strings
}

export interface WorkflowRecording {
  id: string;
  name: string;
  description?: string;
  trigger: string;             // intent string that invokes it
  steps: RecordedStep[];
  createdAt: number;
  lastUsed?: number;
  runCount: number;
}

export type RecordedStepType = 'click' | 'fill' | 'navigate' | 'wait' | 'extract';

export interface RecordedStep {
  id: string;
  type: RecordedStepType;
  selector?: string;
  value?: string;
  url?: string;
  label?: string;              // human-readable description
  timestamp: number;           // relative ms from recording start
}

export interface TabGroup {
  id: string;
  name: string;
  intent: PageIntent;
  color: TabGroupColor;
  tabIds: number[];
  createdAt: number;
  updatedAt: number;
}

export type TabGroupColor = 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'yellow';

// ============================================================
// TASK PLANNING & EXECUTION
// ============================================================

export type TaskStatus = 'pending' | 'running' | 'paused' | 'complete' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface TaskPlan {
  id: string;
  intent: string;
  rawCommand: string;
  steps: PlanStep[];
  estimatedDuration: number;   // ms
  requiresCheckpoint: boolean;
  context: SemanticPageModel;  // snapshot at plan time
  status: TaskStatus;
  currentStepIndex: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface PlanStep {
  id: string;
  sequence: number;
  description: string;         // human-readable, shown in HUD
  action: AgentAction;
  expectedOutcome?: string;
  retryCount: number;
  maxRetries: number;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export type ActionType =
  | 'click' | 'fill' | 'navigate' | 'extract'
  | 'download' | 'wait' | 'scroll' | 'keypress'
  | 'group-tabs' | 'checkpoint';

export interface AgentAction {
  id: string;
  type: ActionType;
  payload: ActionPayload;
  isDestructive: boolean;
  requiresUserConfirmation: boolean;
  timestamp?: number;
  result?: ActionResult;
}

export interface ActionPayload {
  selector?: string;
  value?: string;
  url?: string;
  extractTarget?: 'json' | 'csv' | 'text';
  keys?: string[];
  duration?: number;
  scrollAmount?: number;
  groupName?: string;
  tabIds?: number[];
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================================
// IPC TYPES
// ============================================================

export interface TaskPlanUpdate {
  planId: string;
  stepId: string;
  stepStatus: StepStatus;
  planStatus: TaskStatus;
  currentStepIndex: number;
}

export interface CheckpointPayload {
  id: string;
  planId: string;
  stepId: string;
  stepDescription: string;
  action: AgentAction;
  riskLevel: 'low' | 'medium' | 'high';
}
```

---

### 4.2 SQLite Schema (`shared/schema.sql`)

```sql
-- User profile (single row)
CREATE TABLE IF NOT EXISTS user_profile (
  id          TEXT PRIMARY KEY,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  address_json TEXT,           -- JSON: AddressData
  custom_json TEXT DEFAULT '{}' -- JSON: Record<string,string>
);

-- Domain memory (one row per domain)
CREATE TABLE IF NOT EXISTS domain_memory (
  domain         TEXT PRIMARY KEY,
  last_visited   INTEGER NOT NULL,
  form_inputs    TEXT DEFAULT '{}',  -- JSON: Record<semanticFieldType, value>
  preferences    TEXT DEFAULT '{}',  -- JSON: Record<string,unknown>
  task_history   TEXT DEFAULT '[]'   -- JSON: string[] (last 20)
);

-- Workflow recordings
CREATE TABLE IF NOT EXISTS workflow_recordings (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  trigger     TEXT NOT NULL,
  steps_json  TEXT NOT NULL,   -- JSON: RecordedStep[]
  created_at  INTEGER NOT NULL,
  last_used   INTEGER,
  run_count   INTEGER NOT NULL DEFAULT 0
);

-- Task history (for memory/replay)
CREATE TABLE IF NOT EXISTS task_history (
  id           TEXT PRIMARY KEY,
  intent       TEXT NOT NULL,
  plan_json    TEXT NOT NULL,  -- JSON: TaskPlan
  status       TEXT NOT NULL,
  domain       TEXT,
  created_at   INTEGER NOT NULL,
  completed_at INTEGER
);

-- Tab groups
CREATE TABLE IF NOT EXISTS tab_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  intent      TEXT NOT NULL,
  color       TEXT NOT NULL,
  tab_ids     TEXT DEFAULT '[]', -- JSON: number[]
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domain_memory_domain ON domain_memory(domain);
CREATE INDEX IF NOT EXISTS idx_task_history_domain ON task_history(domain);
CREATE INDEX IF NOT EXISTS idx_task_history_created ON task_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflow_recordings(trigger);
```

---

## 5. AGENT PIPELINE SPECIFICATION

### 5.1 Complete Pipeline Flow

```
User types intent in CommandBar
        │
        ▼
[1] INTENT CAPTURE
    ipc-handlers.ts → agent:run-task
    → pipeline.runPipeline(intent, win, session)
        │
        ▼
[2] PARSE  (semantic-parser/)
    semantic-model-builder.buildSemanticModel(session, url)
    ├── dom-extractor.extractAXTree(session)       [CDP call]
    ├── entity-detector.detectEntities(nodes)      [local regex]
    ├── form-analyzer.analyzeForms(nodes)           [local heuristics]
    ├── action-discoverer.discoverActions(nodes)    [local]
    ├── document-detector.detectDocuments(nodes)    [local]
    └── page-classifier.classifyIntent(url, nodes) [local]
    → SemanticPageModel (NO LLM calls)
        │
        ▼
[3] PLAN   (agent-core/planner.ts)
    memory-manager.getDomainMemory(domain)
    llm-client.callLLM(systemPrompt, compactModel + intent + memory)
    → TaskPlan { steps: PlanStep[] }
    → IMMEDIATELY pushed to renderer (HUD appears)
        │
        ▼
[4] EXECUTE (agent-core/executor.ts) — ASYNC, step by step
    for each step:
      ├── verifier.isDestructiveAction(action)?
      │     YES → verifier.requestCheckpoint(payload, win)
      │           → IPC push to renderer (CheckpointModal opens)
      │           → await user response (Promise gate, 60s timeout)
      │           NO approval → skip step
      ├── executeAction(action, session)
      │     → cdp-bridge method dispatch
      ├── emit TaskPlanUpdate via IPC (HUD updates)
      └── on error: retry with backoff (max 3 attempts)
             on max retries: mark step 'failed', continue
        │
        ▼
[5] VERIFY / COMPLETE
    All steps done → plan.status = 'complete'
    → IPC push: TaskPlanUpdate with planStatus='complete'
    → memory-manager.saveFormInputs(domain, usedValues)
    → HUD auto-dismisses after 2s
    → Sidebar Memory panel updates
```

### 5.2 Error Handling Strategy

| Error Type | Recovery |
|---|---|
| CDP detach (navigation) | Re-attach session, re-parse page, resume from current step |
| Element not found | Retry with fuzzy selector (try `aria-label` contains match) |
| LLM API timeout | Return error TaskPlan with single step: `{ type: 'checkpoint', description: 'Could not plan task — manual mode' }` |
| LLM returns invalid JSON | `zod` parse fails → retry LLM call once with stricter prompt |
| User cancels checkpoint | Mark step `skipped`, emit update, continue to next step |
| Max retries exceeded | Mark step `failed`, log to `task_history`, continue |
| SQLite write error | Log to stderr, continue (memory is non-blocking) |

### 5.3 Human-in-the-Loop Checkpoint Protocol

```
executor.ts detects requiresUserConfirmation === true
    │
    ├── Calls verifier.requestCheckpoint({ id, planId, stepId, action, riskLevel })
    │
    ├── verifier stores Promise resolver in pendingCheckpoints map with id
    │
    ├── Sends IPC: AGENT_CHECKPOINT_REQUEST → renderer
    │
    ├── Renderer: useCheckpoint() hook receives event → sets isCheckpointOpen=true
    │
    ├── CheckpointModal renders with ActionDiff (shows field→value mapping)
    │
    ├── User clicks "Approve" or "Cancel"
    │
    ├── Renderer sends IPC: AGENT_CHECKPOINT_RESOLVE { id, approved: boolean }
    │
    ├── ipc-handlers.ts calls verifier.resolveCheckpoint(id, approved)
    │
    └── Promise resolves → executor continues or skips step
```

**Risk level assignment** (in `verifier.isDestructiveAction`):
- `high`: `action.type === 'submit'` on a form where `SemanticForm.isDestructive === true`
- `medium`: Any `fill` action on `creditCard`, `cvv`, `password` field types
- `low`: `click` on non-submit buttons, navigation actions

---

## 6. 10 DEMO FEATURES IMPLEMENTATION PLAN

### Feature 1: Smart Form Filler

**Files:** `semantic-parser/form-analyzer.ts`, `agent-core/planner.ts`, `agent-core/executor.ts`, `agent-core/memory-manager.ts`

**Algorithm:**
1. `form-analyzer.ts` builds `SemanticForm[]` with `SemanticFieldType` for each field.
2. `planner.ts` generates `fill` steps by mapping `UserProfile` fields to form field semantic types:
   ```
   firstName → profile.firstName
   email     → profile.email
   address   → profile.address.street
   // etc.
   ```
3. `executor.ts` executes `fill` actions sequentially via CDP `fillInput`.
4. After execution, `memory-manager.saveFormInputs()` stores what was used per domain.
5. On next visit to same domain, `DomainMemory.formInputs` pre-populates suggestions.

**Visual wow factor:** User clicks a button in the sidebar EntityPanel ("Auto-fill form"), progress bar shows each field being filled live. Fields light up as they're populated.

---

### Feature 2: Intent Command Bar

**Files:** `renderer/components/CommandBar/`, `electron-main/global-shortcuts.ts`, `agent-core/pipeline.ts`

**Algorithm:**
1. `Cmd+K` fires from `global-shortcuts.ts` → IPC push → CommandBar opens.
2. As user types, `SuggestionList.tsx` shows 4 context-aware suggestions generated from:
   - Current `SemanticPageModel.pageIntent` (e.g., on checkout page → suggest "Fill my shipping info")
   - `DomainMemory.taskHistory` (last used commands on this domain)
   - Static intent templates from `shared/constants.ts`
3. On Enter/submit → `pipeline.runPipeline()` → CommandBar closes → HUD appears.

**Visual wow factor:** CommandBar transforms smoothly from input to "Running…" state with pulsing indigo border. Suggestions feel intelligent and context-aware.

---

### Feature 3: Live Page Understanding

**Files:** `semantic-parser/semantic-model-builder.ts`, `electron-main/ipc-handlers.ts`, `renderer/components/Sidebar/EntityPanel.tsx`, `renderer/components/Sidebar/ActionPanel.tsx`

**Algorithm:**
1. Hook `webContents.on('did-finish-load')` in `window-manager.ts`.
2. On every page load: call `buildSemanticModel()` → emit via `page:subscribe-updates` IPC.
3. Also re-parse on `did-navigate-in-page` (SPA navigation).
4. `EntityPanel.tsx` renders entities grouped by type with color-coded pills.
5. `ActionPanel.tsx` renders clickable action buttons — clicking an action fires `click` CDP directly.

**Visual wow factor:** Sidebar animates in with staggered entity rows appearing. Real-time entity detection (prices, dates, names) feels like X-ray vision on any webpage.

---

### Feature 4: Task Progress HUD

**Files:** `renderer/components/HUD/`, `renderer/store/agent-store.ts`, `agent-core/executor.ts`

**Algorithm:**
1. `executor.ts` emits `TaskPlanUpdate` IPC on every step state change.
2. `renderer/hooks/useAgent.ts` subscribes → updates `agentStore.activePlan`.
3. `HUD.tsx` reactively renders step count (`2/5 steps`), current step description, and animated progress bar.
4. On `status: 'complete'` → success flash (green border flash) → auto-dismiss after 2s.
5. On `status: 'failed'` → red state → dismiss button appears.

**Visual wow factor:** Minimal floating card in bottom-right. Indigo progress bar fills smoothly. Step description updates with each action. Feels like watching a real operator work.

---

### Feature 5: Contextual Memory

**Files:** `agent-core/memory-manager.ts`, `renderer/components/Sidebar/MemoryPanel.tsx`, `electron-main/db.ts`

**Algorithm:**
1. Every completed task writes to `domain_memory.task_history` and `domain_memory.form_inputs`.
2. Every page load queries `getDomainMemory(domain)` → sidebar shows "Last visited X days ago" + previous tasks.
3. `planner.ts` injects domain memory into LLM prompt → planner reuses known field values.
4. `CommandBar/SuggestionList.tsx` surfaces last 3 commands from `taskHistory` for this domain.

**Visual wow factor:** Sidebar Memory tab shows a timeline of past actions on the current site. Feels like the browser "knows" the user.

---

### Feature 6: Universal Extractor

**Files:** `agent-core/extractor.ts`, `renderer/components/Sidebar/ActionPanel.tsx`, `electron-main/ipc-handlers.ts`

**Algorithm:**
1. `ActionPanel.tsx` always shows "Extract as JSON" and "Extract as CSV" buttons when on any content page.
2. On click → IPC `extract:page-data` → `extractor.ts` processes `SemanticPageModel`.
3. For tabular data: parse `role: 'row'` AX nodes → build row arrays.
4. For entity-heavy pages (e-commerce, news): extract entity-keyed objects.
5. Output written to user's Downloads folder via `fs.writeFile`.
6. Success toast shown in HUD: "Saved 42 rows to Downloads/amazon-results.csv".

**Visual wow factor:** One-click extraction from any page. Immediate file save feedback. Works on Amazon listings, HN articles, LinkedIn profiles — all without scraping HTML.

---

### Feature 7: Workflow Recorder

**Files:** `agent-core/workflow-recorder.ts`, `agent-core/workflow-replayer.ts`, `renderer/components/Sidebar/MemoryPanel.tsx`

**Algorithm:**
1. User clicks "Record" in sidebar → `ipc: workflow:start-recording` → `workflow-recorder.startRecording(session)`.
2. Recorder attaches CDP listeners for Input and Page events.
3. User performs task manually → each action logged as `RecordedStep`.
4. User clicks "Stop" → names the recording → saved to SQLite.
5. On replay: `workflow-replayer.ts` converts `RecordedStep[]` to `AgentAction[]` → feeds to `executor.ts`.
6. Selectors are re-resolved fresh on each replay (handles minor DOM changes).

**Visual wow factor:** "Record" button pulses red while recording. Stopping shows a summary: "Recorded 8 steps in 23s". Replay button immediately runs the task with HUD progress.

---

### Feature 8: Smart Tab Grouping

**Files:** `electron-main/tab-manager.ts`, `semantic-parser/tab-intent-classifier.ts`, `renderer/components/Sidebar/`

**Algorithm:**
1. Every new tab registers in `tab-manager.ts` with its URL.
2. `tab-intent-classifier.ts` classifies tab intent using URL patterns + domain heuristics (no CDP needed for this).
3. User triggers "Group my tabs" from sidebar or CommandBar.
4. `autoGroupByIntent()` clusters tabs by intent → creates `TabGroup[]`.
5. For naming groups, calls `planner.ts` LLM with minimal prompt: `"Name this tab group: [tab titles]. Return 2-3 words."`.
6. Tabs visually indicated in sidebar list with color-coded intent badges.

**URL-based intent classification (no CDP needed):**
```typescript
const INTENT_PATTERNS: [RegExp, PageIntent][] = [
  [/checkout|cart|payment|order/i, 'checkout'],
  [/login|signin|auth/i,           'login'],
  [/docs?|documentation|wiki/i,   'document'],
  [/search|q=|query=/i,            'search'],
  // ... etc
];
```

**Visual wow factor:** All 12 open tabs instantly organized into 4 color-coded groups. Feels like a productivity superpower.

---

### Feature 9: Document Action Hub

**Files:** `semantic-parser/document-detector.ts`, `renderer/components/Sidebar/DocumentPanel.tsx`, `agent-core/executor.ts`

**Algorithm:**
1. `document-detector.ts` scans AX tree for:
   - Links with `.pdf` in href
   - Elements with text matching `/invoice|bill|statement|receipt/i`
   - `role: 'link'` nodes pointing to downloadable files
2. Detected documents appear in sidebar `DocumentPanel.tsx` with 3 action buttons per document:
   - **Download** → CDP click on selector
   - **Summarize** → Extract text content → LLM summarize call → display in sidebar
   - **Save to Memory** → Store in `domain_memory.preferences.savedDocs`
3. Summarize uses `llm-client.callLLM` with the extracted text (PII-redacted).

**Visual wow factor:** On any bank statement or invoice page, sidebar instantly shows document cards with action buttons. Summarize produces a 3-bullet summary in the sidebar within 3 seconds.

---

### Feature 10: Verification Checkpoint

**Files:** `agent-core/verifier.ts`, `renderer/components/Checkpoint/CheckpointModal.tsx`, `renderer/components/Checkpoint/ActionDiff.tsx`, `renderer/hooks/useCheckpoint.ts`

**Algorithm:**
1. `verifier.isDestructiveAction()` checks: is this a form submit on a checkout/payment/delete page?
2. If yes → pause execution → send `AGENT_CHECKPOINT_REQUEST` IPC.
3. `CheckpointModal.tsx` renders with `ActionDiff.tsx` showing every field the agent is about to submit:
   ```
   ┌─────────────────────────────────────┐
   │ ⚠ Action Required                   │
   ├─────────────────────────────────────┤
   │ About to submit checkout form:      │
   │  Name:    John Smith               │
   │  Card:    •••• •••• •••• 4242      │
   │  Total:   $129.99                  │
   │  Ship to: 123 Main St, SF CA 94102 │
   ├─────────────────────────────────────┤
   │  [Cancel]    [Approve & Continue →] │
   └─────────────────────────────────────┘
   ```
4. Credit card number shown masked (last 4 digits only) — full number never sent to LLM.
5. User decision resolves the Promise gate in `verifier.ts` → execution continues or halts.

**Visual wow factor:** Red-bordered modal that blocks everything. The detailed diff shows the user exactly what's being submitted. Feels like a safety superpower that prevents accidental purchases.

---

## 7. SETUP & RUN INSTRUCTIONS

### 7.1 Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
# macOS (primary target for demo): Xcode CLI tools installed
# Linux: libgtk-3-dev, libxss1, libasound2-dev
```

### 7.2 Scaffold & Install

```bash
# Clone and enter project
git clone <repo-url> ai-browser
cd ai-browser

# Install all dependencies
npm install

# Required packages (copy-paste for initial package.json setup):
npm install \
  electron@latest \
  @electron-forge/cli \
  react react-dom \
  @types/react @types/react-dom \
  zustand \
  better-sqlite3 @types/better-sqlite3 \
  @anthropic-ai/sdk \
  zod \
  papaparse @types/papaparse \
  typescript \
  vite @vitejs/plugin-react \
  tailwindcss postcss autoprefixer \
  electron-builder

npm install --save-dev \
  ts-node \
  tsx \
  @types/node \
  concurrently \
  wait-on
```

### 7.3 Environment Variables (`.env`)

```bash
# Copy from .env.example
cp .env.example .env

# Required variables:
ANTHROPIC_API_KEY=sk-ant-xxxxx        # Required for planner.ts and summarize features
AI_BROWSER_USER_ID=local-user-001     # Seeded by scripts/seed-memory.ts
NODE_ENV=development

# Optional:
LOG_LEVEL=info                         # debug | info | warn | error
SEMANTIC_PARSER_TIMEOUT_MS=5000        # Default: 5000
LLM_MAX_TOKENS=1000                    # Default: 1000
LLM_TEMPERATURE=0                      # Default: 0 (deterministic planning)
```

### 7.4 Database Initialization

```bash
# Schema is applied automatically on first app launch via db.ts initDB()
# To seed demo user profile for jury demo:
npx tsx scripts/seed-memory.ts

# seed-memory.ts will create/populate:
# - user_profile: { firstName: "Alex", lastName: "Demo", email: "alex@demo.com", ... }
# - 3 sample WorkflowRecordings
# - domain_memory entries for amazon.com, github.com, linkedin.com
```

### 7.5 `package.json` Scripts

```json
{
  "main": "dist/electron-main/index.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:renderer\" \"wait-on http://localhost:5173 && npm run dev:electron\"",
    "dev:renderer": "vite --port 5173",
    "dev:electron": "tsc -p tsconfig.main.json && electron .",
    "build": "npm run build:renderer && npm run build:electron",
    "build:renderer": "vite build",
    "build:electron": "tsc -p tsconfig.main.json",
    "package": "electron-forge package",
    "test:parser": "npx tsx scripts/test-parser.ts",
    "seed": "npx tsx scripts/seed-memory.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### 7.6 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'renderer',
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
```

### 7.7 `tsconfig.json` (base)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "shared/*": ["./shared/*"]
    }
  }
}
```

### 7.8 Run Development Mode

```bash
# Terminal 1: Start everything
npm run dev

# This runs:
# 1. Vite dev server on :5173 (renderer hot reload)
# 2. TypeScript compiler for main process
# 3. Electron launches after renderer is ready
```

### 7.9 Test Semantic Parser Independently

```bash
# scripts/test-parser.ts — parses any live URL and prints SemanticPageModel
npx tsx scripts/test-parser.ts --url "https://www.amazon.com/dp/B08N5WRWNW"

# Output format:
# {
#   "pageIntent": "product-listing",
#   "entities": [
#     { "type": "price", "value": "$299.99", "confidence": 0.97 },
#     { "type": "product", "value": "Echo Dot (5th Gen)", "confidence": 0.95 }
#   ],
#   "forms": [],
#   "actions": [
#     { "label": "Add to Cart", "type": "click", "selector": "#add-to-cart-button" }
#   ]
# }

# Test form analysis only:
npx tsx scripts/test-parser.ts --url "https://example.com/checkout" --only forms

# Test with local HTML file:
npx tsx scripts/test-parser.ts --file ./test-fixtures/checkout.html
```

**`scripts/test-parser.ts` implementation sketch:**
```typescript
// Launches headless Electron or Puppeteer, navigates to URL,
// calls semantic-model-builder.buildSemanticModel(),
// pretty-prints result to stdout.
// Uses --only flag to filter output sections.
import { program } from 'commander';
// ...
```

### 7.10 Demo Jury Setup Checklist

```
□ Run: npm run seed  (loads demo profile)
□ Verify ANTHROPIC_API_KEY is set and valid
□ Run: npm run dev
□ Navigate to a checkout page (demo: stripe payment demo at https://buy.stripe.com/demo)
□ Verify sidebar shows entities within 2s of load
□ Press Cmd+K → type "Fill my shipping info" → watch form fill
□ Press Cmd+K → type "Extract this page as JSON" → check Downloads folder
□ Navigate to a PDF-heavy page → verify DocumentPanel shows actions
□ Record a 5-step workflow → replay it
□ Open 8+ tabs across 3 domains → press "Group tabs" in sidebar
□ Trigger checkout → verify red checkpoint modal fires before submit
```

---

## APPENDIX: IPC CHANNEL CONSTANTS (`shared/constants.ts`)

```typescript
export const CHANNELS = {
  // Page understanding
  PAGE_GET_SEMANTIC_MODEL:   'page:get-semantic-model',
  PAGE_SUBSCRIBE_UPDATES:    'page:subscribe-updates',

  // Agent lifecycle
  AGENT_RUN_TASK:            'agent:run-task',
  AGENT_TASK_PROGRESS:       'agent:task-progress',
  AGENT_CHECKPOINT_REQUEST:  'agent:checkpoint-request',
  AGENT_CHECKPOINT_RESOLVE:  'agent:checkpoint-resolve',

  // Memory
  MEMORY_GET_PROFILE:        'memory:get-profile',
  MEMORY_GET_DOMAIN:         'memory:get-domain',
  MEMORY_SET_PROFILE:        'memory:set-profile',

  // Workflows
  WORKFLOW_START_RECORDING:  'workflow:start-recording',
  WORKFLOW_STOP_RECORDING:   'workflow:stop-recording',
  WORKFLOW_REPLAY:           'workflow:replay',
  WORKFLOW_LIST:             'workflow:list',

  // Extraction
  EXTRACT_PAGE_DATA:         'extract:page-data',

  // Tabs
  TABS_GET_GROUPS:           'tabs:get-groups',
  TABS_GROUP_BY_INTENT:      'tabs:group-by-intent',

  // UI events (main → renderer)
  UI_TOGGLE_COMMAND_BAR:     'ui:toggle-command-bar',
  UI_DISMISS_OVERLAYS:       'ui:dismiss-overlays',
} as const;

// PII redaction patterns
export const PII_PATTERNS = [
  /\b4[0-9]{12}(?:[0-9]{3})?\b/g,           // Visa
  /\b5[1-5][0-9]{14}\b/g,                   // Mastercard
  /\b3[47][0-9]{13}\b/g,                    // Amex
  /\b\d{3}-\d{2}-\d{4}\b/g,                // SSN
  /password["\s:=]+["']?[^\s"',]+/gi,       // password fields
] as const;

// Semantic parser config
export const PARSER_CONFIG = {
  AX_TREE_TIMEOUT_MS: 5000,
  MIN_ENTITY_CONFIDENCE: 0.7,
  MAX_FORM_FIELDS: 50,
  MAX_ACTIONS: 30,
  ENTITY_DEBOUNCE_MS: 100,
} as const;
```

---

*End of specification. All file paths are relative to project root. All TypeScript interfaces in `shared/types.ts` are the single source of truth — do not duplicate type definitions in other files. Import from `../../shared/types` in all modules.*
