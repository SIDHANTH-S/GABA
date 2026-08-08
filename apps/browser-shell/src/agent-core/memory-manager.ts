/**
 * agent-core/memory-manager.ts
 * CRUD operations for user profiles, domain memory, and workflows
 * Dependencies: electron-main/db, shared/types, shared/utils
 */

import type { UserProfile, DomainMemory, WorkflowRecording } from '../shared/types';
import { db } from '../db/db';
import { safeJSONParse } from '../shared/utils';

/**
 * Get user profile
 */
export function getUserProfile(): UserProfile | null {
  try {
    const row = db.prepare('SELECT * FROM user_profile LIMIT 1').get() as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      address: safeJSONParse(row.address_json, undefined),
      custom: safeJSONParse(row.custom_json, {}),
    };
  } catch (err) {
    console.error('[Memory] Failed to get user profile:', err);
    return null;
  }
}

/**
 * Set user profile
 */
export function setUserProfile(profile: Partial<UserProfile>): void {
  try {
    const existing = getUserProfile();
    
    const merged = {
      id: profile.id || existing?.id || 'user-001',
      first_name: profile.firstName || existing?.firstName || '',
      last_name: profile.lastName || existing?.lastName || '',
      email: profile.email || existing?.email || '',
      phone: profile.phone || existing?.phone || null,
      address_json: JSON.stringify(profile.address || existing?.address || null),
      custom_json: JSON.stringify(profile.custom || existing?.custom || {}),
    };
    
    db.prepare(`
      INSERT OR REPLACE INTO user_profile 
      (id, first_name, last_name, email, phone, address_json, custom_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      merged.id,
      merged.first_name,
      merged.last_name,
      merged.email,
      merged.phone,
      merged.address_json,
      merged.custom_json
    );
  } catch (err) {
    console.error('[Memory] Failed to set user profile:', err);
  }
}

/**
 * Get domain memory
 */
export function getDomainMemory(domain: string): DomainMemory | null {
  try {
    const row = db.prepare('SELECT * FROM domain_memory WHERE domain = ?').get(domain) as any;
    
    if (!row) return null;
    
    return {
      domain: row.domain,
      lastVisited: row.last_visited,
      formInputs: safeJSONParse(row.form_inputs, {}),
      preferences: safeJSONParse(row.preferences, {}),
      taskHistory: safeJSONParse(row.task_history, []),
    };
  } catch (err) {
    console.error('[Memory] Failed to get domain memory:', err);
    return null;
  }
}

/**
 * Upsert domain memory
 */
export function upsertDomainMemory(domain: string, update: Partial<DomainMemory>): void {
  try {
    const existing = getDomainMemory(domain);
    
    const merged = {
      domain,
      last_visited: Date.now(),
      form_inputs: JSON.stringify(update.formInputs || existing?.formInputs || {}),
      preferences: JSON.stringify(update.preferences || existing?.preferences || {}),
      task_history: JSON.stringify(update.taskHistory || existing?.taskHistory || []),
    };
    
    db.prepare(`
      INSERT OR REPLACE INTO domain_memory 
      (domain, last_visited, form_inputs, preferences, task_history)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      merged.domain,
      merged.last_visited,
      merged.form_inputs,
      merged.preferences,
      merged.task_history
    );
  } catch (err) {
    console.error('[Memory] Failed to upsert domain memory:', err);
  }
}

/**
 * Save form inputs to domain memory
 */
export function saveFormInputs(domain: string, inputs: Record<string, string>): void {
  const existing = getDomainMemory(domain);
  const merged = { ...existing?.formInputs, ...inputs };
  
  upsertDomainMemory(domain, { formInputs: merged });
}

/**
 * List all workflows
 */
export function listWorkflows(): WorkflowRecording[] {
  try {
    const rows = db.prepare('SELECT * FROM workflow_recordings ORDER BY created_at DESC').all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      steps: safeJSONParse(row.steps_json, []),
      createdAt: row.created_at,
      lastUsed: row.last_used,
      runCount: row.run_count,
    }));
  } catch (err) {
    console.error('[Memory] Failed to list workflows:', err);
    return [];
  }
}

/**
 * Save workflow
 */
export function saveWorkflow(recording: WorkflowRecording): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO workflow_recordings
      (id, name, description, trigger, steps_json, created_at, last_used, run_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recording.id,
      recording.name,
      recording.description || null,
      recording.trigger,
      JSON.stringify(recording.steps),
      recording.createdAt,
      recording.lastUsed || null,
      recording.runCount
    );
  } catch (err) {
    console.error('[Memory] Failed to save workflow:', err);
  }
}

/**
 * Get workflow by ID
 */
export function getWorkflow(id: string): WorkflowRecording | null {
  try {
    const row = db.prepare('SELECT * FROM workflow_recordings WHERE id = ?').get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      steps: safeJSONParse(row.steps_json, []),
      createdAt: row.created_at,
      lastUsed: row.last_used,
      runCount: row.run_count,
    };
  } catch (err) {
    console.error('[Memory] Failed to get workflow:', err);
    return null;
  }
}
