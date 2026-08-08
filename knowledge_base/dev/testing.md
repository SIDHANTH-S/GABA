# Testing Guide

## Testing Strategy

Most testing is done via CLI scripts and manual verification against mock pages. No test framework required for MVP.

## 1. Semantic Parser CLI (Most Used)

Test the parser on any live or local URL without running the full app:

```bash
# Test on a real website
npm run test-parser -- https://amazon.com/dp/B09XS7JWHH

# Test on local mock page
npm run test-parser -- http://localhost:3001/products
```

**Source:** `scripts/test-parser.ts`

**Expected Output:**
```json
{
  "url": "https://...",
  "title": "Sony WH-1000XM5",
  "pageIntent": "product",
  "entities": [
    { "type": "price", "value": "$279.99" },
    { "type": "rating", "value": "4.7" },
    { "type": "brand", "value": "Sony" }
  ],
  "forms": [],
  "actions": [
    { "type": "button", "label": "Add to Cart", "selector": "#add-to-cart-button" },
    { "type": "button", "label": "Buy Now", "selector": "#buy-now-button" }
  ],
  "documents": []
}
```

## 2. Manual Smoke Test (Per Feature)

Before each demo, verify these manually:

### Command Bar (Feature #2)
```
1. Open app
2. Press Cmd+K (Windows: Ctrl+K)
3. ✅ Overlay appears with dimmed background
4. Type anything → press Enter
5. ✅ Task starts, HUD appears
6. Press Escape
7. ✅ Overlay closes
```

### Form Fill (Feature #1)
```
1. Navigate to http://localhost:3001/form
2. Cmd+K → "Fill out this form with my address"
3. ✅ Fields fill automatically
4. ✅ Checkpoint modal appears before submit
5. Click Cancel
6. ✅ Form not submitted
```

### Live Page Understanding (Feature #3)
```
1. Navigate to http://localhost:3001/products
2. ✅ Sidebar EntityPanel shows extracted prices/names
3. ✅ ActionPanel shows detected buttons
4. Navigate to http://localhost:3001/form
5. ✅ Sidebar updates within 2 seconds
6. ✅ Different entities/actions shown
```

### HUD Progress (Feature #4)
```
1. Cmd+K → "Find the cheapest item on this page"
2. ✅ HUD appears bottom-right
3. ✅ Step counter updates per action
4. ✅ Progress bar fills
5. ✅ Auto-dismisses 2s after completion
```

### Extraction (Feature #6)
```
1. Navigate to http://localhost:3001/products
2. Cmd+K → "Export this page as CSV"
3. ✅ Download dialog appears
4. Open downloaded .csv file
5. ✅ Contains product name, price, rating columns
6. ✅ Each product on its own row
```

## 3. Self-Check Scripts

Inline logic checks—not full tests, just sanity guards:

### Entity Detector Check

```typescript
// semantic-parser/entity-detector.ts
// ponytail: simple assert, fails if regex breaks
if (process.env.NODE_ENV === 'test') {
  const testResult = detectEntities(mockAXTree);
  console.assert(
    testResult.some(e => e.type === 'price' && e.value === '$299.99'),
    'entity-detector: price detection broken'
  );
  console.log('entity-detector: OK');
}
```

### Planner Schema Check

```typescript
// agent-core/planner.ts
// ponytail: validate LLM output shape before executor uses it
if (process.env.NODE_ENV === 'test') {
  const mockPlan = await planTask('fill this form', mockModel, null);
  console.assert(Array.isArray(mockPlan.steps), 'planner: steps must be array');
  console.assert(mockPlan.steps.length > 0, 'planner: empty plan');
  console.log('planner: OK');
}
```

Run with:
```bash
NODE_ENV=test node -r ts-node/register agent-core/planner.ts
```

## 4. IPC Channel Verification

Test all IPC channels are registered:

```bash
# From Electron DevTools console (renderer):
> await window.electronAPI.getSemanticModel()
# ✅ Should return SemanticPageModel or null

> await window.electronAPI.getUserProfile()
# ✅ Should return UserProfile object
```

Check these channels manually via DevTools → Console after app starts.

## 5. CDP Bridge Verification

Test CDP operations work:

```typescript
// Run in electron-main via a test IPC handler
const session = await attachCDP(win);
const tree = await getAccessibilityTree(session);
console.log('AX nodes:', tree.length); // Should be > 10 for most pages
```

## 6. Memory Persistence Test

Verify data survives app restart:

```
1. Cmd+K → "Remember that my preferred color is blue"
2. ✅ Sidebar MemoryPanel shows entry
3. Close app completely
4. Reopen app
5. Navigate to same domain
6. ✅ Sidebar still shows the saved preference
```

## 7. Checkpoint Gate Test

Critical for demo—must never be skippable:

```
1. On any form page
2. Cmd+K → "Submit this form"
3. ✅ Checkpoint modal MUST appear before submit
4. Do NOT click anything for 60 seconds
5. ✅ Modal auto-cancels (timeout behavior)
6. ✅ Form was NOT submitted
```

## 8. Performance Checks

Measure these manually:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Sidebar update after navigation | <2s | Chrome DevTools Performance tab |
| Cmd+K to task start | <100ms | DevTools → Timeline |
| SemanticPageModel generation | <200ms | `console.time()` in dom-extractor.ts |
| LLM response time | <5s | Log in llm-client.ts |
| Full task completion (10-step) | <15s | Stopwatch from Cmd+K |

## Mock Page Specifications

### `/mock/form`
- First name, last name, email, phone, address, city, state, zip, country
- Submit button (triggers checkpoint)
- Client-side validation (required fields)
- No actual form submission

### `/mock/products`
- 10 product cards: name, price, rating, "Add to Cart" button
- Filter sidebar (price range, category)
- Pagination controls
- Mix of prices for extraction testing

### `/mock/booking`
- Search form (destination, dates, guests)
- 5 hotel result cards
- Hotel detail page with room selection
- Booking form with confirmation modal
- Intentional edge case: "No availability" for one date range

All mock pages served by Vite from `renderer/public/mock/`.

## Known Test Gaps (MVP Acceptable)

- No automated E2E tests (Spectron/Playwright not set up)
- No unit test framework (Jest not installed)
- CDP edge cases only tested manually (network interruption, page crash)

These are acceptable for MVP demo. Add after initial launch.

## Regression Checklist (Before Demo)

Run this checklist 30 minutes before every demo:

```
[ ] npm run dev starts without errors
[ ] App opens correctly on target machine
[ ] Cmd+K opens CommandBar
[ ] Sidebar visible and tabs switch correctly
[ ] Mock pages load (http://localhost:3001/)
[ ] Seed memory has demo data (profile form fills correctly)
[ ] LLM API key is valid (test with simple "fill form" command)
[ ] HUD appears and disappears correctly
[ ] Checkpoint modal blocks before submit
[ ] CSV export produces valid file
```
