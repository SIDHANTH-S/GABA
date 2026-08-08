/**
 * semantic-parser/action-discoverer.ts
 * Discovers clickable actions with semantic labels
 * Dependencies: shared/types, shared/utils
 */

import type { AXNode, PageAction } from '../shared/types';
import { generateId } from '../shared/utils';

/**
 * Discover page actions from nodes
 */
export function discoverActions(nodes: AXNode[]): PageAction[] {
  const actions: PageAction[] = [];
  
  for (const node of nodes) {
    // Buttons
    if (node.role === 'button' && node.name) {
      actions.push(createAction(node, 'click', 'cta'));
    }
    
    // Links
    if (node.role === 'link' && node.name) {
      const href = node.properties?.href as string;
      const type = href && href.startsWith('http') ? 'navigate' : 'click';
      actions.push(createAction(node, type, 'navigation', href));
    }
    
    // Submit inputs
    if (node.role === 'button' && /submit|send|continue/i.test(node.name || '')) {
      actions.push(createAction(node, 'submit', 'form'));
    }
  }
  
  return deduplicateActions(actions);
}

/**
 * Create action object
 */
function createAction(
  node: AXNode,
  type: PageAction['type'],
  context: string,
  href?: string
): PageAction {
  return {
    id: generateId('action'),
    label: node.name || '',
    selector: generateSelector(node),
    type,
    context,
    href,
  };
}

/**
 * Generate selector for node
 */
function generateSelector(node: AXNode): string {
  if (node.domNodeId) {
    return `[data-node-id="${node.domNodeId}"]`;
  }
  if (node.name) {
    return `[aria-label="${node.name}"]`;
  }
  return '';
}

/**
 * Deduplicate actions by label
 */
function deduplicateActions(actions: PageAction[]): PageAction[] {
  const seen = new Set<string>();
  return actions.filter(action => {
    if (seen.has(action.label)) return false;
    seen.add(action.label);
    return true;
  });
}
