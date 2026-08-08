# State Ownership Model

This document outlines the strict separation of state ownership between the Main Process (Backend) and the Renderer Process (Frontend), as verified by the current codebase implementation.

## 1. Browser State

**Owner:** Electron Main Process (`BrowserRuntime` / `TabManager`)

The backend is the sole source of truth for all native browser state. 

### Backend Representation
Stored internally within the `TabManager` and `BrowserTab` classes.
- `BrowserTab` calculates its state dynamically from its underlying `WebContentsView` (e.g., `url`, `title`, `isLoading`, `favicon`).
- `BrowserRuntime` aggregates this into a single `BrowserState` object.

### Frontend Representation
Mirrored via IPC.
- The Main Process throttles and broadcasts `browser:state-update` events to the Frontend via `EventBus`.
- The Frontend `store/browser.ts` subscribes to these events and stores them in a local cache exposed via React's `useSyncExternalStore`.
- **Constraint:** The Frontend CANNOT mutate browser state directly. It must send commands (e.g., `browser:navigate`, `browser:closeTab`) to the backend, which will execute them natively and subsequently broadcast the updated state back to the frontend.

## 2. Window and Workspace State

**Owner:** Electron Main Process (`WindowManager`)

The dimensions and visibility of the React workspace (the sidebar overlay) are managed natively to ensure the underlying Chromium `WebContentsView` is positioned correctly alongside or beneath it.

- When the React UI toggles the sidebar, it sends `browser:toggleWorkspace`.
- The `WindowManager` updates its internal state.
- The `TabManager` listens to these changes and recalculates the `bounds` of the Chromium view using `view.setBounds()`.
- The updated layout state is broadcasted back to the frontend to ensure the React CSS matches the native bounds.

## 3. Agent Execution State

**Owner:** Distributed (Backend executes, Frontend mirrors)

### Backend Representation (`agent-core/pipeline.ts`)
The `TaskPlan` (which includes steps, status, retries) is maintained in memory by the executing pipeline. The backend is responsible for tracking which step is running and updating step statuses based on CDP execution results.

### Frontend Representation (`store/agent-store.ts`)
The Frontend `AgentStore` (Zustand) receives incremental updates via the `agent:task-progress` IPC channel.
- React renders the HUD and progress indicators entirely based on this pushed state.
- If a checkpoint is reached, the Backend halts execution and pushes `agent:checkpoint-request`.
- The Frontend renders the modal, and sends `agent:checkpoint-resolve` back to unblock the backend.

## 4. Persistence / Memory State

**Owner:** Electron Main Process (`db/db.ts`)

All persistence (profiles, domain memories, workflow recordings) lives exclusively in the SQLite database managed by the Main Process.

- The Frontend requests memory slices (e.g., `memory:get-profile`, `memory:get-domain`) on-demand or when needed for display.
- The AI planner (`planner.ts`) pulls memory directly from the SQLite database to augment the context sent to the LLM.
- **Constraint:** The Frontend has no direct access to the database or filesystem. All data retrieval and mutation happen over defined IPC channels.
