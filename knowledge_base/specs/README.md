# Implementation Specifications

## Documents

### [mvp-spec.md](./mvp-spec.md) — Primary Reference
The complete, prescriptive technical specification intended as direct handoff to AI coding agents.

**Covers:**
- Full project file tree with every file's responsibility
- File-by-file spec: purpose, key exports, dependencies, pitfalls
- TypeScript interface definitions for all data models
- SQLite schema (DDL)
- Agent pipeline flow (Intent → Parse → Plan → Execute → Verify)
- IPC channel registry (all 15 channels)
- Component visual specs (CSS values, dimensions, animations)
- 10 MVP demo feature implementation plans
- Setup and run instructions

### [scope-evolution.md](./scope-evolution.md) — Design History
Tracks how the MVP scope changed. Important context for understanding why certain features were added or removed.

**Key scope decisions recorded:**
1. **Search + Prime mode** (earlier scope): System navigates and primes product pages, then hands off to human. No checkout automation.
2. **Full transactional mode** (final scope): Includes multi-step workflows including booking flows.

**Current scope is full transactional.** The earlier search-only phase was superseded.

### [feature-matrix.md](./feature-matrix.md)
Quick reference mapping each feature to its implementing files and demo scenario.

## Summary: What Gets Built

### Core Agent Pipeline
```
electron-main/ipc-handlers.ts   → receives Cmd+K intent from renderer
agent-core/pipeline.ts          → orchestrates full flow
semantic-parser/                → local DOM → SemanticPageModel
agent-core/planner.ts           → LLM → TaskPlan JSON
agent-core/executor.ts          → CDP actions from TaskPlan
agent-core/verifier.ts          → checkpoint gate for destructive steps
```

### Data Models (from shared/types.ts)
- `SemanticPageModel` — parsed page representation
- `TaskPlan` / `PlanStep` — LLM output, execution instructions
- `AgentAction` — single atomic CDP action
- `UserProfile` / `DomainMemory` — persistent memory
- `WorkflowRecording` — replayable task sequence

### IPC Architecture
All renderer↔main communication happens through typed channels defined in `shared/constants.ts`. Renderer uses `window.electronAPI.*` (injected via `preload.js`). No direct Node.js access from renderer.

## Acceptance Criteria (Jury Demo)

| Feature | Pass Condition |
|---------|----------------|
| Command execution | Cmd+K → task completion in ≤15s |
| Live page understanding | Sidebar updates within 2s of page load |
| Smart form fill | ≥85% field mapping accuracy |
| Workflow replay | Record → replay works end-to-end |
| Verification checkpoint | Modal fires before every submit/payment |
| No LLM for parsing | SemanticPageModel built with zero API calls |
| Data extraction | Any table/list exports valid JSON or CSV |
| Visual polish | No visible lag in sidebar re-renders |

## Implementation Priority

1. **Must have (demo blocks):**
   - Semantic parser (foundation for everything)
   - CDP bridge (all actions go through this)
   - CommandBar + basic task execution
   - Checkpoint modal (safety feature)

2. **High value (visible in demo):**
   - Live sidebar with entity panel
   - HUD progress display
   - Form autofill

3. **Nice to have (time permitting):**
   - Workflow recorder/replay
   - Tab grouping
   - Document action hub

## Reading Order for Agents

1. Read [architecture/README.md](../architecture/README.md) — understand the system
2. Read [specs/mvp-spec.md](./mvp-spec.md) §2 — file structure overview
3. Read `shared/types.ts` spec (§4 of mvp-spec) — understand data models first
4. Implement in this order:
   - `shared/` (types, constants, utils, schema)
   - `electron-main/db.ts` + `electron-main/cdp-bridge.ts` (foundation)
   - `semantic-parser/` (all local, testable in isolation)
   - `agent-core/` (pipeline, planner, executor, verifier)
   - `renderer/` (UI layer)
