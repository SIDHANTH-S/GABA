/**
 * agent-core/verifier.ts
 * Pre-action checks and checkpoint Promise gate
 * Dependencies: shared/types, shared/constants, electron
 */

import type { AgentAction, CheckpointPayload } from '../shared/types';
import { BrowserWindow } from 'electron';
import { CHANNELS, EXECUTION_CONFIG } from '../shared/constants';
import { generateId } from '../shared/utils';

// Map of pending checkpoint promises
const pendingCheckpoints = new Map<string, (approved: boolean) => void>();

/**
 * Check if action is destructive
 */
export function isDestructiveAction(action: AgentAction): boolean {
  // Already marked
  if (action.isDestructive) return true;
  
  // Submit actions
  if (action.type === 'submit') return true;
  
  // Fill sensitive fields
  if (action.type === 'fill') {
    const value = (action.payload.value || '').toLowerCase();
    if (value.includes('card') || value.includes('cvv')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Request checkpoint from user (Promise gate)
 */
export async function requestCheckpoint(
  payload: Omit<CheckpointPayload, 'id'>,
  win: BrowserWindow
): Promise<boolean> {
  const id = generateId('checkpoint');
  
  const fullPayload: CheckpointPayload = {
    id,
    ...payload,
  };
  
  // Send to renderer
  win.webContents.send(CHANNELS.AGENT_CHECKPOINT_REQUEST, fullPayload);
  
  return new Promise<boolean>((resolve) => {
    // Set timeout for auto-cancel
    const timeout = setTimeout(() => {
      pendingCheckpoints.delete(id);
      console.log('[Verifier] Checkpoint timeout - auto-cancelled');
      resolve(false);
    }, EXECUTION_CONFIG.CHECKPOINT_TIMEOUT_MS);
    
    // Store resolver
    pendingCheckpoints.set(id, (approved: boolean) => {
      clearTimeout(timeout);
      resolve(approved);
    });
  });
}

/**
 * Resolve checkpoint (called from IPC handler)
 */
export function resolveCheckpoint(id: string, approved: boolean): void {
  const resolver = pendingCheckpoints.get(id);
  if (resolver) {
    resolver(approved);
    pendingCheckpoints.delete(id);
  }
}

/**
 * Calculate risk level for action
 */
export function calculateRiskLevel(action: AgentAction): 'low' | 'medium' | 'high' {
  if (action.type === 'submit' && action.isDestructive) {
    return 'high';
  }
  
  if (action.type === 'fill') {
    const selector = action.payload.selector || '';
    if (/credit|card|cvv|password/i.test(selector)) {
      return 'medium';
    }
  }
  
  if (action.type === 'navigate') {
    return 'low';
  }
  
  return 'low';
}
