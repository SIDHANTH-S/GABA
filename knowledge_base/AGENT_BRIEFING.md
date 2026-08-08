# AI Agent Briefing Document

**Project:** AI-Native Execution Browser MVP  
**For:** AI coding agents implementing this system  
**Status:** Complete specification, ready for implementation

## What You're Building

An Electron desktop app that interprets natural language commands and executes them as web interactions. Not a chatbot—a browser automation layer that understands pages semantically and acts on them.

**Key concept:** User speaks, AI parses the page + plans steps, browser executes, user confirms before anything destructive.

## Start Here (Reading Order)

### 1. Understand the System (15 minutes)
- [architecture/README.md](./architecture/README.md) — System design, component map
- [architecture/tech-stack.md](./architecture/tech-stack.md) — Why Electron, why semantic parsing

### 2. Read the Full Spec (1 hour)
- [specs/mvp-spec.md](./specs/mvp-spec.md) — **Primary reference.** File-by-file implementation spec with TypeScript interfaces, CDP patterns, IPC channel registry. This is your source of truth.

### 3. Feature Checklist (30 minutes)
- [specs/feature-matrix.md](./specs/feature-matrix.md) — Which files implement which features, acceptance criteria

### 4. Understand Data Flow (20 minutes)
- [specs/mvp-spec.md](./specs/mvp-spec.md) §4 — Data models (read `shared/types.ts` interfaces first)
- [specs/mvp-spec.md](./specs/mvp-spec.md) §5 — Agent pipeline (Intent → Parse → Plan → Execute → Verify)

## Critical Rules (Read Before Coding)

From [architecture/risks-and-constraints.md](./architecture/risks-and-constraints.md):

### Must NOT
- ❌ Send raw HTML to LLM (use SemanticPageModel instead)
- ❌ Use synchronous IPC (`sendSync` is forbidden)
- ❌ Modify DOM via `innerHTML` (use CDP for all page interactions)
- ❌ Create abstractions not explicitly requested
- ❌ Add dependencies without checking tech-stack.md

### Must ALWAYS
- ✅ Use `shared/types.ts` as single source of truth for interfaces
- ✅ Define IPC channel names in `shared/constants.ts`
- ✅ Redact PII before LLM calls (via `llm-client.ts:redactPII`)
- ✅ Gate destructive actions with checkpoint modal (Promise-based, not fire-and-forget)
- ✅ Re-attach CDP session on navigation (`did-navigate` event)

### Semantic Parser Rules
- Zero API calls (local heuristics + regex only)
- Parses accessibility tree, not raw HTML
- Output: `SemanticPageModel` JSON structure
- Token budget: <1500 tokens (vs 50k+ for raw HTML)

## Implementation Order (Bottom-Up)

1. **shared/** — types, constants, schema, utils (foundation)
2. **electron-main/db.ts** — SQLite init + schema.sql migration
3. **electron-main/cdp-bridge.ts** — CDP session wrapper (all page interaction goes through this)
4. **semantic-parser/** — All 8 modules (dom-extractor → semantic-model-builder)
5. **agent-core/** — pipeline.ts → planner.ts → executor.ts → verifier.ts
6. **electron-main/ipc-handlers.ts** — Register all 15 IPC channels
7. **renderer/** — React UI (sidebar, command bar, HUD, checkpoint modal)

Test the semantic parser independently before building the full app:
```bash
npm run test-parser -- https://example.com
```

## Key Files (Must Read Before Starting)

| File | Why Critical |
|------|-------------|
| `shared/types.ts` | Every data structure in the system |
| `shared/constants.ts` | IPC channel names, regex patterns |
| `shared/schema.sql` | Database schema (3 tables: user_profile, domain_memory, workflows) |
| `electron-main/cdp-bridge.ts` | All CDP operations (click, fill, navigate, extract AX tree) |
| `agent-core/pipeline.ts` | Orchestrator—this is the top-level entry point for tasks |
| `semantic-parser/semantic-model-builder.ts` | Assembles final SemanticPageModel from all parsers |
| `renderer/App.tsx` | Root component, initializes IPC subscriptions |

## Design Reference

Visual specs in [architecture/design-system.md](./architecture/design-system.md):
- Color palette (dark theme, indigo accent)
- Typography (SF Mono for code, Inter for UI)
- Component dimensions (sidebar 320px, HUD 280px)
- Motion timing (200ms standard, cubic-bezier easing)

## API Integration

Primary: Anthropic Claude (see [api/README.md](./api/README.md))
- Used only for task planning, not page parsing
- Requires `ANTHROPIC_API_KEY` in `.env`
- Alternative: mock LLM mode for testing (`MOCK_LLM=true`)

Reference implementations (testing only):
- [api/deepseek-integration.md](./api/deepseek-integration.md)
- [api/qwen-integration.md](./api/qwen-integration.md)

## Common Pitfalls

### CDP Session Drops After Navigation
**Fix:** Register `did-navigate` listener and re-attach session automatically.  
**Location:** `electron-main/cdp-bridge.ts`

### Sidebar BrowserView Mispositioned
**Fix:** Call `setBounds()` on window `resize` event. BrowserView doesn't auto-reflow.  
**Location:** `electron-main/window-manager.ts`

### SQLite `SQLITE_BUSY` Errors
**Fix:** Enable WAL mode: `db.pragma('journal_mode = WAL')`.  
**Location:** `electron-main/db.ts`

### Checkpoint Modal Not Blocking
**Fix:** Checkpoint must be a Promise that executor awaits, not a one-way IPC event.  
**Location:** `agent-core/verifier.ts` + `renderer/components/Checkpoint/CheckpointModal.tsx`

### TypeScript Strict Mode Complaints
**Fix:** Use Zod for runtime validation of IPC payloads and LLM responses.  
**Location:** Wherever external data enters the system (IPC handlers, LLM client)

## Testing

No test framework required for MVP. Use:
1. **Semantic parser CLI:** `npm run test-parser -- <url>`
2. **Manual smoke tests:** [dev/testing.md](./dev/testing.md) — checklist of 10 features
3. **Self-checks:** Inline assertions in key modules (run with `NODE_ENV=test`)

## Demo Environment

All demos use **local mock pages** (not real websites):
- Mock server: `npm run mock-server`
- Pages: `/form`, `/products`, `/booking`
- Seed data: `npm run seed-memory`

Demo script in [dev/demo-script.md](./dev/demo-script.md).

## Quick Reference: IPC Channels

All 15 channels from [specs/mvp-spec.md](./specs/mvp-spec.md) §3.4:

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `page:get-semantic-model` | R→M | void | `SemanticPageModel` |
| `page:subscribe-updates` | M→R (push) | `SemanticPageModel` | — |
| `agent:run-task` | R→M | `{ intent: string }` | `TaskPlan` |
| `agent:task-progress` | M→R (push) | `TaskPlanUpdate` | — |
| `agent:checkpoint-request` | M→R (push) | `CheckpointPayload` | — |
| `agent:checkpoint-resolve` | R→M | `{ approved: boolean }` | void |
| `memory:get-profile` | R→M | void | `UserProfile` |
| `memory:get-domain` | R→M | `{ domain: string }` | `DomainMemory` |
| `memory:set-profile` | R→M | `Partial<UserProfile>` | void |
| `workflow:start-recording` | R→M | void | void |
| `workflow:stop-recording` | R→M | `{ name: string }` | `WorkflowRecording` |
| `workflow:replay` | R→M | `{ id: string }` | `TaskPlan` |
| `workflow:list` | R→M | void | `WorkflowRecording[]` |
| `extract:page-data` | R→M | `{ format: 'json'\|'csv' }` | string |
| `tabs:get-groups` | R→M | void | `TabGroup[]` |

## Questions to Ask Before Starting

1. Have you read the complete [specs/mvp-spec.md](./specs/mvp-spec.md)?
2. Do you understand the agent pipeline (Parse → Plan → Execute → Verify)?
3. Have you located `shared/types.ts` and reviewed all interfaces?
4. Do you know where PII redaction happens (`llm-client.ts`)?
5. Do you know the difference between renderer and main process?

If you answered "no" to any of these, read those sections before writing code.

## Success Metrics (Jury Demo)

From [specs/feature-matrix.md](./specs/feature-matrix.md):

- ✅ Cmd+K → task completion in ≤15s
- ✅ Sidebar updates within 2s of page load
- ✅ Form autofill with ≥85% field accuracy
- ✅ Checkpoint modal fires before every submit/payment
- ✅ No LLM calls for page parsing (SemanticPageModel built locally)
- ✅ Valid JSON/CSV export from any page
- ✅ No visible lag in UI

## Where to Get Help

- Architecture questions: [architecture/README.md](./architecture/README.md)
- Implementation details: [specs/mvp-spec.md](./specs/mvp-spec.md)
- Setup issues: [dev/setup.md](./dev/setup.md)
- Feature behavior: [specs/feature-matrix.md](./specs/feature-matrix.md)
- Design specs: [architecture/design-system.md](./architecture/design-system.md)

---

**Ready to start?** Begin with [dev/setup.md](./dev/setup.md) to scaffold the project, then implement in the order listed above.
