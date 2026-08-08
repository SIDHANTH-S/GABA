/**
 * agent-core/workflow-recorder.ts
 * Records user actions for workflow replay
 * Dependencies: shared/types, shared/utils
 */

import type { CDPSession, RecordedStep, WorkflowRecording } from '../shared/types';
import { generateId } from '../shared/utils';

let isRecording = false;
let recordedSteps: RecordedStep[] = [];
let recordingStartTime = 0;

/**
 * Start recording workflow
 */
export function startRecording(session: CDPSession): void {
  if (isRecording) {
    console.warn('[Recorder] Already recording');
    return;
  }
  
  isRecording = true;
  recordedSteps = [];
  recordingStartTime = Date.now();
  
  // Attach CDP listeners
  session.on('Input.dispatchKeyEvent', (params: any) => {
    if (params.type === 'char') {
      // Accumulate text input
      // ponytail: simplified - just log, full impl would batch chars
    }
  });
  
  console.log('[Recorder] Started recording');
}

/**
 * Stop recording and return workflow
 */
export function stopRecording(name: string, description?: string): WorkflowRecording {
  if (!isRecording) {
    throw new Error('Not currently recording');
  }
  
  isRecording = false;
  
  const recording: WorkflowRecording = {
    id: generateId('workflow'),
    name,
    description,
    trigger: name.toLowerCase(),
    steps: recordedSteps,
    createdAt: Date.now(),
    runCount: 0,
  };
  
  console.log(`[Recorder] Stopped. Recorded ${recordedSteps.length} steps`);
  
  // Reset state
  recordedSteps = [];
  recordingStartTime = 0;
  
  return recording;
}

/**
 * Check if currently recording
 */
export function isCurrentlyRecording(): boolean {
  return isRecording;
}

/**
 * Manually add step (called from executor during recording)
 */
export function addRecordedStep(step: Omit<RecordedStep, 'id' | 'timestamp'>): void {
  if (!isRecording) return;
  
  recordedSteps.push({
    id: generateId('rec-step'),
    timestamp: Date.now() - recordingStartTime,
    ...step,
  });
}
