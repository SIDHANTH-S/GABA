# Known Gaps & Technical Debt

This document catalogs the factual discrepancies, technical debt, and incomplete features identified during the August 2026 forensic audit of the repository.

*Rule: Do NOT attempt to "fix" these unless explicitly requested by the user. This document exists so AI agents are aware of the reality of the codebase.*

## 1. Architectural Inconsistencies

### `schema.sql` vs `db.ts` fallback
- **Symptom:** `shared/schema.sql` defines 5 tables, including `task_history` and `tab_groups`.
- **Reality:** If `schema.sql` is missing (due to build path resolution issues), `db.ts` falls back to a hardcoded string that only creates `user_profile`, `domain_memory`, and `workflow_recordings`.
- **Impact:** The code in `pipeline.ts` saves task history directly inside the `domain_memory` table (as a serialized JSON array) instead of using the dedicated `task_history` table.

### `window.browser` vs `window.electronAPI`
- **Symptom:** The `preload.ts` Context Bridge exposes two similar IPC API objects.
- **Reality:** Some React components use `window.browser.runAgentTask`, while others use `window.electronAPI.runTask`.
- **Impact:** Duplicate IPC channels exist in `ipc-handlers.ts` and `preload.ts` that do the exact same thing.

## 2. Scaffolded / Stubbed Features

These features have types and IPC channels defined, but no actual backend implementation:

- **Tab Grouping:** The `tabs:get-groups` and `tabs:group-by-intent` IPC handlers are explicitly marked as `// Tab operations (stub for MVP)` and hardcode a return value of `[]`.
- **Security Validation:** `webPreferences` in `main.ts` sets `nodeIntegration: false` and `contextIsolation: true`, but the `CDPSession` has broad access, and there are no explicit navigation filters limiting what URLs the AI can browse.

## 3. Stale / False Documentation

*Note: Much of the old documentation in `knowledge_base` was overwritten during the audit to fix these, but they are noted here for historical context.*

- **LLM Provider:** Old architecture docs heavily referenced Anthropic Claude and provided DeepSeek/Qwen reference implementations. The real codebase (`llm-client.ts`) actually uses NVIDIA NIM APIs and strict PII redaction.
- **Dependency Claims:** Prior chat history suggested complex native module dependencies. The actual native dependency is just `better-sqlite3`, which requires specific `electron-builder` compilation steps.

## 4. Potential Bugs / Risks

- **Memory Layout:** The `domain_memory` table stores `last_visited` and `preferences`. Because it merges preferences indiscriminately across the "general" domain and specific domains, AI execution might inject a global preference unexpectedly on a local form.
- **CDP Session Drops:** If an AI agent commands a navigation, the `WebContentsView` unloads the page. The `cdp-bridge.ts` must successfully maintain or re-attach the session; otherwise, subsequent actions in the `TaskPlan` will silently fail or hang.
