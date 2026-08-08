# Architecture Overview

## System Identity

**Not a chatbot. Not a search engine. An OS for web tasks.**

- User = Supervisor
- AI = Operator  
- Browser = Execution Environment
- Webpage is always hero, AI is invisible assistant

## High-Level Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Window       │  │ CDP Bridge   │  │ Agent Pipeline   │  │
│  │ Manager      │──│ (DevTools    │──│ Parse→Plan→      │  │
│  │              │  │  Protocol)   │  │ Execute→Verify   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                    │            │
│         │                  │                    │            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Tab Manager  │  │ Memory Store │  │ Workflow Engine  │  │
│  │              │  │ (SQLite)     │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    IPC Bridge (contextBridge)
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Electron Renderer Process                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application                        │   │
│  │                                                        │   │
│  │  ┌──────────┐ ┌─────────────┐ ┌──────────────────┐  │   │
│  │  │ Sidebar  │ │ CommandBar  │ │ HUD Overlay      │  │   │
│  │  │ (320px)  │ │ (Cmd+K)     │ │ (Progress)       │  │   │
│  │  └──────────┘ └─────────────┘ └──────────────────┘  │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Checkpoint Modal (Destructive Action Gate)      │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    Injected Scripts (HUD only)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Target Web Page                           │
│            (User-navigated URL in Chromium)                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Semantic Parser (Local, Zero API Calls)
- Extracts accessibility tree via CDP
- Detects entities (dates, prices, names, emails)
- Analyzes forms with type inference
- Classifies page intent (search, product, form, document)
- Discovers clickable actions with semantic labels
- **Output:** `SemanticPageModel` JSON structure

### 2. Agent Pipeline (Main Process)
**Flow:** Intent → Parse → Plan → Execute → Verify

```typescript
Intent (user command)
    ↓
SemanticPageModel (parsed page context)
    ↓
LLM Planner (Claude API)
    ↓
TaskPlan (JSON: steps with selectors)
    ↓
Executor (CDP actions)
    ↓
Verifier (checkpoint for destructive actions)
    ↓
Result + Memory Update
```

### 3. Memory System
- **UserProfile:** Name, email, address, payment prefs
- **DomainMemory:** Per-site preferences and past inputs
- **WorkflowRecordings:** Replayable automation sequences
- **Storage:** SQLite with WAL mode

### 4. UI Layer (Non-Blocking)
- **Sidebar:** Collapsible 320px panel (entities, actions, memory, documents)
- **CommandBar:** Cmd+K overlay for natural language input
- **HUD:** Transparent bottom-right progress display
- **Checkpoint Modal:** Blocking confirmation before destructive actions

## Data Flow Example

**User Command:** "Fill out this form with my shipping address"

1. **Parser** extracts form fields from accessibility tree
2. **Memory** retrieves user's saved shipping address
3. **Planner** (LLM) maps address fields to form inputs → generates TaskPlan
4. **Executor** fills each field via CDP `Input.dispatchKeyEvent`
5. **Verifier** detects submit button → triggers checkpoint modal
6. **User** approves/cancels → execution continues/stops

## Key Technical Decisions

See [Tech Stack](./tech-stack.md) for detailed rationale.

### Chosen
- ✅ Electron (native desktop, full CDP access)
- ✅ Semantic DOM parsing (accessibility tree + heuristics)
- ✅ Local-first memory (SQLite)
- ✅ Separate planner/executor (LLM plans, code executes)
- ✅ Checkpoint gates (user confirmation protocol)

### Rejected
- ❌ Browser extension (limited CDP, no native UI)
- ❌ Screenshot-only automation (unreliable, expensive)
- ❌ Raw HTML to LLM (token waste, PII exposure)
- ❌ Chromium fork (maintenance overhead)
- ❌ Cloud-first architecture (privacy concerns)

## File Organization

```
ai-browser/
├── electron-main/          # Node.js main process
├── renderer/               # React UI (sidebar, command bar, HUD)
├── agent-core/             # AI pipeline (plan, execute, verify)
├── semantic-parser/        # Local DOM→JSON conversion
├── shared/                 # Types, constants, utils (isomorphic)
└── scripts/                # Dev tools (test parser, seed DB)
```

## Security Model

1. **Context Isolation:** Renderer process sandboxed
2. **IPC Bridge:** All main↔renderer communication via typed channels
3. **PII Redaction:** Credit cards, SSNs, passwords stripped before LLM calls
4. **User Confirmation:** Destructive actions (submit, payment) gated by modal
5. **Local Execution:** DOM interactions via CDP, not remote control

## Next Steps

- [Complete MVP Specification](../specs/mvp-spec.md)
- [Development Setup](../dev/setup.md)
- [API Integration Guides](../api/README.md)
