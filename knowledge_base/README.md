# AI Browser - Knowledge Base

This `knowledge_base` is the **canonical documentation layer** for the AI-Native Execution Browser repository. 

It was completely rebuilt during a rigorous forensic audit to ensure it strictly reflects the **CURRENT IMPLEMENTATION** of the codebase, explicitly removing any hallucinations, stale plans, or unfulfilled architecture claims from earlier documentation.

---

## ⚠️ Source-of-Truth Hierarchy

When AI agents or engineers need to determine how this application works, you must consult sources in the following strict order of priority:

1. **Current Code** (The Ultimate Source of Truth) - What is actually running in `apps/browser-shell` and `apps/frontend`.
2. **This Knowledge Base** (The Secondary Source) - Reconstructed from the code itself.
3. **Old Plans & Conversation History** (Untrusted) - Do NOT rely on prior conversation claims, original MVP specs, or deprecated AI models (e.g., Anthropic Claude mentions in old chats).

---

## Documentation Structure

- **[`AGENT_BRIEFING.md`](./AGENT_BRIEFING.md)**
  **Start here.** The master quick-start guide for future AI agents, covering state ownership, IPC, entry points, and strict contribution rules.
  
- **[`architecture/`](./architecture/)**
  Detailed architecture maps reflecting the true process model, state ownership, IPC contracts, and security posture.
  
- **[`api/`](./api/)**
  Documents the current actual AI integrations (NVIDIA NIM) and notes on legacy or deprecated reference integrations.
  
- **[`codebase/`](./codebase/)**
  Precise repository maps, module catalogs, and known technical debt/gaps discovered during the forensic audit.
  
- **[`dev/`](./dev/)**
  Guides for setting up the environment, running the application, and troubleshooting.
  
- **[`specs/`](./specs/)**
  The factual feature matrix of what is actually implemented, scaffolded, or planned.

---

## How to use this Knowledge Base

**For AI Agents:**
Read `AGENT_BRIEFING.md` in its entirety before modifying the codebase. If you are modifying a specific system (e.g., the state store), read `architecture/state-ownership.md` first. Do NOT invent APIs or write code based on how you *think* it should work. Trace the current IPC and runtime models.

**How to Update:**
If you make a major architectural change (e.g., swapping the SQLite database for a different engine, or migrating the LLM provider), you MUST update the corresponding documentation in this directory. Do not leave the knowledge base in a stale state.

---

## Audit Reconciliation Record (August 2026)

The original knowledge base contained several discrepancies between what was planned/documented and what was actually implemented. The following reconciliations were made:

- **[OUTDATED] LLM Provider**: Old documentation claimed the system used Anthropic Claude via `@anthropic-ai/sdk`. **Reality**: The system uses the NVIDIA NIM API (`https://integrate.api.nvidia.com/v1/chat/completions`) via direct HTTP fetch. The docs have been updated.
- **[PARTIAL] SQLite Schema**: The documentation and `schema.sql` defined `task_history` and `tab_groups` tables. **Reality**: The `initDB()` fallback schema omitted these, and `taskHistory` is actually stored as a JSON array inside the `domain_memory` table. The docs have been updated to reflect this inconsistency.
- **[SCAFFOLDED] Tab Management**: IPC handlers for advanced tab management (`TABS_GET_GROUPS`, `TABS_GROUP_BY_INTENT`) are currently stubbed and return empty arrays.
- **[CURRENT] State Model**: The frontend React app does not mutate browser state. It acts strictly as a view layer and mirror for state pushed from the Electron Main Process via IPC.

*See `codebase/known-gaps.md` for a complete list of technical debt and unverified areas.*
