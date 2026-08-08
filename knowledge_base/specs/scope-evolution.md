REVISED MVP SCOPE: 
We are NOT building full purchase automation. 

The system performs: 
1. Natural language search interpretation
2. Intelligent result selection from search/listing pages  
3. Navigation to exact product page
4. Optional page priming (select variant, set quantity)
5. Explicit handoff to human for completion

Generate updated MVP specification with these 8 features:
1. Natural Language Search (Cmd+K)
2. Smart Result Selection
3. Deep Navigation to Product Page
4. Page State Priming (best-effort interactions)
5. Human Handoff Indicator
6. Context Preservation in Sidebar
7. Fallback Search Navigation
8. Mock E-Commerce Sandbox

For each feature specify files, integration points, and demo scenario.

Update TECH_DECISIONS.md rules to reflect:
- No checkout/payment automation
- No multi-step transactional workflows
- Priming is optional/best-effort only
- Handoff is always explicit
- Mock sandbox is primary demo environment

Regenerate file structure, data models, and implementation plan accordingly.
User: Cmd+K → "Buy Sony WH-1000XM5 headphones under ₹25,000"

↓ Browser shows: "Searching for Sony WH-1000XM5 < ₹25,000..."
↓ Browser navigates to mock/search?q=sony+wh1000xm5&max=25000
↓ AI scans results → selects "Sony WH-1000XM5 - ₹24,990 - Amazon"
↓ Browser navigates to /product/sony-wh1000xm5-black
↓ AI detects size selector → clicks "One Size"
↓ AI detects quantity → sets to "1"
↓ Sidebar shows: ✅ Product page ready
↓ Sidebar shows: ⚠️ Complete payment manually
↓ User takes over from here
## Search + Prime Engine Rules

### Intent Parsing
- Extract: product name, price constraint, preferred retailer (optional)
- Output structured query: {product, maxPrice, retailer?}

### Navigation Strategy
1. Try direct product URL pattern first (if known retailer)
2. Fallback: search URL with filters applied
3. Final fallback: generic search with query string

### Page Priming (Optional, Best-Effort)
- Only interact if element is confidently identified
- Supported actions: click radio/select, set quantity input
- NEVER auto-add-to-cart or proceed-to-checkout
- If priming fails, still show page as "ready"

### Handoff Protocol
- Always display explicit handoff state in sidebar
- Preserve original search intent in memory
- Show what was automated vs what remains manual
UPDATE TO MVP SCOPE:
The MVP now includes transactional workflow support (e.g., product booking). 

Add these 12 finalized features to the specification:
1. Semantic Page Parser
2. Intent Command Bar (Cmd+K)
3. Smart Form Autofill
4. Multi-Step Workflow Engine
5. Product/Service Selector
6. Human Confirmation Gate
7. Live Task Progress HUD
8. Contextual Memory Store
9. Universal Data Extractor
10. Error Recovery & Retry
11. Workflow Recorder (Watch Mode)
12. Mock Booking Sandbox (local test site)

For each feature, specify:
- Exact files implementing it
- How it integrates with the core Parse→Plan→Execute engine
- Demo scenario using the mock sandbox
- Acceptance criteria for MVP completion

Prioritize features that enable the booking demo flow:
Search → Select → Fill → Confirm → Done

Update file structure, data models, and agent pipeline accordingly.
## Workflow Engine Rules
- Workflows are defined as JSON state machines, not hardcoded scripts
- Each step has: trigger condition, action, success validator, fallback
- Page navigation resets DOM parser but preserves workflow state
- Workflow state persisted in memory store between page loads

## Product Selection Rules
- List extraction always returns structured array: [{title, price, rating, link, selector}]
- Filtering/sorting happens in JS after extraction, never via LLM
- Click targets use stable selectors (data-testid > aria-label > text content)

## Mock Sandbox Requirements
- Served locally via Electron protocol or Vite dev server
- Mimics real-world patterns: search results, detail pages, forms, confirmations
- Includes intentional edge cases: modal popups, slow loading, validation errors
- Fully self-contained; no external network calls