/**
 * semantic-parser/semantic-model-builder.ts
 * Orchestrates all sub-parsers to build complete SemanticPageModel
 * Dependencies: all semantic-parser modules, electron-main/cdp-bridge
 */

import type { CDPSession, SemanticPageModel } from '../shared/types';
import { extractAXTree, flattenTree, filterRelevantNodes } from './dom-extractor';
import { detectEntities } from './entity-detector';
import { analyzeForms } from './form-analyzer';
import { classifyIntent } from './page-classifier';
import { detectDocuments } from './document-detector';
import { discoverActions } from './action-discoverer';
import { extractPageSource } from '../electron-main/cdp-bridge';
import { extractDOMSemantics } from './dom-semantic-extractor';

/**
 * Build complete semantic page model
 */
export async function buildSemanticModel(
  session: CDPSession,
  url: string
): Promise<SemanticPageModel> {
  try {
    // Get page metadata and accessibility tree in parallel
    const [pageInfo, axTree] = await Promise.all([
      extractPageSource(session),
      extractAXTree(session),
    ]);
    
    // Process tree
    let nodes = axTree;
    if (nodes.length > 0 && nodes[0].children) {
      const flat = flattenTree(nodes[0]);
      nodes = filterRelevantNodes(flat);
    }
    
    // Run all parsers in parallel. DOM semantics provide executable selectors;
    // AX semantics add accessibility-only context where available.
    const [entities, forms, actions, documents, intent, dom] = await Promise.all([
      Promise.resolve(detectEntities(nodes)),
      Promise.resolve(analyzeForms(nodes)),
      Promise.resolve(discoverActions(nodes)),
      Promise.resolve(detectDocuments(nodes)),
      Promise.resolve(classifyIntent(url, nodes)),
      extractDOMSemantics(session).catch((err) => {
        console.error('[Semantic Model Builder] DOM extraction failed:', err);
        return { entities: [], forms: [], actions: [], documents: [], metadata: {} };
      }),
    ]);
    
    // Extract navigation items
    const navigation = extractNavItems(nodes);
    
    return {
      url: pageInfo.url || url,
      title: pageInfo.title || '',
      pageIntent: intent === 'unknown' ? inferIntentFromDOM(dom, url) : intent,
      timestamp: Date.now(),
      entities: mergeByKey(dom.entities, entities, (entity) => `${entity.type}:${entity.value}`),
      forms: dom.forms.length > 0 ? dom.forms : forms,
      actions: mergeByKey(dom.actions, actions, (action) => `${action.type}:${action.label}`),
      navigation,
      documents: mergeByKey(dom.documents, documents, (document) => `${document.type}:${document.url}`),
      metadata: dom.metadata,
    };
  } catch (err) {
    console.error('[Semantic Model Builder] Failed:', err);
    
    // Return empty model on error
    return {
      url,
      title: '',
      pageIntent: 'unknown',
      timestamp: Date.now(),
      entities: [],
      forms: [],
      actions: [],
      navigation: [],
      documents: [],
      metadata: {},
    };
  }
}

function mergeByKey<T>(primary: T[], secondary: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function inferIntentFromDOM(
  dom: { forms: any[]; actions: any[]; documents: any[]; entities: any[] },
  url: string
): SemanticPageModel['pageIntent'] {
  const combined = `${url} ${dom.actions.map((a) => a.label).join(' ')}`.toLowerCase();
  if (dom.documents.length > 0 || /pdf|invoice|bill|statement|document/.test(combined)) return 'document';
  if (dom.forms.some((form) => form.isDestructive) || /checkout|payment|cart|pay/.test(combined)) return 'checkout';
  if (dom.forms.length > 0) return /login|sign in|password/.test(combined) ? 'login' : 'form-fill';
  if (dom.entities.some((entity) => entity.type === 'price') || /product|shop|buy/.test(combined)) return 'product-listing';
  if (/search|query|results/.test(combined)) return 'search';
  return 'unknown';
}

/**
 * Extract navigation items from nodes
 */
function extractNavItems(nodes: any[]): Array<{ label: string; href: string }> {
  const navItems: Array<{ label: string; href: string }> = [];
  
  // Find navigation role nodes
  const navNodes = nodes.filter(n => n.role === 'navigation');
  
  for (const navNode of navNodes) {
    // Find links within navigation
    const links = findLinksInSubtree(navNode, nodes);
    navItems.push(...links);
  }
  
  // Limit to first 20 nav items
  return navItems.slice(0, 20);
}

/**
 * Find all links in subtree
 */
function findLinksInSubtree(
  node: any,
  allNodes: any[]
): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  
  function traverse(n: any) {
    if (n.role === 'link' && n.name) {
      const href = n.properties?.href as string;
      if (href) {
        links.push({
          label: n.name,
          href,
        });
      }
    }
    
    for (const child of n.children || []) {
      traverse(child);
    }
  }
  
  traverse(node);
  return links;
}
