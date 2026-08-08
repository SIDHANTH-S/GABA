/**
 * agent-core/pipeline.ts
 * Top-level orchestrator: Intent → Parse → Plan → Execute → Verify
 * Dependencies: all agent-core modules, semantic-parser, electron-main
 */

import type { TaskPlan, CDPSession, TaskPlanUpdate } from '../shared/types';
import { BrowserWindow } from 'electron';
import { buildSemanticModel } from '../semantic-parser/semantic-model-builder';
import { planTask } from './planner';
import { executePlan } from './executor';
import { getDomainMemory, getUserProfile, upsertDomainMemory } from './memory-manager';
import { extractDomain } from '../shared/utils';
import { CHANNELS } from '../shared/constants';

/**
 * Run full pipeline: Parse → Plan → Execute
 */
export async function runPipeline(
  intent: string,
  win: BrowserWindow,
  session: CDPSession
): Promise<TaskPlan> {
  try {
    console.log('[Pipeline] Starting:', intent);
    
    // STEP 1: Parse current page
    const url = await session.send('Page.getNavigationHistory') as any;
    const currentURL = url?.currentEntry?.url || '';
    
    console.log('[Pipeline] Parsing page...');
    const model = await buildSemanticModel(session, currentURL);
    
    // STEP 2: Get domain memory
    const domain = extractDomain(currentURL);
    const memory = getDomainMemory(domain);
    const profile = getUserProfile();
    const plannerMemory = profile
      ? {
          domain,
          lastVisited: memory?.lastVisited || Date.now(),
          formInputs: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: `${profile.firstName} ${profile.lastName}`.trim(),
            email: profile.email,
            phone: profile.phone || '',
            street: profile.address?.street || '',
            address: profile.address?.street || '',
            city: profile.address?.city || '',
            state: profile.address?.state || '',
            zip: profile.address?.zip || '',
            country: profile.address?.country || '',
            ...(memory?.formInputs || {}),
          },
          preferences: memory?.preferences || profile.custom || {},
          taskHistory: memory?.taskHistory || [],
        }
      : memory;
    
    // STEP 3: Plan task
    console.log('[Pipeline] Planning task...');
    const plan = await planTask(intent, model, plannerMemory);
    
    // Return plan immediately (HUD can show it)
    setTimeout(() => {
      // STEP 4: Execute asynchronously
      console.log('[Pipeline] Executing plan...');
      executePlan(plan, session, win, (update: TaskPlanUpdate) => {
        // Push progress to renderer
        win.webContents.send(CHANNELS.AGENT_TASK_PROGRESS, update);
      }).then(() => {
        console.log('[Pipeline] Execution complete');
        
        // STEP 5: Update memory
        if (plan.status === 'complete') {
          const taskHistory = memory?.taskHistory || [];
          taskHistory.unshift(intent);
          upsertDomainMemory(domain, {
            taskHistory: taskHistory.slice(0, 20), // Keep last 20
          });
        }
      }).catch(err => {
        console.error('[Pipeline] Execution failed:', err);
      });
    }, 0);
    
    return plan;
    
  } catch (err) {
    console.error('[Pipeline] Failed:', err);
    throw err;
  }
}
