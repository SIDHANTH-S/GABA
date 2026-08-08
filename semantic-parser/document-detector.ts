/**
 * semantic-parser/document-detector.ts
 * Detects PDFs, invoices, bills, and other downloadable documents
 * Dependencies: shared/types, shared/utils
 */

import type { AXNode, DetectedDocument } from '../shared/types';
import { generateId } from '../shared/utils';

/**
 * Detect documents in accessibility tree
 */
export function detectDocuments(nodes: AXNode[]): DetectedDocument[] {
  const documents: DetectedDocument[] = [];
  
  for (const node of nodes) {
    if (node.role !== 'link') continue;
    
    const href = node.properties?.href as string;
    const name = node.name || '';
    
    if (!href) continue;
    
    // Detect PDFs
    if (href.toLowerCase().endsWith('.pdf')) {
      documents.push({
        type: 'pdf',
        url: href,
        title: name || 'PDF Document',
        selector: generateSelector(node),
      });
      continue;
    }
    
    // Detect invoices
    if (/invoice|bill|statement|receipt/i.test(name)) {
      const type = detectDocType(name);
      documents.push({
        type,
        url: href,
        title: name,
        selector: generateSelector(node),
      });
      continue;
    }
    
    // Detect spreadsheets
    if (/(\.xlsx?|\.csv|spreadsheet)/i.test(href)) {
      documents.push({
        type: 'spreadsheet',
        url: href,
        title: name || 'Spreadsheet',
        selector: generateSelector(node),
      });
    }
  }
  
  return documents;
}

/**
 * Detect specific document type from text
 */
function detectDocType(text: string): 'invoice' | 'bill' | 'report' | 'pdf' {
  const lower = text.toLowerCase();
  if (lower.includes('invoice')) return 'invoice';
  if (lower.includes('bill')) return 'bill';
  if (lower.includes('report')) return 'report';
  return 'pdf';
}

/**
 * Generate selector for node
 */
function generateSelector(node: AXNode): string {
  const href = node.properties?.href as string;
  if (href) {
    return `a[href="${href}"]`;
  }
  if (node.name) {
    return `a[aria-label="${node.name}"]`;
  }
  return 'a';
}
