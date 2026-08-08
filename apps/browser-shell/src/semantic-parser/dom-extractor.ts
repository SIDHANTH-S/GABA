/**
 * semantic-parser/dom-extractor.ts
 * Fetches and normalizes accessibility tree from CDP
 * Dependencies: agent-core/cdp-bridge, shared/types, shared/constants
 */

import type { CDPSession, AXNode } from '../shared/types';
import { PARSER_CONFIG } from '../shared/constants';
import { getAccessibilityTree } from '../agent-core/cdp-bridge';

/**
 * Extract accessibility tree from CDP
 */
export async function extractAXTree(session: CDPSession): Promise<AXNode[]> {
  try {
    const nodes = await getAccessibilityTree(session);
    return nodes;
  } catch (err) {
    console.error('[DOM Extractor] Failed to extract AX tree:', err);
    return [];
  }
}

/**
 * Flatten tree structure to array
 */
export function flattenTree(root: AXNode): AXNode[] {
  const result: AXNode[] = [];
  
  function traverse(node: AXNode) {
    result.push(node);
    for (const child of node.children || []) {
      traverse(child);
    }
  }
  
  traverse(root);
  return result;
}

/**
 * Filter out irrelevant nodes
 */
export function filterRelevantNodes(nodes: AXNode[]): AXNode[] {
  return nodes.filter(node => {
    // Remove explicitly excluded roles
    if (PARSER_CONFIG.EXCLUDED_ROLES.includes(node.role as 'none' | 'generic' | 'presentation')) {
      return false;
    }
    
    // Remove generic nodes with no name
    if (node.role === 'generic' && !node.name) {
      return false;
    }
    
    // Remove hidden nodes
    const isHidden = node.properties?.hidden === true;
    if (isHidden) {
      return false;
    }
    
    return true;
  });
}

/**
 * Build tree structure from flat array
 */
export function buildTreeFromFlat(nodes: AXNode[]): AXNode | null {
  if (nodes.length === 0) return null;
  
  const nodeMap = new Map<string, AXNode>();
  const childrenMap = new Map<string, string[]>();
  
  // First pass: build maps
  for (const node of nodes) {
    nodeMap.set(node.nodeId, { ...node, children: [] });
  }
  
  // Second pass: build tree
  let root: AXNode | null = null;
  for (const node of nodes) {
    if (!node.nodeId) continue;
    
    // First node is typically root
    if (!root) {
      root = nodeMap.get(node.nodeId) || null;
    }
  }
  
  return root;
}
