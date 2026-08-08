# AI Service Integration

## Overview

This project uses third-party AI chat completion APIs for LLM-powered task planning. Two implementations are provided as reference:

1. **DeepSeek** - Chat completion with thinking mode support
2. **Qwen** - Multi-model chat with search and research capabilities

## Integration Architecture

```
agent-core/llm-client.ts
    ↓
Anthropic SDK (primary for MVP)
    ↓
Claude Sonnet 4.6 API

Alternative implementations:
    ↓
[DeepSeek] or [Qwen] (reference/testing)
```

## Primary: Anthropic Claude (MVP)

**Model:** `claude-sonnet-4-6`  
**Usage:** Task planning only (not for page parsing)  
**Cost:** ~$3 per 1M input tokens, ~$15 per 1M output tokens  
**Latency:** ~500-1500ms for typical TaskPlan generation

### Configuration

```typescript
// agent-core/llm-client.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1000,
  temperature: 0, // deterministic
  system: systemPrompt,
  messages: [{ role: 'user', content: redactedUserMessage }]
});
```

### Environment Setup

Required in `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get key from: https://console.anthropic.com/

## Alternative: DeepSeek

See [deepseek-integration.md](./deepseek-integration.md) for complete reference implementation.

**Model:** DeepSeek Chat V2  
**Features:** Streaming responses, thinking mode, session management  
**Language:** Python (HTTP + SSE streaming)  
**Status:** Reference implementation for testing

## Alternative: Qwen

See [qwen-integration.md](./qwen-integration.md) for complete reference implementation.

**Model:** Qwen 3.8 Max  
**Features:** Multi-turn chat, auto-search, fast/deep thinking modes  
**Language:** Python (HTTP + SSE streaming)  
**Status:** Reference implementation for testing

## Usage in Agent Pipeline

### 1. Task Planning (Primary Use Case)

**Input:**
- User intent: `"Fill out this form with my shipping address"`
- Semantic page model: `{ entities: [...], forms: [...], actions: [...] }`
- User memory: `{ profile: { name, email, address } }`

**LLM Prompt:**
```
System: You are a browser automation planner. Output ONLY valid JSON matching TaskPlan schema.

User:
Page context: {compact SemanticPageModel}
User intent: "{intent}"
User memory: {relevant fields}

Generate a TaskPlan with max 10 steps. Use only selectors from page context.
Mark isDestructive=true for form submission or payment actions.
```

**Output:** TaskPlan JSON
```json
{
  "id": "plan_123",
  "intent": "Fill out this form with my shipping address",
  "steps": [
    {
      "id": "step_1",
      "action": {
        "type": "fill",
        "selector": "input[aria-label='Full Name']",
        "value": "John Doe"
      },
      "description": "Fill name field",
      "isDestructive": false
    },
    // ... more steps
  ]
}
```

### 2. Domain Memory Naming (Secondary)

Generates human-readable names for saved memories:
```
User: Generate a short name for this saved form data: {...}
LLM: "Amazon Prime checkout preferences"
```

### 3. Tab Group Naming (Secondary)

Clusters tabs by intent, generates group names:
```
User: Name this group of tabs: [amazon.com/product/X, ebay.com/item/Y]
LLM: "Shopping for Electronics"
```

## Token Budget Management

**Critical:** Never send raw HTML to LLM.

### Before LLM Call
1. Parse HTML → SemanticPageModel (local, zero API cost)
2. Compact SemanticPageModel → remove verbose fields:
   - Strip full DOM selectors (keep semantic labels only)
   - Limit entities array to top 20 by relevance
   - Exclude invisible/decorative elements
3. Redact PII (credit cards, SSNs, passwords)
4. Typical result: 500-1500 tokens (vs 50k+ for raw HTML)

### Example Compaction

**Before:**
```json
{
  "entities": [
    {
      "type": "price",
      "value": "$299.99",
      "selector": "body > main > div.container > section#product > div.price-box > span.price-value[data-testid='product-price']",
      "confidence": 0.95,
      "boundingBox": { "x": 450, "y": 230, "width": 80, "height": 24 }
    }
  ]
}
```

**After (sent to LLM):**
```json
{
  "entities": [
    { "type": "price", "value": "$299.99" }
  ]
}
```

Selectors re-resolved at execution time by querying the live page.

## PII Redaction

**Always applied** before any LLM call via `llm-client.ts`:

```typescript
export function redactPII(text: string): string {
  return text
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/password['":\s]+[^\s,}"']+/gi, 'password: [REDACTED]');
}
```

Redaction patterns defined in `shared/constants.ts`.

## Cost Estimation (MVP Demo)

Assuming 50 commands during jury demo:

| Operation | Tokens | Cost/Call | Total |
|-----------|--------|-----------|-------|
| Task planning | 1000 input + 500 output | ~$0.01 | $0.50 |
| Memory naming | 200 input + 10 output | ~$0.001 | $0.05 |
| Tab grouping | 300 input + 20 output | ~$0.002 | $0.10 |

**Total demo cost:** <$1.00

## Error Handling

### Rate Limits
- Claude: 50 req/min (tier 1)
- Implement exponential backoff in `llm-client.ts`

### Timeout
- Set 10s timeout per request
- If timeout: fall back to heuristic planner (no LLM)

### API Key Invalid
- Check on app startup via test request
- Show clear error modal if invalid
- Don't silently fail (confuses demo)

## Testing Without API Key

Use mock LLM client for development:

```typescript
// agent-core/llm-client.mock.ts
export async function callLLM(system: string, user: string) {
  // Return canned TaskPlan for common intents
  if (user.includes('fill form')) {
    return JSON.stringify({
      id: 'plan_mock',
      steps: [{ id: 'step_1', action: { type: 'fill', ... } }]
    });
  }
  throw new Error('Mock LLM: unrecognized intent');
}
```

## Next Steps

- [DeepSeek Integration Details](./deepseek-integration.md)
- [Qwen Integration Details](./qwen-integration.md)
- [Development Setup](../dev/setup.md)
