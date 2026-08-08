/**
 * semantic-parser/form-analyzer.ts
 * Analyzes forms and infers semantic field types
 * Dependencies: shared/types, shared/constants, shared/utils
 */

import type { AXNode, SemanticForm, FormField, SemanticFieldType, SelectOption } from '../shared/types';
import { FIELD_TYPE_RULES } from '../shared/constants';
import { generateId } from '../shared/utils';

/**
 * Analyze forms in accessibility tree
 */
export function analyzeForms(nodes: AXNode[]): SemanticForm[] {
  const forms: SemanticForm[] = [];
  
  // Find form containers
  const formNodes = nodes.filter(n => n.role === 'form' || hasFormElements(n, nodes));
  
  for (const formNode of formNodes) {
    const fields = extractFields(formNode, nodes);
    if (fields.length === 0) continue;
    
    const submitButton = findSubmitButton(formNode, nodes);
    const isDestructive = detectDestructiveForm(fields, submitButton);
    
    forms.push({
      id: generateId('form'),
      formSelector: generateFormSelector(formNode),
      submitSelector: submitButton?.nodeId ? `[data-node-id="${submitButton.nodeId}"]` : '',
      fields,
      isDestructive,
      submitLabel: submitButton?.name || undefined,
    });
  }
  
  return forms;
}

/**
 * Check if node has form elements
 */
function hasFormElements(node: AXNode, allNodes: AXNode[]): boolean {
  const inputRoles = ['textbox', 'combobox', 'checkbox', 'radio'];
  const children = getNodeChildren(node, allNodes);
  return children.some(child => inputRoles.includes(child.role));
}

/**
 * Get children of a node
 */
function getNodeChildren(node: AXNode, allNodes: AXNode[]): AXNode[] {
  // ponytail: simple linear search, O(n) but forms are small
  return node.children || [];
}

/**
 * Extract fields from form
 */
function extractFields(formNode: AXNode, allNodes: AXNode[]): FormField[] {
  const fields: FormField[] = [];
  
  function traverse(node: AXNode) {
    const inputRoles = ['textbox', 'combobox', 'checkbox', 'radio'];
    
    if (inputRoles.includes(node.role)) {
      const field = createField(node);
      if (field) fields.push(field);
    }
    
    for (const child of node.children || []) {
      traverse(child);
    }
  }
  
  traverse(formNode);
  return fields;
}

/**
 * Create field object from node
 */
function createField(node: AXNode): FormField | null {
  const label = node.name || node.description || '';
  if (!label) return null;
  
  const semanticType = inferFieldType(node);
  const placeholder = (node.properties?.placeholder as string) || undefined;
  const required = node.properties?.required === true;
  const inputType = (node.properties?.type as string) || 'text';
  
  // Extract select options if combobox
  const options = node.role === 'combobox' ? extractSelectOptions(node) : undefined;
  
  return {
    id: generateId('field'),
    label,
    semanticType,
    selector: `[aria-label="${label}"]`,
    required,
    inputType,
    currentValue: node.value,
    placeholder,
    options,
  };
}

/**
 * Infer semantic field type from node
 */
export function inferFieldType(node: AXNode): SemanticFieldType {
  const text = [node.name, node.description, node.properties?.placeholder]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  // Check against type inference rules
  for (const [pattern, type] of FIELD_TYPE_RULES) {
    if (pattern.test(text)) {
      return type as SemanticFieldType;
    }
  }
  
  return 'generic';
}

/**
 * Extract select options from combobox
 */
function extractSelectOptions(node: AXNode): SelectOption[] {
  const options: SelectOption[] = [];
  
  function traverse(n: AXNode) {
    if (n.role === 'option') {
      options.push({
        value: n.value || n.name || '',
        label: n.name || '',
      });
    }
    for (const child of n.children || []) {
      traverse(child);
    }
  }
  
  traverse(node);
  return options;
}

/**
 * Find submit button in form
 */
function findSubmitButton(formNode: AXNode, allNodes: AXNode[]): AXNode | null {
  function traverse(node: AXNode): AXNode | null {
    if (node.role === 'button') {
      const name = (node.name || '').toLowerCase();
      if (name.includes('submit') || name.includes('continue') || name.includes('next')) {
        return node;
      }
    }
    
    for (const child of node.children || []) {
      const result = traverse(child);
      if (result) return result;
    }
    
    return null;
  }
  
  return traverse(formNode);
}

/**
 * Detect if form is destructive (payment, checkout, delete)
 */
function detectDestructiveForm(fields: FormField[], submitButton: AXNode | null): boolean {
  // Check for payment fields
  const hasPaymentFields = fields.some(f =>
    f.semanticType === 'creditCard' || f.semanticType === 'cvv'
  );
  
  if (hasPaymentFields) return true;
  
  // Check submit button text
  if (submitButton) {
    const btnText = (submitButton.name || '').toLowerCase();
    if (btnText.includes('pay') || btnText.includes('purchase') || btnText.includes('checkout')) {
      return true;
    }
    if (btnText.includes('delete') || btnText.includes('remove')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate form selector
 */
function generateFormSelector(node: AXNode): string {
  if (node.domNodeId) {
    return `form[data-node-id="${node.domNodeId}"]`;
  }
  return 'form';
}
