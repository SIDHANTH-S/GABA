/**
 * scripts/test-parser.ts
 * CLI tool to test semantic parser on any URL
 * Usage: npx tsx scripts/test-parser.ts --url https://example.com
 */

import { app, BrowserWindow } from 'electron';
import { attachCDP } from '../apps/browser-shell/src/agent-core/cdp-bridge';
import { buildSemanticModel } from '../apps/browser-shell/src/semantic-parser/semantic-model-builder';

const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const testUrl = urlIndex !== -1 ? args[urlIndex + 1] : 'https://example.com';

async function testParser() {
  await app.whenReady();
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  console.log(`[Test Parser] Loading: ${testUrl}`);
  
  await win.loadURL(testUrl);
  
  // Wait for page to fully load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('[Test Parser] Page loaded, extracting model...');
  
  const session = await attachCDP(win);
  const model = await buildSemanticModel(session, testUrl);
  
  console.log('\n========== SEMANTIC PAGE MODEL ==========\n');
  console.log(JSON.stringify(model, null, 2));
  console.log('\n=========================================\n');
  
  console.log(`✅ Extracted:`);
  console.log(`   - ${model.entities.length} entities`);
  console.log(`   - ${model.forms.length} forms`);
  console.log(`   - ${model.actions.length} actions`);
  console.log(`   - ${model.documents.length} documents`);
  console.log(`   - Page intent: ${model.pageIntent}`);
  
  app.quit();
}

app.on('ready', testParser);

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('[Test Parser] Error:', err);
  app.quit();
});
