# AI Agent Briefing Document

**Project:** AI-Native Execution Browser MVP
**Status:** Audit in progress. This document reflects the **CURRENT IMPLEMENTATION**, not previously drafted plans.
**For:** AI coding agents seeking an accurate, evidence-based understanding of the repository.

---

## What You're Looking At

This repository implements an Electron-based desktop browser application that integrates an AI agent pipeline capable of translating natural language commands into browser automation via the Chrome DevTools Protocol (CDP).

The architecture is divided into:
1. **Frontend (`apps/frontend`)**: A React (Vite/Tailwind) application acting as the UI overlay. It provides the Sidebar, Address Bar, and Command input. It does NOT render web content directly. State is managed via `zustand` stores.
2. **Backend (`apps/browser-shell`)**: An Electron main process that owns the actual `WebContentsView` for rendering websites, tracks native state, connects to CDP, runs the agent logic, and stores data in a SQLite database via `better-sqlite3`.

---

## ⚠️ CRITICAL RULES FOR AI AGENTS ⚠️

1. **Current Code is Truth**: Do NOT trust outdated Markdown specs. The system uses NVIDIA NIM API (`llm-client.ts`), NOT Anthropic. It uses SQLite for persistence, not just local storage.
2. **State Ownership**: React (`store/browser.ts`) does NOT own browser state. It mirrors state pushed from the Electron Main Process via IPC `browser:state-update`. Do not attempt to mutate browser state directly from React; dispatch IPC commands.
3. **Web Interaction**: DOM interaction is strictly performed over CDP (`agent-core/cdp-bridge.ts`). Do NOT use `innerHTML`, `evaluateJavaScript` blindly, or standard WebDriver tools.
4. **Agent Safety**: Destructive actions (clicks on forms, payments, submits) require user confirmation via a Checkpoint mechanism. This is implemented via IPC.
5. **No Hallucinated Imports**: Only import dependencies present in the `package.json` workspaces (`better-sqlite3`, `zod`, `openai`, `lucide-react`, `zustand`).

---

## 1. Process & Runtime Architecture

### Electron Main Process (`apps/browser-shell/src/main.ts`)
The root orchestrator. It initializes SQLite, creates the main `BrowserWindow`, and instantiates `BrowserRuntime`.

### Native State & Views
- **`BrowserRuntime`**: Owns the native views (`TabManager`, `WindowManager`). Emits `state-changed` events on a throttled basis (~60fps) to broadcast state to the frontend.
- **`BrowserTab`**: Wraps a single `WebContentsView`. This is the actual embedded Chromium browser displaying the user's web pages.

### Frontend React Application (`apps/frontend/src/main.tsx`)
Runs inside the `BrowserWindow` context. Interacts with the backend via a secure IPC bridge `window.browser` or `window.electronAPI`.
It acts as a translucent overlay. The native `WebContentsView` is positioned *beneath* or *beside* the React sidebar.

---

## 2. AI Execution Pipeline (`agent-core/pipeline.ts`)

The AI agent operates strictly on the backend via the following pipeline:

1. **Parse**: Uses `SemanticModelBuilder` (local heuristics + CDP) to extract an Accessibility Tree (AXTree) and filter it into a `SemanticPageModel` containing buttons, inputs, navigation links, and document references.
2. **Plan**: Calls the NVIDIA NIM API (`agent-core/llm-client.ts`) with the compacted DOM context and the user's intent to produce a `TaskPlan` (a JSON array of actions).
3. **Execute**: `executor.ts` iterates through the plan. Simple actions (scroll, extract) proceed immediately.
4. **Verify**: Destructive actions halt the pipeline and emit `agent:checkpoint-request` to the frontend, awaiting user approval (`agent:checkpoint-resolve`).

---

## 3. IPC Contract (Frontend ↔ Backend)

Backend handlers are registered in `apps/browser-shell/src/agent-core/ipc-handlers.ts`.
Frontend triggers these via `window.browser` and `window.electronAPI` in `preload.ts`.

### Key Verified IPC Channels
- `browser:state-update` (Push M→R): Sends `BrowserState` representing open tabs, active URL, loading status.
- `page:get-semantic-model` (Invoke R→M): Returns a parsed DOM object.
- `agent:run-task` (Invoke R→M): Kicks off the AI execution pipeline.
- `agent:task-progress` (Push M→R): Updates the UI with plan execution status.
- `agent:checkpoint-request` & `agent:checkpoint-resolve`: Manages the safety modal.
- `extract:page-data`: Exports DOM data to JSON or CSV locally.

*Note: Some channels like `tabs:get-groups` are stubbed and return empty arrays in the backend.*

---

## 4. Persistence (`db/db.ts` & `shared/schema.sql`)

Persistence is handled synchronously in the main process using `better-sqlite3`.
The database (`user-data/ai-browser.db`) has the following structure:
- **`user_profile`**: Stores user identity and address details for auto-filling.
- **`domain_memory`**: Tracks interactions and specific preferences per domain.
- **`workflow_recordings`**: Saves recorded multi-step agent actions.

*Note: The actual `schema.sql` file includes `task_history` and `tab_groups`, but the fallback string in `db.ts` does not. The `task_history` is being written to `domain_memory` as a JSON array instead.*

---

## 5. Known Implementation Realities vs. Stale Plans

- **LLM Provider**: Old specs claim Anthropic Claude is the primary LLM. **FALSE**. The code uses the NVIDIA NIM API (`https://integrate.api.nvidia.com/v1/chat/completions`) relying on `NIM_API_KEY` (or fallback).
- **Database Engine**: The app uses `better-sqlite3`, not asynchronous ORMs or flat files.
- **Mock Mode**: A robust fallback mode exists via the `MOCK_LLM=true` environment variable to test pipelines without API costs.

---

**Next Steps**: If you are tasked with modifying this codebase, begin by identifying which side of the IPC boundary your change belongs to. State originates in the Backend (`apps/browser-shell`), and the Frontend (`apps/frontend`) is purely a reflection of that state plus user intent.

---

## 6. Native Hybrid Protocol Architecture (GABA New Tab)
*Updated: 2026-08-08T23:20:00*

The application supports a custom `gaba://` protocol registered in Electron (`main.ts`).
The GABA New Tab (`gaba://newtab`) is implemented as a Native Hybrid:
- It is NOT a web page loaded over HTTP.
- It is NOT a translucent overlay over the Chromium PageView.
- It is a dedicated 4th native Chromium `WebContentsView` (`newTabView` in `BrowserRuntime.ts`) which specifically renders the React `StartPage.tsx` component.
- When the state URL is `gaba://newtab`, `WindowManager.ts` positions `newTabView` exactly over the content area, and explicitly moves the `chromeView` PageView off-screen to `-9999`.
- When navigating to a normal web URL, `newTabView` is moved off-screen, and PageView takes over.
- This fully integrates with the Electron navigation stack, meaning standard Back/Forward browser history accurately captures New Tab interactions.
