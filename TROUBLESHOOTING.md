# Troubleshooting Guide

## Installation Issues

### Problem: `npm install` takes too long
**Solution**: This is normal for Electron projects (large binaries). Expect 2-5 minutes on first install.

```bash
# If it hangs, try clearing npm cache:
npm cache clean --force
npm install
```

### Problem: `better-sqlite3` build errors
**Cause**: Missing C++ build tools

**Solution (Windows)**:
```bash
npm install --global windows-build-tools
```

**Solution (Mac)**:
```bash
xcode-select --install
```

**Solution (Linux)**:
```bash
sudo apt-get install build-essential
```

---

## Runtime Issues

### Problem: Electron app won't launch
**Check**:
1. Is Node.js 18+ installed? Run: `node --version`
2. Did `npm install` complete successfully?
3. Are there TypeScript errors? Run: `npm run typecheck`

**Solution**:
```bash
# Rebuild from scratch
npm run clean
npm install
npm run dev:electron
```

### Problem: "Module not found" errors
**Cause**: TypeScript compilation failed or paths misconfigured

**Solution**:
```bash
# Verify tsconfig paths
cat tsconfig.main.json | grep "outDir"  # Should be "dist"

# Rebuild main process
npm run build
```

### Problem: Sidebar doesn't appear
**Check**:
1. Is sidebar toggle shortcut working? (`Cmd+Shift+S`)
2. Check Electron dev console (View → Toggle Developer Tools)

**Debug**:
```javascript
// In main process console:
console.log(BrowserWindow.getAllWindows()[0].getBrowserViews());
// Should show sidebar BrowserView
```

### Problem: HUD not visible on pages
**Cause**: CDP injection failed or CSP blocked script

**Debug**:
```bash
# Check Electron main logs:
npm run dev:electron 2>&1 | grep "HUD"
```

**Workaround**: Add `--disable-web-security` to Electron launch (dev only):
```javascript
// In electron-main/index.ts, add to webPreferences:
webPreferences: {
  webSecurity: false, // DEV ONLY
  ...
}
```

---

## API Issues

### Problem: "API key not found" error
**Solution**:
```bash
# 1. Verify .env file exists
ls -la .env

# 2. Check format (no quotes around key)
cat .env
# Should be: ANTHROPIC_API_KEY=sk-ant-...

# 3. Restart app to reload env vars
```

### Problem: "Rate limit exceeded" from Anthropic
**Cause**: Too many rapid requests

**Solution**: Add delay between tasks or upgrade API tier

**Temporary fix**:
```javascript
// In agent-core/llm-client.ts, add sleep after API call:
await sleep(1000); // 1 second between calls
```

### Problem: PII not being redacted
**Check**: Verify patterns in `shared/constants.ts`

**Test**:
```bash
# Run parser test with sample data:
npm run test:parser -- --url "https://example.com"
# Check output for credit card patterns
```

---

## Database Issues

### Problem: "Database locked" error
**Cause**: Multiple processes accessing same DB file

**Solution**:
```bash
# 1. Close all Electron instances
pkill -f electron

# 2. Delete lock files
rm user-data/*.db-wal user-data/*.db-shm

# 3. Restart
npm run dev:electron
```

### Problem: Missing demo data after seed
**Check**:
```bash
# Verify seed ran successfully:
npm run seed

# Should output:
# ✅ Profile created: Alex Chen
# ✅ 7 memories seeded
```

**Debug**:
```bash
# Inspect database directly:
npm install -g sqlite3
sqlite3 user-data/memory.db "SELECT * FROM profiles;"
```

---

## UI Issues

### Problem: Command bar (Cmd+K) doesn't open
**Check**:
1. Is focus on Electron window? (not on external browser)
2. Check keyboard shortcut registration in logs

**Debug**: Open React DevTools and check `useCommandBar` state:
```javascript
// Should toggle between true/false:
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).getCurrentFiber().return.memoizedState.isOpen
```

### Problem: Styles not loading (Tailwind)
**Cause**: PostCSS or Vite config issue

**Solution**:
```bash
# Verify Tailwind setup:
npx tailwindcss -i renderer/globals.css -o dist/test.css
# Should compile without errors

# Rebuild renderer:
npm run build:renderer
```

### Problem: Components not updating
**Cause**: Zustand store not triggering re-renders

**Debug**:
```javascript
// In React component, add:
const store = useAgentStore();
console.log('Store state:', store);
```

---

## Parser Issues

### Problem: Entities not detected
**Cause**: Page structure unusual or regex patterns too strict

**Debug**:
```bash
# Test parser on specific URL:
npm run test:parser -- --url "https://target-site.com" | jq '.entities'
```

**Solution**: Adjust patterns in `semantic-parser/entity-detector.ts`

### Problem: Page type always "unknown"
**Cause**: Confidence threshold too high

**Tweak**: In `semantic-parser/page-classifier.ts`:
```typescript
// Lower threshold from 0.4 to 0.3
if (maxConfidence < 0.3) return { type: 'unknown', confidence: 0 };
```

---

## Performance Issues

### Problem: Slow task execution
**Check**:
1. Are steps retrying multiple times? (Check logs)
2. Is debounce delay too high? (Default 100ms)

**Optimize**:
```typescript
// In agent-core/executor.ts, reduce debounce:
await sleep(50); // From 100ms to 50ms
```

### Problem: High memory usage
**Cause**: Too many cached page contexts or memory entries

**Solution**:
```typescript
// In agent-core/memory-manager.ts, reduce cache TTL:
const CACHE_TTL = 50; // From 100ms to 50ms
```

---

## Testing Tips

### Smoke Test Checklist
```bash
# 1. Type check
npm run typecheck

# 2. Parser test (no API)
npm run test:parser -- --url https://httpbin.org/forms/post

# 3. Database seed
npm run seed

# 4. Launch app
npm run dev:electron

# 5. In app:
#    - Press Cmd+Shift+S (sidebar should appear)
#    - Press Cmd+K (command bar should appear)
#    - Type "test" and press Enter
#    - Check console for IPC logs
```

### Debug Logging
Enable verbose logs:

```javascript
// In electron-main/index.ts, add:
process.env.DEBUG = '*';

// In agent-core/pipeline.ts, add:
console.log('Pipeline step:', { intent, model, plan });
```

### Network Inspection
Monitor CDP traffic:

```javascript
// In electron-main/cdp-bridge.ts, add:
console.log('CDP command:', { method, params });
```

---

## Known Quirks

1. **First launch is slow** - Electron downloads binaries, Vite compiles assets
2. **Hot reload doesn't work for main process** - Must restart app after main process changes
3. **Sidebar appears blank briefly** - BrowserView loads async, this is normal
4. **HUD flickers on navigation** - Re-injection takes ~50ms, acceptable for MVP

---

## Getting Help

### Check logs:
```bash
# Main process logs:
npm run dev:electron 2>&1 | tee main.log

# Renderer logs:
# Open DevTools in Electron window (Cmd+Option+I)
```

### Common log locations:
- Electron main: `stdout` during `npm run dev:electron`
- Renderer: Chrome DevTools console
- Database: `user-data/memory.db` (use sqlite3 CLI)
- Build errors: `npm run typecheck` output

### Report issues:
Include:
1. Node.js version (`node --version`)
2. OS version
3. Full error message
4. Steps to reproduce
5. Relevant logs

---

## Clean Slate Reset

If all else fails:

```bash
# Nuclear option - reset everything:
npm run clean
rm -rf node_modules package-lock.json user-data
npm install
npm run seed
npm run dev:electron
```

This deletes all build artifacts, dependencies, and user data. **Warning**: You'll lose any manually created memories.

---

## Performance Benchmarks

Expected performance on modern hardware:

| Operation | Time | Notes |
|-----------|------|-------|
| npm install | 2-5 min | First time only |
| npm run typecheck | 5-10s | All files |
| npm run seed | <1s | 7 memories |
| npm run test:parser | 2-3s | Per URL |
| App launch | 3-5s | Cold start |
| Page parse | 100-300ms | Depends on complexity |
| LLM plan generation | 2-5s | Network dependent |
| Step execution | 100ms-2s | Per step |

If your times are significantly slower, check:
- CPU: Should be <50% during execution
- Memory: Should be <1GB for app
- Network: API latency should be <2s

---

**Last updated**: 2026-08-07
