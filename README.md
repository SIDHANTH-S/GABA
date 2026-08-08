# AI-Native Execution Browser MVP

An intelligent browser that understands web pages semantically and executes multi-step tasks autonomously with human-in-the-loop checkpoints.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- NVIDIA NIM API key ([Get one here](https://build.nvidia.com/))

### Setup (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure API key
cp .env.example .env
# Edit .env and add your NIM_API_KEY=nvapi-xxxxx

# 3. Initialize database and seed demo data
npm run seed-memory

# 4. Launch the app
npm run dev:electron
```

## Architecture

- **Electron Main**: Window management, CDP bridge, database, IPC handlers
- **Semantic Parser**: Local AX tree → JSON conversion (zero API calls)
- **Agent Core**: LLM-powered task planning, execution, verification (via NVIDIA NIM)
- **Renderer**: React UI with HUD, CommandBar, Sidebar (glassmorphism design)

## Key Features

1. **Semantic Parsing** - Extracts entities, actions, documents from accessibility tree
2. **Multi-Step Execution** - Decomposes tasks into atomic steps with automatic retry
3. **Checkpoint Gates** - Promise-based approval for destructive actions
4. **Memory System** - Profile + key-value store for context across sessions
5. **Workflow Recording** - Capture and replay user workflows

## Demo Flow (8 minutes)

### Part 1: Semantic Understanding (2 min)
1. Open sidebar (`Cmd+Shift+S`)
2. Navigate to any form page (e.g., booking site)
3. **Show**: Real-time entity detection (phone, email, prices)
4. **Show**: Discovered actions with confidence scores
5. **Show**: Page classification (e.g., "transactional_form")

### Part 2: Task Execution (3 min)
1. Press `Cmd+K` to open command bar
2. Type: "Fill out the booking form for a flight to NYC next Friday"
3. **Show**: HUD appears with step-by-step progress
4. **Show**: Agent decomposes task into 5-7 steps
5. **Show**: Real-time execution with 100ms debounce between steps
6. **Show**: Checkpoint modal appears before "Submit" (destructive action)
7. Approve checkpoint → task completes

### Part 3: Memory System (2 min)
1. Open Memory tab in sidebar
2. **Show**: 7 seeded memories (frequent flyer #, preferred seat, etc.)
3. Type command: "Book using my usual airline preferences"
4. **Show**: Agent reads from memory (UA frequent flyer #) and prefills forms
5. Add new memory manually: "window_seat" → "preferred"

### Part 4: Workflow Replay (1 min)
1. Complete a simple task (e.g., "Search for hotels in Paris")
2. **Show**: Workflow recorded to SQLite
3. Navigate to different page
4. Type: "Replay last workflow"
5. **Show**: Agent replays steps autonomously

## Testing

```bash
# Test semantic parser (no API calls)
npm run test:parser -- --url https://www.kayak.com

# Type check
npm run typecheck

# Full dev mode (main + renderer)
npm run dev
```

## File Structure

```
chat_complettion/
├── shared/              # Types, constants, schema (single source of truth)
├── semantic-parser/     # Local AX tree parsing (zero LLM)
├── agent-core/          # Task pipeline (planner, executor, verifier)
├── electron-main/       # Main process (CDP, IPC, DB, window mgmt)
├── renderer/            # React UI (HUD, CommandBar, Sidebar)
│   ├── components/
│   ├── hooks/
│   └── store/
├── scripts/             # CLI tools (test-parser, seed-memory)
└── knowledge_base/      # Documentation (specs, architecture, API refs)
```

## Technical Highlights

### Semantic Parser (Local, Fast)
- **Input**: CDP Accessibility tree (`~1KB JSON`)
- **Output**: `SemanticPageModel` with entities, actions, documents
- **Zero API calls** - all regex/heuristic rules
- **15 field type inference rules** (email, phone, credit card, etc.)

### Agent Pipeline
```
Intent → Parse → Plan → Execute → Verify
```
- **Planner**: Compact model from full page context → structured steps (zod validation)
- **Executor**: Retry logic (3 attempts), 100ms debounce, automatic screenshot on failure
- **Verifier**: Promise gates for destructive actions (submit, purchase, delete)

### Memory System
- **Profile**: Name, email, preferences
- **Memories**: Key-value pairs with source tracking (explicit, inferred, form_fill)
- **SQLite**: WAL mode, automatic migration, 100ms cache TTL

### PII Redaction
- Automatic before every LLM call in `llm-client.ts`
- Patterns: credit cards, SSNs, passwords, tokens
- Not caller's responsibility

## Known Limitations

1. **No multi-tab orchestration yet** - Single active tab only
2. **No document extraction** - PDFs detected but not parsed
3. **Simple risk model** - Only 3 levels (low/medium/high)
4. **No undo/rollback** - Checkpoint rejection stops task but doesn't revert
5. **Limited error recovery** - 3 retries then fail (no fallback strategies)

## Spec Gaps Filled

1. **IPC error handling**: Added try-catch + error channel broadcasts in `ipc-handlers.ts`
2. **Sidebar mount timing**: Sidebar attaches in `ready-to-show` event (not on `BrowserWindow` constructor)
3. **HUD injection script**: Created inline script string in `window-manager.ts` for CDP injection
4. **Memory cache invalidation**: Added 100ms TTL in `memory-manager.ts` to prevent stale reads
5. **Step retry state**: Added `attemptNumber` field to `ExecutionStep` type for retry tracking

## Next Steps (Post-MVP)

- [ ] Multi-tab workflows (orchestrate across 3+ tabs)
- [ ] Vision API for document extraction (PDF → structured data)
- [ ] Learning from corrections (user edits → update planner prompt)
- [ ] Workflow library (save/share/discover common patterns)
- [ ] Browser extension version (Chrome/Firefox)

## License

MIT

---

**Built with**: Electron, React, TypeScript, NVIDIA NIM (Qwen Coder), Zustand, Tailwind CSS, better-sqlite3
