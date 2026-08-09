/**
 * agent-core/executor.ts
 * Executes TaskPlan steps via CDP with retry logic
 * Dependencies: electron-main/cdp-bridge, agent-core/verifier, shared/types
 */

import type { TaskPlan, TaskPlanUpdate, CDPSession, AgentAction } from '../shared/types';
import { BrowserWindow, app } from 'electron';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { sleep } from '../shared/utils';
import { EXECUTION_CONFIG } from '../shared/constants';
import * as cdp from '../electron-main/cdp-bridge';
import { isDestructiveAction, requestCheckpoint, calculateRiskLevel } from './verifier';
import { buildSemanticModel } from '../semantic-parser/semantic-model-builder';
import { extractToCSV, extractToJSON } from './extractor';
-
/**
 * Execute task plan step-by-step
 */
export async function executePlan(
  plan: TaskPlan,
  session: CDPSession,
  win: BrowserWindow,
  onProgress: (update: TaskPlanUpdate) => void
): Promise<void> {
  try {
    plan.status = 'running';
    
    // Handle empty plan (no steps)
    if (plan.steps.length === 0) {
      plan.status = 'complete';
      plan.completedAt = Date.now();
      onProgress({
        planId: plan.id,
        stepId: '',
        stepStatus: 'success',
        planStatus: 'complete',
        currentStepIndex: 0,
      });
      return;
    }
    
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStepIndex = i;
      
      // Emit starting
      step.status = 'running';
      step.startedAt = Date.now();
      onProgress({
        planId: plan.id,
        stepId: step.id,
        stepStatus: 'running',
        planStatus: 'running',
        currentStepIndex: i,
      });
      
      // Check if needs checkpoint
      if (step.action.requiresUserConfirmation || isDestructiveAction(step.action)) {
        const approved = await requestCheckpoint(
          {
            planId: plan.id,
            stepId: step.id,
            stepDescription: step.description,
            action: step.action,
            riskLevel: calculateRiskLevel(step.action),
          },
          win
        );
        
        if (!approved) {
          step.status = 'skipped';
          onProgress({
            planId: plan.id,
            stepId: step.id,
            stepStatus: 'skipped',
            planStatus: 'running',
            currentStepIndex: i,
          });
          continue;
        }
      }
      
      // Execute with retry
      let success = false;
      for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
        try {
          await executeAction(step.action, session);
          success = true;
          break;
        } catch (err) {
          console.error(`[Executor] Step ${step.id} attempt ${attempt} failed:`, err);
          step.retryCount = attempt + 1;
          
          if (attempt < step.maxRetries) {
            await sleep(EXECUTION_CONFIG.RETRY_DELAY_MS * (attempt + 1));
          } else {
            step.error = String(err);
          }
        }
      }
      
      // Update step status
      step.status = success ? 'success' : 'failed';
      step.completedAt = Date.now();
      
      onProgress({
        planId: plan.id,
        stepId: step.id,
        stepStatus: step.status,
        planStatus: 'running',
        currentStepIndex: i,
      });
      
      // Stop on critical failure
      if (!success && step.action.isDestructive) {
        throw new Error(`Critical step ${step.id} failed`);
      }
    }
    
    // All steps complete
    plan.status = 'complete';
    plan.completedAt = Date.now();
    
    const lastStep = plan.steps[plan.steps.length - 1];
    onProgress({
      planId: plan.id,
      stepId: lastStep?.id || '',
      stepStatus: 'success',
      planStatus: 'complete',
      currentStepIndex: Math.max(plan.steps.length - 1, 0),
    });
    
  } catch (err) {
    console.error('[Executor] Plan execution failed:', err);
    plan.status = 'failed';
    plan.error = String(err);
    
    onProgress({
      planId: plan.id,
      stepId: plan.steps[plan.currentStepIndex]?.id || '',
      stepStatus: 'failed',
      planStatus: 'failed',
      currentStepIndex: plan.currentStepIndex,
    });
  }
}

/**
 * Execute single action via CDP
 */
async function executeAction(action: AgentAction, session: CDPSession): Promise<void> {
  switch (action.type) {
    case 'click':
      await executeClick(action, session);
      break;
    
    case 'fill':
      await executeFill(action, session);
      break;
    
    case 'navigate':
      await executeNavigate(action, session);
      break;
    
    case 'wait':
      await sleep(action.payload.duration || 1000);
      break;
    
    case 'scroll':
      await executeScroll(action, session);
      break;
    
    case 'extract':
      await executeExtract(action, session);
      break;
    
    default:
      console.warn(`[Executor] Unknown action type: ${action.type}`);
  }
}

/**
 * Execute click action
 */
async function executeClick(action: AgentAction, session: CDPSession): Promise<void> {
  const selector = action.payload.selector;
  if (!selector) throw new Error('No selector for click action');
  
  const nodeId = await cdp.querySelector(session, selector);
  if (!nodeId) throw new Error(`Element not found: ${selector}`);
  
  await cdp.clickElement(session, nodeId);
  await sleep(500); // Wait for click to process
}

/**
 * Execute fill action
 */
async function executeFill(action: AgentAction, session: CDPSession): Promise<void> {
  const { selector, value } = action.payload;
  if (!selector || !value) throw new Error('Missing selector or value for fill action');
  
  const nodeId = await cdp.querySelector(session, selector);
  if (!nodeId) throw new Error(`Element not found: ${selector}`);
  
  await cdp.fillInput(session, nodeId, String(value));
  await sleep(300); // Wait for input to register
}

/**
 * Execute navigate action
 */
async function executeNavigate(action: AgentAction, session: CDPSession): Promise<void> {
  const url = action.payload.url;
  if (!url) throw new Error('No URL for navigate action');
  
  await cdp.navigateTo(session, url);
  await sleep(2000); // Wait for navigation
}

/**
 * Execute scroll action
 */
async function executeScroll(action: AgentAction, session: CDPSession): Promise<void> {
  const amount = action.payload.scrollAmount || 400;
  await cdp.executeScript(session, `window.scrollBy(0, ${amount})`);
  await sleep(200);
}

async function executeExtract(action: AgentAction, session: CDPSession): Promise<void> {
  const format = action.payload.extractTarget === 'json' ? 'json' : 'csv';
  const pageInfo = await cdp.extractPageSource(session);
  const model = await buildSemanticModel(session, pageInfo.url);
  const content = format === 'json' ? extractToJSON(model) : extractToCSV(model);
  const downloads = app.getPath('downloads');
  const safeTitle = (model.title || model.pageIntent || 'page-data')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'page-data';
  const filePath = join(downloads, `${safeTitle}-${Date.now()}.${format}`);
  writeFileSync(filePath, content, 'utf8');
  action.result = { success: true, data: { path: filePath, format } };
}
