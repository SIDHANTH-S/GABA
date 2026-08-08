# Feature Implementation Matrix

Quick reference: which files implement each MVP feature and how to demo it.

## 1. Smart Form Filler

**What:** Auto-maps user profile to any form via semantic field labels.

**Files:**
- `semantic-parser/form-analyzer.ts` — detects form fields, infers types
- `agent-core/memory-manager.ts` — retrieves UserProfile
- `agent-core/planner.ts` — maps profile fields to form inputs
- `agent-core/executor.ts` — fills via CDP `fillInput`

**Demo Flow:**
1. Navigate to mock form page (shipping address form)
2. Cmd+K → "Fill out this form with my address"
3. Sidebar shows detected form fields
4. Agent fills name, email, address, zip
5. Checkpoint modal appears before submit
6. User approves → form submitted

**Acceptance:** ≥85% field accuracy (8/10 fields correct)

---

## 2. Intent Command Bar

**What:** Cmd+K global hotkey triggers natural language command input.

**Files:**
- `electron-main/global-shortcuts.ts` — registers Cmd+K
- `renderer/components/CommandBar/CommandBar.tsx` — modal UI
- `renderer/components/CommandBar/SuggestionList.tsx` — context hints
- `electron-main/ipc-handlers.ts` — `agent:run-task` handler

**Demo Flow:**
1. Press Cmd+K from any page
2. CommandBar appears with dimmed overlay
3. Type "Find the cheapest flight to Paris"
4. Suggestion list shows context-aware hints
5. Press Enter → task starts

**Acceptance:** Modal appears in <100ms, accepts any text input

---

## 3. Live Page Understanding

**What:** Sidebar automatically shows extracted entities and actions whenever page loads.

**Files:**
- `semantic-parser/entity-detector.ts` — finds dates, prices, emails, etc.
- `semantic-parser/action-discoverer.ts` — finds clickable buttons/links
- `renderer/components/Sidebar/EntityPanel.tsx` — displays entities
- `renderer/components/Sidebar/ActionPanel.tsx` — displays actions

**Demo Flow:**
1. Navigate to e-commerce product page
2. Sidebar instantly updates (no user action)
3. EntityPanel shows: price ($299), rating (4.5★), brand (Sony)
4. ActionPanel shows: [Add to Cart] [Buy Now] [Save for Later]
5. Navigate to different page → sidebar updates again in <2s

**Acceptance:** Sidebar updates within 2s of page load, shows ≥3 entities

---

## 4. Task Progress HUD

**What:** Minimal bottom-right overlay showing step-by-step execution status.

**Files:**
- `renderer/components/HUD/HUD.tsx` — transparent overlay container
- `renderer/components/HUD/TaskProgress.tsx` — progress bar + label
- `renderer/components/HUD/StepBadge.tsx` — individual step status
- `renderer/store/agent-store.ts` — receives step updates via IPC

**Demo Flow:**
1. Cmd+K → "Book a hotel for next Friday"
2. HUD appears bottom-right with task name
3. Progress bar animates: "Searching hotels..." (Step 1/4)
4. Updates: "Selecting best match..." (Step 2/4)
5. Auto-dismisses 2s after completion

**Acceptance:** HUD visible during task, updates per step, auto-dismisses

---

## 5. Contextual Memory

**What:** Remembers past inputs and preferences per domain.

**Files:**
- `agent-core/memory-manager.ts` — CRUD operations on SQLite
- `electron-main/db.ts` — database schema
- `shared/schema.sql` — `domain_memory` table DDL
- `renderer/components/Sidebar/MemoryPanel.tsx` — displays saved data

**Demo Flow:**
1. Fill a form on amazon.com (save shipping address)
2. Navigate away, then return to amazon.com
3. Sidebar MemoryPanel shows: "Last used address: 123 Main St"
4. Cmd+K → "Use my usual address" → agent recalls saved data
5. Form auto-fills from memory

**Acceptance:** Data persists across sessions, correct domain isolation

---

## 6. Universal Extractor

**What:** Export any page as JSON or CSV.

**Files:**
- `agent-core/extractor.ts` — converts SemanticPageModel to formats
- `semantic-parser/semantic-model-builder.ts` — provides data
- `electron-main/ipc-handlers.ts` — `extract:page-data` channel

**Demo Flow:**
1. Navigate to product listing page (10 items)
2. Cmd+K → "Save this as CSV"
3. Agent extracts product name, price, rating per row
4. Downloads `products.csv` to user's Downloads folder
5. Open CSV → verify 10 rows with correct data

**Acceptance:** Valid CSV/JSON output, ≥90% data accuracy

---

## 7. Workflow Recorder

**What:** Watch user perform task once, then replay it automatically.

**Files:**
- `agent-core/workflow-recorder.ts` — intercepts CDP events
- `agent-core/workflow-replayer.ts` — executes recorded steps
- `electron-main/ipc-handlers.ts` — `workflow:*` channels
- `renderer/components/Sidebar/MemoryPanel.tsx` — start/stop controls

**Demo Flow:**
1. Click "Start Recording" in sidebar
2. Manually: navigate to site → fill form → click submit
3. Click "Stop Recording" → name it "Book demo flight"
4. Next session: Cmd+K → "Replay 'Book demo flight'"
5. Agent performs exact same actions automatically

**Acceptance:** Record→replay cycle works, handles navigation

---

## 8. Smart Tab Grouping

**What:** Auto-organizes tabs by detected intent.

**Files:**
- `electron-main/tab-manager.ts` — tracks tabs, clusters by intent
- `semantic-parser/tab-intent-classifier.ts` — assigns intent per tab
- `agent-core/planner.ts` — LLM generates group names

**Demo Flow:**
1. Open 8 tabs: 3 shopping, 3 travel, 2 docs
2. Cmd+K → "Group my tabs"
3. Agent clusters: "Shopping" (amazon, ebay, etsy), "Travel" (flights, hotels, car rental), "Docs" (2 PDFs)
4. Tabs visually grouped with colored borders
5. Click group name → all tabs in group highlighted

**Acceptance:** Correct clustering (≥80% accuracy), human-readable names

---

## 9. Document Action Hub

**What:** Detects PDFs/bills and offers Download/Summarize/File actions.

**Files:**
- `semantic-parser/document-detector.ts` — finds PDF links, invoice patterns
- `renderer/components/Sidebar/DocumentPanel.tsx` — shows actions
- `agent-core/executor.ts` — handles `download` action type

**Demo Flow:**
1. Navigate to utility bill page with PDF link
2. Sidebar DocumentPanel shows: "Invoice detected: electricity_bill.pdf"
3. Actions: [Download] [Save to folder] [Extract due date]
4. Click [Download] → PDF saves to ~/Downloads
5. Click [Extract due date] → sidebar shows "Due: Aug 15, 2026"

**Acceptance:** PDF detection, download works, data extraction correct

---

## 10. Verification Checkpoint

**What:** Blocks execution before submit/payment, requires user approval.

**Files:**
- `agent-core/verifier.ts` — detects destructive actions, gates execution
- `renderer/components/Checkpoint/CheckpointModal.tsx` — blocking modal
- `renderer/components/Checkpoint/ActionDiff.tsx` — shows before/after
- `electron-main/ipc-handlers.ts` — `agent:checkpoint-*` channels

**Demo Flow:**
1. Cmd+K → "Submit this job application"
2. Agent fills form fields automatically
3. Before clicking [Submit], checkpoint modal appears
4. Modal shows: "About to submit application with: name=John, email=john@example.com"
5. User clicks [Approve] → form submitted, or [Cancel] → task stops

**Acceptance:** Modal fires before every submit/payment, timeout after 60s

---

## Testing Strategy

### Unit Tests (Per Component)
- `semantic-parser/` — test with mock HTML fixtures
- `agent-core/planner.ts` — test with mock SemanticPageModel → validate TaskPlan JSON
- `agent-core/executor.ts` — test with mock CDP session

### Integration Tests
- Full pipeline: intent → TaskPlan → execution on local test page
- Memory persistence: write → restart app → read

### Manual Demo Script
Use `scripts/test-parser.ts` CLI to verify semantic parser on any URL:
```bash
npm run test-parser -- https://example.com
# Outputs: SemanticPageModel JSON
```

### Jury Demo Pages
Build 3 local mock pages (served via Vite):
1. `/mock/form` — shipping address form (tests feature #1, #10)
2. `/mock/products` — product listing (tests feature #3, #6)
3. `/mock/booking` — hotel booking flow (tests feature #4, #5, #7)

All pages include intentional edge cases (slow loading, validation errors).
