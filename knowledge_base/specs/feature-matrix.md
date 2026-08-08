# Feature Matrix

This matrix documents the verified, implemented capabilities of the AI-Native Execution Browser based on the forensic audit.

**Legend:**
- ✅ **Implemented:** Fully functional and present in the codebase.
- 🟡 **Partial:** Exists, but relies on fallbacks or is incomplete.
- 🔵 **Scaffolded:** UI or IPC exists, but backend logic is stubbed.
- ❌ **Not Implemented:** Does not exist in the current codebase.

## 1. Browser Core
| Feature | Status | Notes |
|---------|--------|-------|
| Native Chromium Rendering | ✅ | Implemented via `WebContentsView` beneath React overlay. |
| Basic Navigation (Back, Fwd, Reload) | ✅ | Functional via IPC `browser:navigate`, `browser:goBack`, etc. |
| Multi-Tab Management | ✅ | Supported via `TabManager.ts`. UI can switch between them. |
| Tab Groups | 🔵 | IPC channels `tabs:get-groups` exist but return empty arrays. |
| History / Downloads | 🟡 | `DownloadManager` and `HistoryManager` exist in runtime, but integration is partial. |

## 2. AI Parsing & DOM Understanding
| Feature | Status | Notes |
|---------|--------|-------|
| DOM Extraction (No LLM) | ✅ | Accessibility tree parsed locally via heuristics (`semantic-model-builder.ts`). |
| Data Extraction (JSON/CSV) | ✅ | Implemented. Outputs files to the OS Downloads folder (`executor.ts`). |
| Intent Classification | ✅ | `page-classifier.ts` categorizes pages locally (e.g., login, checkout). |
| DOM Mutation | ❌ | Banned by design. AI does not modify the DOM directly. |

## 3. AI Execution Pipeline
| Feature | Status | Notes |
|---------|--------|-------|
| Natural Language Commands | ✅ | Parses intent via Command Bar → `llm-client.ts`. |
| NVIDIA NIM Integration | ✅ | Primary LLM provider for task planning (`integrate.api.nvidia.com`). |
| Mock LLM Mode | ✅ | Fast local fallback for testing (`MOCK_LLM=true`). |
| CDP Event Emulation | ✅ | Uses Chrome DevTools Protocol to simulate real clicks and keystrokes. |
| PII Redaction | ✅ | Redacts SSN, CC, emails before sending context to LLM (`utils.ts`). |
| Destructive Action Guard | ✅ | Safely pauses pipeline for user confirmation on forms/payments. |

## 4. UI / Workspace
| Feature | Status | Notes |
|---------|--------|-------|
| HUD (Heads Up Display) | ✅ | Renders active step and plan progress pushed from backend. |
| React Overlay Architecture | ✅ | Fully working transparent window configuration over native views. |
| Settings / User Profile UI | 🟡 | Profile schema exists in SQLite, but UI forms may be incomplete. |
| Micro-animations | ✅ | Transition logic and framer-motion used in HUD/Command Bar. |

## 5. Persistence
| Feature | Status | Notes |
|---------|--------|-------|
| SQLite Storage (WAL Mode) | ✅ | Native persistence implemented via `better-sqlite3`. |
| User Profile Auto-seed | ✅ | Mock data seeded automatically on first run (`db.ts`). |
| Form Input Memory | ✅ | Cross-references past inputs for auto-filling (`planner.ts`). |
| Workflow Recording | 🟡 | Schema exists (`workflow_recordings`), but full UI recording flow is unverified. |
