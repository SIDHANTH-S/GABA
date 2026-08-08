# Risks and Constraints

## Project Constraints (Non-Negotiable)

### Forbidden for MVP
- ❌ No Chromium fork (maintenance cost, distribution complexity)
- ❌ No Next.js as browser shell (wrong architecture for Electron)
- ❌ No screenshot-only automation (unreliable, expensive vision models)
- ❌ No browser extension as primary base (limited CDP access)
- ❌ No cloud-first architecture (privacy, latency)
- ❌ No checkout/payment automation (out of scope, legal risk)
- ❌ No raw HTML to LLM (token waste, PII exposure)

### Frozen Technical Decisions
These decisions are set and must not be changed for MVP:
- Electron + Vite + TypeScript + React
- Zustand for state
- SQLite (better-sqlite3) for storage
- CDP via Electron's built-in debugger API
- Anthropic Claude for LLM

See [tech-stack.md](./tech-stack.md) for full rationale.

## Technical Risks

### DOM Extraction Failures
**Risk:** CDP accessibility tree may be empty or incomplete on some pages.

**Mitigation:**
- Filter out `role: none` and `role: generic` before processing
- Fall back to `querySelectorAll` with semantic selectors if AX tree fails
- Never crash — return empty SemanticPageModel rather than throwing

### LLM Invalid Plans
**Risk:** Claude may return malformed JSON or invalid selectors.

**Mitigation:**
- Parse + validate with Zod schema before executor receives it
- On validation failure: display error in HUD, let user retry
- Executor validates each step before execution (not just at parse time)

### Electron CDP Instability
**Risk:** CDP session drops on navigation, extension conflicts, or sandbox violations.

**Mitigation:**
- Auto-reattach on `did-navigate` event
- Graceful error in executor: skip failed step, continue with next
- Log all CDP errors for debugging

### Native Module Build Issues
**Risk:** `better-sqlite3` is a native module requiring node-gyp compilation.

**Mitigation:**
- Document exact Node.js version in README
- Include prebuilt binaries for Windows/macOS in package
- Fallback: JSON file-based storage for MVP if SQLite build fails

## Demo Risks

### Real Websites Block Automation
**Risk:** Sites like Amazon detect and block CDP automation.

**Mitigation:** Use local mock pages (`localhost:3001`) for all jury demos. Never demo on live sites.

### Network Failure During Presentation
**Risk:** Anthropic API unreachable.

**Mitigation:** 
- `MOCK_LLM=true` environment flag bypasses API with canned responses
- Demo script only needs 2-3 LLM calls; demonstrate offline-capable parsing

### API Rate Limits
**Risk:** Hit Claude's 50 req/min limit during live demo.

**Mitigation:** Pre-warm key before demo. Keep demo to <10 commands.

### Selector Mismatch on Mock Pages
**Risk:** LLM generates selector that doesn't match current mock page DOM.

**Mitigation:** 
- Mock pages use stable `data-testid` attributes on all interactive elements
- Executor re-resolves selectors at runtime (not baked into plan)

## Non-Goals (Explicit Out of Scope)

These are NOT bugs if they don't work in the MVP:

- Multi-monitor setups
- Accessibility mode / screen reader compatibility for the browser UI itself
- Real authentication flows (logins, OAuth)
- Real payment or transaction processing
- Mobile / responsive behavior
- Internationalization beyond English
- Browser extensions compatibility
- Custom user themes

## Known Technical Ceilings

`ponytail:` comments in the codebase mark these:

| Location | Ceiling | Upgrade Path |
|----------|---------|--------------|
| `entity-detector.ts` | Regex-only matching, no ML | Train lightweight NER model |
| `page-classifier.ts` | URL + DOM heuristics | Lightweight intent classifier |
| `tab-manager.ts` | O(n) scan for grouping | Embed vectors, cluster by similarity |
| `memory-manager.ts` | Full table scan for domain lookup | Add index on `domain` column (already in schema) |
| `executor.ts` | Single retry with backoff | Add screenshot-diff verification per step |

## Coding Rules

### General
- Prefer small, working increments (no big-bang rewrites)
- Do not create huge monolithic files (>300 lines = split it)
- Do not add unnecessary dependencies
- Always preserve existing file structure
- When uncertain about scope, ask before refactoring

### When Editing Files
- Read the full file before making changes
- Check all callers of a function before changing its signature
- One guard at the shared function > one guard per caller
- Delete dead code rather than commenting it out

### On Complexity
- Question complex requests: "Do you actually need X, or does Y cover it?"
- No abstractions unless explicitly requested
- Boring > clever when both have same diff size
