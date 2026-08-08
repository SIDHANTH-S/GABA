# Jury Demo Script

## Demo Goal
Show that the app is **not a chatbot, but an execution environment**.

Key message: Browser does the work. User just describes what they want.

## Setup (30 Minutes Before)

1. Run full regression checklist (see [testing.md](./testing.md))
2. Start mock server: `npm run mock-server`
3. Seed demo memory: `npm run seed-memory`
4. Open app and pre-navigate to `http://localhost:3001/`
5. Close all other applications (minimize distractions)

## Demo Backup Plan

- If live API fails: enable mock LLM mode (`MOCK_LLM=true npm run dev`)
- If app crashes: have screen recording ready as fallback
- Avoid real websites (blocking, rate limits, layout changes)
- Do NOT demo with real logins or payment flows

## Primary Demo Flow (8 minutes)

### Scene 1: Page Understanding (1 min)
```
1. Open app at http://localhost:3001/products
2. Point to sidebar → "No typing needed. It already understands the page."
3. Show EntityPanel: extracted prices, product names, ratings
4. Show ActionPanel: detected [Add to Cart] [Buy Now] buttons
5. Navigate to /form page → sidebar updates automatically
```
**Tagline:** "The AI reads every page like an expert."

---

### Scene 2: Command Bar (1 min)
```
1. Press Cmd+K
2. Show the overlay appearing with blur effect
3. Type slowly: "Fill out this form using my profile"
4. Point at suggestion list below input
5. Press Enter
```
**Tagline:** "One command. The AI figures out the rest."

---

### Scene 3: Form Filling + HUD (2 min)
```
1. Watch fields fill automatically (name, email, address, zip...)
2. Point to HUD bottom-right: "Step 2/6: Filling address field"
3. Fields animate as they fill
4. Progress bar advances
```
**Tagline:** "Watch it work. Every step visible."

---

### Scene 4: Checkpoint (1.5 min)
```
1. Before form submit, checkpoint modal appears automatically
2. Point to red border: "Safety mechanism. Nothing submits without you."
3. Show ActionDiff: "About to submit: name=John Doe, email=demo@test.com"
4. Click [Approve & Continue]
5. Form submits. HUD shows "Complete ✓"
```
**Tagline:** "AI does the work. Human keeps control."

---

### Scene 5: Memory (1 min)
```
1. Navigate away and come back to /form
2. Cmd+K → "Use my usual address again"
3. Show fields filling instantly (no LLM call needed, uses memory)
4. Open MemoryPanel in sidebar: show saved data
```
**Tagline:** "It learns. Once is enough."

---

### Scene 6: Data Extraction (1.5 min)
```
1. Navigate to /products
2. Cmd+K → "Save this product list as CSV"
3. Download dialog appears (or auto-saves to Downloads)
4. Open CSV in spreadsheet: 10 products, clean columns
```
**Tagline:** "Any page. Any format. No copy-paste."

---

## Additional Features (If Time Permits)

### Workflow Recorder
```
1. Sidebar → click [Start Recording]
2. Manually fill out form
3. Click [Stop Recording] → name it "My Form Routine"
4. Next page: Cmd+K → "Replay My Form Routine"
5. Watch automation run automatically
```

### Tab Grouping
```
1. Open 6 tabs: mix of shopping and travel pages
2. Cmd+K → "Group my tabs by topic"
3. Tabs regroup: "Shopping", "Travel"
```

## Q&A Talking Points

**Q: How does it understand pages?**
A: Accessibility tree (the same data screen readers use). Zero screenshots, zero raw HTML to the AI.

**Q: What AI model does it use?**
A: Anthropic Claude for planning. Page parsing is entirely local — no API calls.

**Q: Is it safe to use on real sites?**
A: Yes. It uses real browser events (not injected JS). Checkpoint gates every destructive action.

**Q: What about login credentials and payment info?**
A: PII is stripped before any LLM call. Passwords, card numbers, SSNs are redacted in code.

**Q: Can it handle dynamic pages (React, Vue)?**
A: Yes. CDP accessibility tree updates in real-time as the DOM changes.

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API rate limit | Mock LLM mode (`MOCK_LLM=true`) |
| Network failure | All demo pages are local (localhost:3001) |
| App crash | Pre-recorded screen capture backup |
| Selector mismatch | Mock pages have stable `data-testid` attributes |
| CDP detach | Auto-reconnect on navigation (built into cdp-bridge.ts) |
