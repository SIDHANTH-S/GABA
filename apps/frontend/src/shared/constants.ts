/**
 * shared/constants.ts
 * All IPC channel names, regex patterns, and configuration defaults
 * Dependencies: none
 */

// ============================================================
// IPC CHANNELS
// ============================================================

export const CHANNELS = {
  // Page understanding
  PAGE_GET_SEMANTIC_MODEL: 'page:get-semantic-model',
  PAGE_SUBSCRIBE_UPDATES: 'page:subscribe-updates',
  PAGE_NAVIGATE: 'page:navigate',

  // Agent lifecycle
  AGENT_RUN_TASK: 'agent:run-task',
  AGENT_TASK_PROGRESS: 'agent:task-progress',
  AGENT_CHECKPOINT_REQUEST: 'agent:checkpoint-request',
  AGENT_CHECKPOINT_RESOLVE: 'agent:checkpoint-resolve',

  // Memory operations
  MEMORY_GET_PROFILE: 'memory:get-profile',
  MEMORY_GET_DOMAIN: 'memory:get-domain',
  MEMORY_SET_PROFILE: 'memory:set-profile',

  // Workflow operations
  WORKFLOW_START_RECORDING: 'workflow:start-recording',
  WORKFLOW_STOP_RECORDING: 'workflow:stop-recording',
  WORKFLOW_REPLAY: 'workflow:replay',
  WORKFLOW_LIST: 'workflow:list',

  // Data extraction
  EXTRACT_PAGE_DATA: 'extract:page-data',

  // Tab management
  TABS_GET_GROUPS: 'tabs:get-groups',
  TABS_GROUP_BY_INTENT: 'tabs:group-by-intent',

  // UI control
  UI_TOGGLE_COMMAND_BAR: 'ui:toggle-command-bar',
  UI_DISMISS_OVERLAYS: 'ui:dismiss-overlays',
  UI_SET_OVERLAY_VISIBLE: 'ui:set-overlay-visible',
} as const;

// ============================================================
// PII REDACTION PATTERNS
// ============================================================

export const PII_PATTERNS = {
  CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PASSWORD_FIELD: /password['":\s]+[^\s,}"']+/gi,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
} as const;

// ============================================================
// SEMANTIC PARSER CONFIG
// ============================================================

export const PARSER_CONFIG = {
  TIMEOUT_MS: 5000,
  MAX_ENTITIES: 100,
  MIN_CONFIDENCE: 0.5,
  RELEVANT_ROLES: [
    'button', 'link', 'textbox', 'combobox', 'checkbox',
    'radio', 'heading', 'article', 'navigation', 'main',
    'form', 'table', 'row', 'cell', 'listitem'
  ],
  EXCLUDED_ROLES: ['none', 'generic', 'presentation'],
} as const;

// ============================================================
// FORM FIELD TYPE INFERENCE RULES
// ============================================================

export const FIELD_TYPE_RULES: [RegExp, string][] = [
  [/first.?name|given.?name/i, 'firstName'],
  [/last.?name|family.?name|surname/i, 'lastName'],
  [/full.?name|your.?name|name/i, 'fullName'],
  [/e.?mail/i, 'email'],
  [/phone|mobile|tel/i, 'phone'],
  [/street|address.?1|addr/i, 'address'],
  [/city|town/i, 'city'],
  [/state|province|region/i, 'state'],
  [/zip|postal/i, 'zip'],
  [/country/i, 'country'],
  [/card.?number|cc.?num/i, 'creditCard'],
  [/cvv|cvc|security.?code/i, 'cvv'],
  [/expir|exp.?date/i, 'expiry'],
  [/user.?name|login/i, 'username'],
  [/password|passcode/i, 'password'],
  [/search/i, 'search'],
];

// ============================================================
// ENTITY DETECTION PATTERNS
// ============================================================

export const ENTITY_PATTERNS = {
  PRICE: /\$\s?\d{1,3}(,\d{3})*(\.\d{2})?|\d{1,3}(,\d{3})*(\.\d{2})?\s?(?:USD|EUR|GBP)/gi,
  DATE: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s?\d{3}[-.]?\d{4}/g,
  URL: /https?:\/\/[^\s<>"]+/gi,
  PERCENTAGE: /\d+\.?\d*\s?%/g,
  ORDER_NUMBER: /(?:order|tracking|reference)[\s#:]*([A-Z0-9]{6,20})/gi,
} as const;

// ============================================================
// PAGE INTENT CLASSIFICATION PATTERNS
// ============================================================

export const INTENT_PATTERNS: [RegExp, string][] = [
  [/checkout|cart|payment|order/i, 'checkout'],
  [/login|signin|auth/i, 'login'],
  [/docs?|documentation|wiki|guide/i, 'document'],
  [/search|q=|query=/i, 'search'],
  [/article|blog|post/i, 'article'],
  [/dashboard|admin|console/i, 'dashboard'],
  [/product|item|buy|shop/i, 'product-listing'],
];

// ============================================================
// LLM CONFIGURATION (NVIDIA NIM)
// ============================================================

export const LLM_CONFIG = {
  MODEL: 'qwen/qwen2.5-coder-32b-instruct',
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.2,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 2,
} as const;

// ============================================================
// TASK EXECUTION CONFIG
// ============================================================

export const EXECUTION_CONFIG = {
  MAX_STEP_RETRIES: 3,
  RETRY_DELAY_MS: 500,
  CHECKPOINT_TIMEOUT_MS: 60000,
  HUD_AUTO_DISMISS_MS: 2000,
} as const;

// ============================================================
// DEFAULT VALUES
// ============================================================

export const DEFAULTS = {
  USER_PROFILE: {
    id: 'local-user-001',
    firstName: '',
    lastName: '',
    email: '',
    custom: {},
  },
  TAB_GROUP_COLORS: ['blue', 'green', 'orange', 'pink', 'purple', 'red', 'yellow'],
} as const;
