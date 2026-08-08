/**
 * agent-core/extractor.ts
 * Converts SemanticPageModel to JSON/CSV formats
 * Dependencies: shared/types, papaparse
 */

import type { SemanticPageModel } from '../shared/types';
import * as Papa from 'papaparse';

/**
 * Extract page data to JSON
 */
export function extractToJSON(model: SemanticPageModel): string {
  const data = {
    url: model.url,
    title: model.title,
    pageIntent: model.pageIntent,
    extractedAt: new Date().toISOString(),
    entities: model.entities.map(e => ({
      type: e.type,
      value: e.value,
      normalizedValue: e.normalizedValue,
    })),
    forms: model.forms.map(f => ({
      fields: f.fields.map(field => ({
        label: field.label,
        type: field.semanticType,
        value: field.currentValue,
      })),
    })),
    actions: model.actions.map(a => ({
      label: a.label,
      type: a.type,
      href: a.href,
    })),
    documents: model.documents,
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Extract page data to CSV
 */
export function extractToCSV(model: SemanticPageModel): string {
  // Prioritize entities as rows
  if (model.entities.length > 0) {
    const rows = model.entities.map(e => ({
      Type: e.type,
      Value: e.value,
      NormalizedValue: e.normalizedValue || '',
    }));
    
    return Papa.unparse(rows);
  }
  
  // Fallback to actions
  if (model.actions.length > 0) {
    const rows = model.actions.map(a => ({
      Label: a.label,
      Type: a.type,
      Link: a.href || '',
    }));
    
    return Papa.unparse(rows);
  }
  
  // Fallback to basic info
  return Papa.unparse([
    {
      URL: model.url,
      Title: model.title,
      Intent: model.pageIntent,
    },
  ]);
}
