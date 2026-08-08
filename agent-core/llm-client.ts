/**
 * agent-core/llm-client.ts
 * NVIDIA NIM API client with PII redaction (direct HTTP)
 * Dependencies: shared/utils, shared/constants
 */

import { redactPII } from '../shared/utils';
import { LLM_CONFIG } from '../shared/constants';

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Call LLM with PII redaction (using NVIDIA NIM API via direct HTTP)
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  // Always redact PII before sending
  const redactedUser = redactPII(userMessage);
  
  // Check for mock mode
  if (process.env.MOCK_LLM === 'true') {
    console.log('[LLM] Mock mode - returning canned response');
    return mockLLMResponse(redactedUser);
  }
  
  const apiKey = process.env.NIM_API_KEY || process.env.NVIDIA_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('No NVIDIA API key found. Set NIM_API_KEY or NVIDIA_API_KEY in .env');
  }
  
  const payload = {
    model: LLM_CONFIG.MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: redactedUser },
    ],
    temperature: options.temperature ?? LLM_CONFIG.TEMPERATURE,
    top_p: 0.9,
    max_tokens: options.maxTokens || LLM_CONFIG.MAX_TOKENS,
    stream: false,
  };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= LLM_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), LLM_CONFIG.TIMEOUT_MS);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`[LLM] Rate limited (429), retrying in ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      
      if (!response.ok) {
        const body = await response.text().catch(() => '(no body)');
        throw new Error(`HTTP ${response.status}: ${body}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices in LLM response');
      }
      
      const content = data.choices[0]?.message?.content;
      return content || '';
      
    } catch (err: any) {
      lastError = err;
      console.error(`[LLM] Attempt ${attempt + 1} failed:`, err.message);
      
      if (attempt < LLM_CONFIG.MAX_RETRIES) {
        const waitMs = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }
  
  throw new Error(`LLM API error after ${LLM_CONFIG.MAX_RETRIES + 1} attempts: ${lastError}`);
}

/**
 * Mock LLM response for testing
 */
function mockLLMResponse(userMessage: string): string {
  // Simple pattern matching for common intents
  if (/fill.*form/i.test(userMessage)) {
    return JSON.stringify({
      id: 'plan_mock',
      intent: 'Fill form with user data',
      steps: [
        {
          id: 'step_1',
          sequence: 1,
          description: 'Fill name field',
          action: {
            id: 'action_1',
            type: 'fill',
            payload: { selector: 'input[name="name"]', value: 'Demo User' },
            isDestructive: false,
            requiresUserConfirmation: false,
          },
          maxRetries: 3,
          retryCount: 0,
          status: 'pending',
        },
      ],
      estimatedDuration: 5000,
      requiresCheckpoint: false,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
    });
  }
  
  if (/extract|export/i.test(userMessage)) {
    return JSON.stringify({
      id: 'plan_mock',
      intent: 'Extract page data',
      steps: [
        {
          id: 'step_1',
          sequence: 1,
          description: 'Extract data to CSV',
          action: {
            id: 'action_1',
            type: 'extract',
            payload: { extractTarget: 'csv' },
            isDestructive: false,
            requiresUserConfirmation: false,
          },
          maxRetries: 1,
          retryCount: 0,
          status: 'pending',
        },
      ],
      estimatedDuration: 2000,
      requiresCheckpoint: false,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
    });
  }

  if (/open|navigate|go to|visit/i.test(userMessage)) {
    // Try to extract URL from the message
    const urlMatch = userMessage.match(/(?:open|navigate|go to|visit)\s+(\S+)/i);
    const target = urlMatch?.[1] || 'google.com';
    const url = target.startsWith('http') ? target : `https://${target}`;
    return JSON.stringify({
      id: 'plan_mock',
      intent: `Navigate to ${target}`,
      steps: [
        {
          id: 'step_1',
          sequence: 1,
          description: `Navigate to ${url}`,
          action: {
            id: 'action_1',
            type: 'navigate',
            payload: { url },
            isDestructive: false,
            requiresUserConfirmation: false,
          },
          maxRetries: 2,
          retryCount: 0,
          status: 'pending',
        },
      ],
      estimatedDuration: 3000,
      requiresCheckpoint: false,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
    });
  }

  if (/click|press|tap/i.test(userMessage)) {
    const targetMatch = userMessage.match(/(?:click|press|tap)\s+(?:on\s+)?(?:the\s+)?(.+)/i);
    const target = targetMatch?.[1] || 'button';
    return JSON.stringify({
      id: 'plan_mock',
      intent: `Click ${target}`,
      steps: [
        {
          id: 'step_1',
          sequence: 1,
          description: `Click on ${target}`,
          action: {
            id: 'action_1',
            type: 'click',
            payload: { selector: target },
            isDestructive: false,
            requiresUserConfirmation: false,
          },
          maxRetries: 3,
          retryCount: 0,
          status: 'pending',
        },
      ],
      estimatedDuration: 2000,
      requiresCheckpoint: false,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
    });
  }

  if (/scroll/i.test(userMessage)) {
    return JSON.stringify({
      id: 'plan_mock',
      intent: 'Scroll page',
      steps: [
        {
          id: 'step_1',
          sequence: 1,
          description: 'Scroll down the page',
          action: {
            id: 'action_1',
            type: 'scroll',
            payload: { scrollAmount: 500 },
            isDestructive: false,
            requiresUserConfirmation: false,
          },
          maxRetries: 1,
          retryCount: 0,
          status: 'pending',
        },
      ],
      estimatedDuration: 1000,
      requiresCheckpoint: false,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
    });
  }

  // Default mock response - task acknowledged
  return JSON.stringify({
    id: 'plan_mock',
    intent: userMessage,
    steps: [],
    estimatedDuration: 1000,
    requiresCheckpoint: false,
    status: 'complete',
    currentStepIndex: 0,
    createdAt: Date.now(),
  });
}
