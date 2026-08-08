/**
 * shared/utils.ts
 * Pure utility functions used by both main and renderer
 * Dependencies: shared/constants
 */

import { PII_PATTERNS } from './constants';

/**
 * Redacts PII from text before sending to LLM
 */
export function redactPII(text: string): string {
  return text
    .replace(PII_PATTERNS.CREDIT_CARD, '[CARD]')
    .replace(PII_PATTERNS.SSN, '[SSN]')
    .replace(PII_PATTERNS.EMAIL, '[EMAIL]')
    .replace(PII_PATTERNS.PASSWORD_FIELD, 'password: [REDACTED]');
}

/**
 * Normalizes CSS selectors for consistency
 */
export function normalizeSelector(selector: string): string {
  return selector.trim().replace(/\s+/g, ' ');
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Safely parses JSON with fallback
 */
export function safeJSONParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * Compacts SemanticPageModel for LLM (removes verbose fields)
 */
export function compactForLLM(model: any): any {
  return {
    url: model.url,
    pageIntent: model.pageIntent,
    entities: model.entities.slice(0, 20).map((e: any) => ({
      type: e.type,
      value: e.value,
    })),
    forms: model.forms.map((f: any) => ({
      fields: f.fields.map((field: any) => ({
        label: field.label,
        semanticType: field.semanticType,
        required: field.required,
      })),
      isDestructive: f.isDestructive,
    })),
    actions: model.actions.slice(0, 10).map((a: any) => ({
      label: a.label,
      type: a.type,
    })),
  };
}

/**
 * Formats duration in ms to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Truncates text to max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
