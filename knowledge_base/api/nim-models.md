# NVIDIA NIM Models Reference

This project uses NVIDIA NIM API instead of Anthropic. All models are accessed via OpenAI-compatible interface.

## API Configuration

```typescript
// Base URL (already configured in llm-client.ts)
const baseURL = 'https://integrate.api.nvidia.com/v1';

// Your API key (set in .env)
NIM_API_KEY=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
```

## Available Models

### 1. Qwen 2.5 Coder 32B Instruct ⭐ (Current Default)

**Model ID**: `qwen/qwen2.5-coder-32b-instruct`

**Best for**: 
- Structured JSON outputs (task planning)
- Code generation and analysis
- Fast responses (<2s typical)

**Settings**:
```typescript
{
  model: 'qwen/qwen2.5-coder-32b-instruct',
  max_tokens: 1024,
  temperature: 0.2,
  top_p: 0.7,
}
```

**Why we use it**: Optimized for coding tasks, reliable structured output, fast inference.

---

### 2. Llama 3.3 70B Instruct

**Model ID**: `meta/llama-3.3-70b-instruct`

**Best for**:
- General reasoning
- Natural language understanding
- Complex multi-step planning

**Settings**:
```typescript
{
  model: 'meta/llama-3.3-70b-instruct',
  max_tokens: 1024,
  temperature: 0.2,
  top_p: 0.7,
}
```

**When to use**: If you need better natural language understanding over strict JSON formatting.

---

### 3. Nemotron 3 Nano Omni 30B Reasoning

**Model ID**: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`

**Best for**:
- Complex reasoning with explicit chain-of-thought
- Long-form analysis
- Multi-step problem solving

**Settings**:
```typescript
{
  model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  max_tokens: 65536,      // Much higher token limit
  temperature: 0.6,
  top_p: 0.95,
  reasoning_budget: 16384, // Special parameter for reasoning steps
}
```

**When to use**: For complex agent behaviors that benefit from explicit reasoning (not MVP scope).

---

## Switching Models

To change the model used by the agent:

### Option 1: Edit constants (affects entire app)

```typescript
// In shared/constants.ts
export const LLM_CONFIG = {
  MODEL: 'meta/llama-3.3-70b-instruct', // Change this
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.2,
  // ...
};
```

### Option 2: Per-call override (advanced)

```typescript
// In agent-core/planner.ts or executor.ts
await callLLM(systemPrompt, userMessage, {
  maxTokens: 2048,
  temperature: 0.4,
  // Note: Model switching requires modifying callLLM signature
});
```

---

## Rate Limits

NVIDIA NIM free tier (as of 2026):
- **Requests**: ~100 requests/minute per model
- **Tokens**: No explicit token limit per day (subject to change)
- **Concurrent**: Up to 10 parallel requests

If you hit rate limits:
1. Add exponential backoff in `llm-client.ts`
2. Reduce retry attempts in `executor.ts`
3. Upgrade to paid tier

---

## API Error Handling

Common errors and fixes:

### 401 Unauthorized
```
Error: API key invalid
```
**Fix**: Verify `NIM_API_KEY` in `.env` file is correct.

### 429 Too Many Requests
```
Error: Rate limit exceeded
```
**Fix**: Add delay between requests or upgrade tier.

### 400 Bad Request
```
Error: Invalid model name
```
**Fix**: Check model ID matches exactly (case-sensitive).

---

## Cost Comparison

NVIDIA NIM pricing (estimated):

| Model | Cost per 1M tokens | Speed | Use Case |
|-------|-------------------|-------|----------|
| Qwen Coder | Free tier / $0.50 | Fast (1-2s) | Structured outputs |
| Llama 70B | Free tier / $0.75 | Medium (2-4s) | Reasoning |
| Nemotron | Free tier / $1.00 | Slow (4-8s) | Deep reasoning |

**vs Anthropic Claude Sonnet**: ~$3-5 per 1M tokens

**MVP savings**: ~80% cost reduction using Qwen Coder vs Claude.

---

## Testing Without API Key

Set `MOCK_LLM=true` in `.env`:

```env
MOCK_LLM=true
```

This bypasses all API calls and returns canned responses (see `llm-client.ts`).

---

## Reference Implementation

Your original Python examples mapped to TypeScript:

### Qwen Coder (Python → TypeScript)

**Python**:
```python
from openai import OpenAI
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="nvapi-xxx"
)
completion = client.chat.completions.create(
    model="qwen/qwen2.5-coder-32b-instruct",
    messages=[{"role":"user","content":"Generate JSON"}],
    temperature=0.2,
    top_p=0.7,
    max_tokens=1024,
)
```

**TypeScript** (already implemented in `llm-client.ts`):
```typescript
const response = await client.chat.completions.create({
  model: 'qwen/qwen2.5-coder-32b-instruct',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  temperature: 0.2,
  top_p: 0.7,
  max_tokens: 1024,
  stream: false,
});
```

---

## Advanced: Reasoning Models

If you need explicit reasoning (not MVP scope), use Nemotron with `reasoning_budget`:

```typescript
// Would require extending callLLM function
const response = await client.chat.completions.create({
  model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  messages: [...],
  max_tokens: 65536,
  temperature: 0.6,
  top_p: 0.95,
  reasoning_budget: 16384, // Allocate tokens for reasoning steps
});

// Response includes reasoning field:
console.log(response.choices[0].reasoning); // Chain-of-thought steps
console.log(response.choices[0].message.content); // Final answer
```

---

## Next Steps

1. ✅ NIM API integrated (replaces Anthropic)
2. ✅ Qwen Coder set as default model
3. ⏳ Test with real API key: `npm run dev:electron`
4. 📊 Monitor token usage in NIM dashboard
5. 🔧 Tune temperature/top_p if outputs too deterministic/random

**Get your API key**: https://build.nvidia.com/

---

**Last updated**: 2026-08-07
