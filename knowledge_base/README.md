# AI-Native Execution Browser - Knowledge Base

**Project Type:** Electron-based AI-powered browser automation system  
**Target:** MVP demonstration for jury evaluation  
**Last Updated:** 2026-08-07

## Quick Navigation

- [Architecture Overview](./architecture/README.md)
- [Implementation Specs](./specs/README.md)
- [API Integration](./api/README.md)
- [Development Guide](./dev/README.md)

## What This Project Does

An Electron desktop app that wraps Chromium with an AI agent layer. Users issue natural language commands (Cmd+K) that convert into deterministic web interactions—clicking, filling, extracting, navigating—without manual effort.

**Key Principles:**
- Execution over conversation (progress bars, not chat)
- Semantic parsing over visual (accessibility tree, not screenshots)
- Local-first AI (no cloud dependency for core parsing)
- Privacy-first (PII redacted before LLM calls)
- Non-destructive UI (never obscure webpage content)

## Project Structure

```
knowledge_base/
├── README.md                    # This file
├── architecture/                # System design & technical decisions
│   ├── README.md
│   ├── core-architecture.md
│   └── tech-stack.md
├── specs/                       # Detailed implementation specifications
│   ├── README.md
│   ├── mvp-spec.md              # Complete MVP technical spec
│   ├── scope-evolution.md       # Extended scope changes
│   └── feature-matrix.md
├── api/                         # AI service integration
│   ├── README.md
│   ├── deepseek-integration.md
│   └── qwen-integration.md
└── dev/                         # Development guides
    ├── README.md
    ├── setup.md
    └── testing.md
```

## Core Features (10 MVP Demo Points)

1. **Smart Form Filler** - Auto-maps user profile to any form
2. **Intent Command Bar** - Cmd+K for natural language tasks
3. **Live Page Understanding** - Real-time entity/action extraction
4. **Task Progress HUD** - Minimal execution status overlay
5. **Contextual Memory** - Per-domain input/preference recall
6. **Universal Extractor** - Save any page as JSON/CSV
7. **Workflow Recorder** - Record once, replay automation
8. **Smart Tab Grouping** - Auto-organize by intent
9. **Document Action Hub** - PDF/bill detection with actions
10. **Verification Checkpoint** - User confirmation before destructive actions

## Technology Stack

- **Runtime:** Electron (Chromium + Node.js)
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Linear/Apple aesthetic)
- **State:** Zustand
- **Storage:** SQLite (better-sqlite3)
- **Page Control:** CDP (Chrome DevTools Protocol)
- **AI:** Anthropic Claude (via SDK)

## Getting Started

See [Development Guide](./dev/README.md) for setup instructions.

## Documentation Status

| Document | Status | Location |
|----------|--------|----------|
| MVP Technical Spec | ✅ Complete | `specs/mvp-spec.md` |
| Architecture Design | ✅ Complete | `architecture/` |
| API Integration Guides | ✅ Complete | `api/` |
| Setup Instructions | ✅ Complete | `dev/setup.md` |
| Scope Evolution Log | ✅ Complete | `specs/scope-evolution.md` |
