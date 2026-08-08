/**
 * shared/nim-models.ts
 * Available NVIDIA NIM models with their characteristics
 */

export const NIM_MODELS = {
  // Fast coding model (recommended for MVP)
  QWEN_CODER: {
    id: 'qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    description: 'Fast coding-optimized model, best for structured outputs',
    maxTokens: 1024,
    temperature: 0.2,
  },
  
  // General purpose reasoning
  LLAMA_70B: {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'General purpose model with strong reasoning',
    maxTokens: 1024,
    temperature: 0.2,
  },
  
  // Advanced reasoning with chain-of-thought
  NEMOTRON_REASONING: {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron 3 Nano Omni 30B',
    description: 'Advanced reasoning model with explicit reasoning steps',
    maxTokens: 65536,
    temperature: 0.6,
    reasoningBudget: 16384, // Special parameter for reasoning models
  },
} as const;

export type NIMModelId = typeof NIM_MODELS[keyof typeof NIM_MODELS]['id'];
