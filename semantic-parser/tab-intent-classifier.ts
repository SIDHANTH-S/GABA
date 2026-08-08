/**
 * semantic-parser/tab-intent-classifier.ts
 * Classifies per-tab intent for smart grouping
 * Dependencies: shared/types, shared/constants
 */

import type { PageIntent } from '../shared/types';
import { INTENT_PATTERNS } from '../shared/constants';

/**
 * Classify tab intent from URL (no CDP needed for this)
 */
export function classifyTabIntent(url: string, title?: string): PageIntent {
  // Check URL patterns
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(url)) {
      return intent as PageIntent;
    }
  }
  
  // Check title if provided
  if (title) {
    for (const [pattern, intent] of INTENT_PATTERNS) {
      if (pattern.test(title)) {
        return intent as PageIntent;
      }
    }
  }
  
  // Domain-based heuristics
  const domain = extractDomain(url);
  
  if (/github|gitlab|bitbucket/i.test(domain)) {
    return 'dashboard';
  }
  
  if (/docs?\.|documentation|wiki/i.test(domain)) {
    return 'document';
  }
  
  if (/amazon|ebay|shop|store/i.test(domain)) {
    return 'product-listing';
  }
  
  if (/news|blog|article/i.test(domain)) {
    return 'article';
  }
  
  return 'unknown';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}
