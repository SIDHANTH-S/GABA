/**
 * agent-core/planner.ts
 * LLM-based task planner - converts intent to TaskPlan
 * Dependencies: agent-core/llm-client, shared/types, shared/utils
 */

import type { SemanticPageModel, DomainMemory, TaskPlan, PlanStep } from '../shared/types';
import { callLLM } from './llm-client';
import { compactForLLM, generateId, safeJSONParse } from '../shared/utils';
import { z } from 'zod';

// Zod schema for validation
const TaskPlanSchema = z.object({
  intent: z.string(),
  steps: z.array(z.object({
    description: z.string(),
    action: z.object({
      type: z.string(),
      payload: z.record(z.unknown()),
      isDestructive: z.boolean().optional(),
      requiresUserConfirmation: z.boolean().optional(),
    }),
  })),
});

/**
 * Plan task from intent and context
 */
export async function planTask(
  intent: string,
  model: SemanticPageModel,
  memory: DomainMemory | null
): Promise<TaskPlan> {
  try {
    // Compact model for LLM
    const compactModel = compactForLLM(model);
    
    // Build system prompt
    const systemPrompt = `You are a browser automation planner. Output ONLY valid JSON matching this structure:
{
  "intent": "brief description",
  "steps": [
    {
      "description": "human-readable step description",
      "action": {
        "type": "click|fill|navigate|extract|wait|scroll",
        "payload": {
          "selector": "CSS selector (for click/fill)",
          "value": "input value (for fill)",
          "url": "URL (for navigate)",
          "extractTarget": "json|csv (for extract)"
        },
        "isDestructive": false,
        "requiresUserConfirmation": false
      }
    }
  ]
}

Rules:
- Max 10 steps
- Use only selectors from page context
- Mark isDestructive=true for form submit or payment
- Mark requiresUserConfirmation=true for destructive actions`;

    // Build user message
    const userMessage = `
Page context: ${JSON.stringify(compactModel)}

User intent: "${intent}"

${memory ? `User memory: ${JSON.stringify(memory.formInputs)}` : ''}

Generate TaskPlan JSON:`;

    // Call LLM
    const response = await callLLM(systemPrompt, userMessage, {
      maxTokens: 1000,
      temperature: 0,
    });
    
    // Parse response
    const cleaned = cleanLLMResponse(response);
    const parsed = safeJSONParse(cleaned, null);
    
    if (!parsed) {
      throw new Error('Failed to parse LLM response');
    }
    
    // Validate with Zod
    const validated = TaskPlanSchema.parse(parsed);
    
    // Convert to full TaskPlan
    return buildTaskPlan(validated, intent, model);
    
  } catch (err) {
    console.error('[Planner] Failed to plan task:', err);

    return buildHeuristicPlan(intent, model, memory, String(err));
  }
}

/**
 * Clean LLM response (remove markdown fences)
 */
function cleanLLMResponse(text: string): string {
  // Remove markdown code fences
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}

/**
 * Build full TaskPlan from validated LLM response
 */
function buildTaskPlan(
  validated: z.infer<typeof TaskPlanSchema>,
  intent: string,
  model: SemanticPageModel
): TaskPlan {
  const steps: PlanStep[] = validated.steps.map((step: any, index: number) => ({
    id: generateId('step'),
    sequence: index + 1,
    description: step.description,
    action: {
      id: generateId('action'),
      type: step.action.type as any,
      payload: step.action.payload,
      isDestructive: step.action.isDestructive || false,
      requiresUserConfirmation: step.action.requiresUserConfirmation || false,
    },
    retryCount: 0,
    maxRetries: 3,
    status: 'pending',
  }));
  
  const requiresCheckpoint = steps.some(s => s.action.requiresUserConfirmation);
  const estimatedDuration = steps.length * 2000; // 2s per step
  
  return {
    id: generateId('plan'),
    intent: validated.intent,
    rawCommand: intent,
    steps,
    estimatedDuration,
    requiresCheckpoint,
    context: model,
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
  };
}

function buildHeuristicPlan(
  intent: string,
  model: SemanticPageModel,
  memory: DomainMemory | null,
  sourceError?: string
): TaskPlan {
  const lower = intent.toLowerCase();
  const steps: PlanStep[] = [];
  const addStep = (
    description: string,
    action: PlanStep['action'],
    maxRetries = 3
  ) => {
    steps.push({
      id: generateId('step'),
      sequence: steps.length + 1,
      description,
      action: { ...action, id: generateId('action') },
      retryCount: 0,
      maxRetries,
      status: 'pending',
    });
  };

  const extractFormat = lower.includes('json') ? 'json' : lower.includes('text') ? 'text' : 'csv';
  if (/extract|export|save|download.*data|csv|json/.test(lower)) {
    addStep(`Extract page data as ${extractFormat.toUpperCase()}`, {
      id: '',
      type: 'extract',
      payload: { extractTarget: extractFormat },
      isDestructive: false,
      requiresUserConfirmation: false,
    }, 1);
  } else if (/scroll/.test(lower)) {
    addStep(lower.includes('up') ? 'Scroll up' : 'Scroll down', {
      id: '',
      type: 'scroll',
      payload: { scrollAmount: lower.includes('up') ? -600 : 600 },
      isDestructive: false,
      requiresUserConfirmation: false,
    }, 1);
  } else if (/open|go to|visit|navigate/.test(lower)) {
    const urlMatch = intent.match(/(?:open|go to|visit|navigate(?: to)?)\s+([^\s]+)/i);
    const target = urlMatch?.[1] || '';
    if (target) {
      addStep(`Navigate to ${target}`, {
        id: '',
        type: 'navigate',
        payload: { url: /^https?:\/\//i.test(target) ? target : `https://${target}` },
        isDestructive: false,
        requiresUserConfirmation: false,
      }, 2);
    }
  } else if (/fill|complete|autofill|address|profile/.test(lower) && model.forms.length > 0) {
    const values = buildFormValues(memory);
    const fields = model.forms.flatMap((form) => form.fields);
    for (const field of fields) {
      const value = values[field.semanticType] || values[field.label.toLowerCase()] || '';
      if (!value || field.currentValue) continue;
      addStep(`Fill ${field.label}`, {
        id: '',
        type: 'fill',
        payload: { selector: field.selector, value },
        isDestructive: false,
        requiresUserConfirmation: false,
      });
    }

    const shouldSubmit = /submit|send|checkout|book|pay|apply/.test(lower);
    const submitForm = model.forms.find((form) => form.submitSelector);
    if (shouldSubmit && submitForm?.submitSelector) {
      addStep(`Review and ${submitForm.submitLabel || 'submit'} form`, {
        id: '',
        type: 'click',
        payload: { selector: submitForm.submitSelector },
        isDestructive: true,
        requiresUserConfirmation: true,
      });
    }
  } else if (/click|press|tap|select/.test(lower)) {
    const target = lower.replace(/^(click|press|tap|select)\s+(on\s+)?(the\s+)?/i, '').trim();
    const action = findBestAction(model, target);
    if (action) {
      addStep(`Click ${action.label}`, {
        id: '',
        type: action.type === 'navigate' && action.href ? 'navigate' : 'click',
        payload: action.href && action.type === 'navigate' ? { url: action.href } : { selector: action.selector },
        isDestructive: action.type === 'submit',
        requiresUserConfirmation: action.type === 'submit',
      });
    }
  }

  if (steps.length === 0 && model.actions.length > 0) {
    const action = findBestAction(model, lower);
    if (action) {
      addStep(`Run page action: ${action.label}`, {
        id: '',
        type: action.type === 'navigate' && action.href ? 'navigate' : 'click',
        payload: action.href && action.type === 'navigate' ? { url: action.href } : { selector: action.selector },
        isDestructive: action.type === 'submit',
        requiresUserConfirmation: action.type === 'submit',
      });
    }
  }

  const requiresCheckpoint = steps.some((step) => step.action.requiresUserConfirmation);
  return {
    id: generateId('plan'),
    intent,
    rawCommand: intent,
    steps,
    estimatedDuration: Math.max(steps.length * 1200, 1000),
    requiresCheckpoint,
    context: model,
    status: steps.length > 0 ? 'pending' : 'failed',
    currentStepIndex: 0,
    createdAt: Date.now(),
    error: steps.length > 0 ? undefined : `Could not produce an executable plan. ${sourceError || ''}`.trim(),
  };
}

function buildFormValues(memory: DomainMemory | null): Record<string, string> {
  const inputs = memory?.formInputs || {};
  const preferences = memory?.preferences || {};
  const merged = { ...preferences, ...inputs } as Record<string, unknown>;

  return {
    firstName: stringValue(merged.firstName || merged.first_name),
    lastName: stringValue(merged.lastName || merged.last_name),
    fullName: stringValue(merged.fullName || merged.name),
    email: stringValue(merged.email),
    phone: stringValue(merged.phone),
    address: stringValue(merged.address || merged.street),
    city: stringValue(merged.city),
    state: stringValue(merged.state),
    zip: stringValue(merged.zip || merged.postal),
    country: stringValue(merged.country),
    username: stringValue(merged.username || merged.email),
    search: stringValue(merged.search),
  };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function findBestAction(model: SemanticPageModel, target: string) {
  const normalizedTarget = target.toLowerCase();
  return model.actions.find((action) => action.label.toLowerCase().includes(normalizedTarget))
    || model.actions.find((action) => normalizedTarget.includes(action.label.toLowerCase()))
    || model.actions[0];
}
