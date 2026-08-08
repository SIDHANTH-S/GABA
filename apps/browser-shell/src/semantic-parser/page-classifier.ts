/**
 * semantic-parser/page-classifier.ts
 * Classifies page intent from URL and DOM signals
 * Dependencies: shared/types, shared/constants
 */

import type { AXNode, PageIntent } from '../shared/types';
import { INTENT_PATTERNS } from '../shared/constants';

/**
 * Classify page intent from URL and nodes
 */
export function classifyIntent(url: string, nodes: AXNode[]): PageIntent {
  // Try URL patterns first
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(url)) {
      return intent as PageIntent;
    }
  }
  
  // Analyze DOM structure
  const hasPaymentFields = nodes.some(n => {
    const text = (n.name || '').toLowerCase();
    return text.includes('card number') || text.includes('cvv');
  });
  
  if (hasPaymentFields) return 'checkout';
  
  const hasLoginFields = nodes.some(n => {
    const text = (n.name || '').toLowerCase();
    return text.includes('username') || text.includes('password');
  });
  
  if (hasLoginFields) return 'login';
  
  const hasFormFields = nodes.some(n =>
    n.role === 'textbox' || n.role === 'combobox'
  );
  
  if (hasFormFields) return 'form-fill';
  
  const hasProductCards = nodes.filter(n => {
    const text = (n.name || '').toLowerCase();
    return text.includes('$') || text.includes('price');
  }).length > 3;
  
  if (hasProductCards) return 'product-listing';
  
  const hasArticleContent = nodes.some(n => n.role === 'article');
  if (hasArticleContent) return 'article';
  
  const hasDashboardElements = nodes.some(n => {
    const text = (n.name || '').toLowerCase();
    return text.includes('dashboard') || text.includes('overview');
  });
  
  if (hasDashboardElements) return 'dashboard';
  
  return 'unknown';
}
