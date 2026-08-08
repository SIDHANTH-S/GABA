/**
 * semantic-parser/entity-detector.ts
 * Detects semantic entities using regex patterns
 * Dependencies: shared/types, shared/constants, shared/utils
 */

import type { AXNode, SemanticEntity, EntityType } from '../shared/types';
import { ENTITY_PATTERNS } from '../shared/constants';
import { generateId } from '../shared/utils';

/**
 * Detect entities from accessibility tree nodes
 */
export function detectEntities(nodes: AXNode[]): SemanticEntity[] {
  const entities: SemanticEntity[] = [];
  
  for (const node of nodes) {
    const text = [node.name, node.value, node.description]
      .filter(Boolean)
      .join(' ');
    
    if (!text) continue;
    
    // Detect prices
    const priceMatches = text.matchAll(ENTITY_PATTERNS.PRICE);
    for (const match of priceMatches) {
      entities.push(createEntity('price', match[0], node, 0.9));
    }
    
    // Detect dates
    const dateMatches = text.matchAll(ENTITY_PATTERNS.DATE);
    for (const match of dateMatches) {
      entities.push(createEntity('date', match[0], node, 0.85));
    }
    
    // Detect emails
    const emailMatches = text.matchAll(ENTITY_PATTERNS.EMAIL);
    for (const match of emailMatches) {
      entities.push(createEntity('email', match[0], node, 0.95));
    }
    
    // Detect phone numbers
    const phoneMatches = text.matchAll(ENTITY_PATTERNS.PHONE);
    for (const match of phoneMatches) {
      entities.push(createEntity('phone', match[0], node, 0.85));
    }
    
    // Detect URLs
    const urlMatches = text.matchAll(ENTITY_PATTERNS.URL);
    for (const match of urlMatches) {
      entities.push(createEntity('url', match[0], node, 0.95));
    }
    
    // Detect percentages
    const percentMatches = text.matchAll(ENTITY_PATTERNS.PERCENTAGE);
    for (const match of percentMatches) {
      entities.push(createEntity('percentage', match[0], node, 0.9));
    }
    
    // Detect order numbers
    const orderMatches = text.matchAll(ENTITY_PATTERNS.ORDER_NUMBER);
    for (const match of orderMatches) {
      entities.push(createEntity('order-number', match[1], node, 0.8));
    }
  }
  
  // Deduplicate by value
  return deduplicateEntities(entities);
}

/**
 * Create entity object
 */
function createEntity(
  type: EntityType,
  value: string,
  node: AXNode,
  confidence: number
): SemanticEntity {
  return {
    id: generateId('entity'),
    type,
    value: value.trim(),
    normalizedValue: normalizeEntityValue(type, value),
    confidence,
    domSelector: generateSelector(node),
  };
}

/**
 * Normalize entity value
 */
function normalizeEntityValue(type: EntityType, value: string): string {
  switch (type) {
    case 'price':
      // Extract numeric value
      return value.replace(/[^0-9.]/g, '');
    case 'phone':
      // Remove formatting
      return value.replace(/[^0-9]/g, '');
    case 'percentage':
      // Extract numeric value
      return value.replace('%', '').trim();
    default:
      return value.trim();
  }
}

/**
 * Generate CSS selector for node
 */
function generateSelector(node: AXNode): string {
  // ponytail: simple selector generation, upgrade to full xpath if needed
  if (node.domNodeId) {
    return `[data-node-id="${node.domNodeId}"]`;
  }
  if (node.name) {
    return `[aria-label="${node.name}"]`;
  }
  return '';
}

/**
 * Deduplicate entities by value
 */
function deduplicateEntities(entities: SemanticEntity[]): SemanticEntity[] {
  const seen = new Set<string>();
  return entities.filter(entity => {
    const key = `${entity.type}:${entity.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
