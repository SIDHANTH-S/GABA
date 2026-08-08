/**
 * DOM-backed semantic extraction.
 * The accessibility tree is useful context, but CDP AX node ids are not executable selectors.
 */

import type {
  CDPSession,
  DetectedDocument,
  FormField,
  PageAction,
  SemanticEntity,
  SemanticFieldType,
  SemanticForm,
} from '../shared/types';
import { ENTITY_PATTERNS, FIELD_TYPE_RULES } from '../shared/constants';
import { generateId } from '../shared/utils';
import { executeScript } from '../agent-core/cdp-bridge';

interface RawField {
  label: string;
  selector: string;
  required: boolean;
  inputType: string;
  currentValue?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface RawForm {
  selector: string;
  submitSelector: string;
  submitLabel?: string;
  fields: RawField[];
}

interface RawAction {
  label: string;
  selector: string;
  type: PageAction['type'];
  context: string;
  href?: string;
}

interface RawDocument {
  type: DetectedDocument['type'];
  url: string;
  title: string;
  selector: string;
  size?: string;
}

interface RawDomSemantics {
  text: string;
  forms: RawForm[];
  actions: RawAction[];
  documents: RawDocument[];
  metadata: Record<string, string>;
}

export interface DomSemantics {
  entities: SemanticEntity[];
  forms: SemanticForm[];
  actions: PageAction[];
  documents: DetectedDocument[];
  metadata: Record<string, string>;
}

export async function extractDOMSemantics(session: CDPSession): Promise<DomSemantics> {
  const raw = await executeScript<RawDomSemantics>(session, DOM_EXTRACTION_SCRIPT);

  return {
    entities: detectEntitiesFromText(raw.text || ''),
    forms: raw.forms.map(toSemanticForm),
    actions: dedupeActions(raw.actions.map(toPageAction)),
    documents: raw.documents.map((doc: any) => ({
      type: doc.type,
      url: doc.url,
      title: doc.title,
      selector: doc.selector,
      size: doc.size,
    })),
    metadata: raw.metadata || {},
  };
}

function toSemanticForm(raw: RawForm): SemanticForm {
  const fields = raw.fields.map(toFormField);
  return {
    id: generateId('form'),
    formSelector: raw.selector,
    submitSelector: raw.submitSelector,
    fields,
    isDestructive: isDestructiveForm(fields, raw.submitLabel),
    submitLabel: raw.submitLabel,
  };
}

function toFormField(raw: RawField): FormField {
  return {
    id: generateId('field'),
    label: raw.label || raw.placeholder || raw.inputType,
    semanticType: inferFieldType(raw),
    selector: raw.selector,
    required: raw.required,
    inputType: raw.inputType,
    currentValue: raw.currentValue,
    placeholder: raw.placeholder,
    options: raw.options,
  };
}

function toPageAction(raw: RawAction): PageAction {
  return {
    id: generateId('action'),
    label: raw.label,
    selector: raw.selector,
    type: raw.type,
    context: raw.context,
    href: raw.href,
  };
}

function inferFieldType(field: RawField): SemanticFieldType {
  const text = [field.label, field.placeholder, field.inputType].filter(Boolean).join(' ');
  for (const [pattern, type] of FIELD_TYPE_RULES) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return type as SemanticFieldType;
  }
  return 'generic';
}

function isDestructiveForm(fields: FormField[], submitLabel = ''): boolean {
  const hasPaymentField = fields.some((field) =>
    ['creditCard', 'cvv', 'expiry'].includes(field.semanticType)
  );
  const destructiveLabel = /pay|purchase|checkout|submit|delete|remove|send|confirm/i.test(submitLabel);
  return hasPaymentField || destructiveLabel;
}

function detectEntitiesFromText(text: string): SemanticEntity[] {
  const entities: SemanticEntity[] = [];
  const addMatches = (type: SemanticEntity['type'], pattern: RegExp, confidence: number) => {
    pattern.lastIndex = 0;
    const seen = new Set<string>();
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      entities.push({
        id: generateId('entity'),
        type,
        value,
        confidence,
        domSelector: 'body',
      });
    }
  };

  addMatches('price', ENTITY_PATTERNS.PRICE, 0.9);
  addMatches('date', ENTITY_PATTERNS.DATE, 0.82);
  addMatches('email', ENTITY_PATTERNS.EMAIL, 0.95);
  addMatches('phone', ENTITY_PATTERNS.PHONE, 0.85);
  addMatches('url', ENTITY_PATTERNS.URL, 0.8);
  addMatches('percentage', ENTITY_PATTERNS.PERCENTAGE, 0.78);
  addMatches('order-number', ENTITY_PATTERNS.ORDER_NUMBER, 0.75);

  return entities.slice(0, 100);
}

function dedupeActions(actions: PageAction[]): PageAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.type}:${action.label}:${action.selector}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(action.label && action.selector);
  }).slice(0, 80);
}

const DOM_EXTRACTION_SCRIPT = `(() => {
  const cssEscape = (value) => {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
  };

  const isVisible = (el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };

  const selectorFor = (el) => {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + cssEscape(el.id);
    const testId = el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('name');
    if (testId) return el.tagName.toLowerCase() + '[' + (el.getAttribute('name') ? 'name' : el.getAttribute('data-testid') ? 'data-testid' : 'data-test') + '="' + testId.replace(/"/g, '\\\\"') + '"]';
    const aria = el.getAttribute('aria-label');
    if (aria) return el.tagName.toLowerCase() + '[aria-label="' + aria.replace(/"/g, '\\\\"') + '"]';

    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (!parent) break;
      const sameTag = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
      if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  };

  const textOf = (el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();

  const labelFor = (field) => {
    if (field.getAttribute('aria-label')) return field.getAttribute('aria-label');
    if (field.labels && field.labels.length) return Array.from(field.labels).map(textOf).join(' ').trim();
    if (field.id) {
      const label = document.querySelector('label[for="' + cssEscape(field.id) + '"]');
      if (label) return textOf(label);
    }
    const wrapper = field.closest('label');
    if (wrapper) return textOf(wrapper).replace(textOf(field), '').trim() || textOf(wrapper);
    return field.getAttribute('placeholder') || field.getAttribute('name') || field.getAttribute('type') || field.tagName.toLowerCase();
  };

  const fieldNodes = Array.from(document.querySelectorAll('input, textarea, select')).filter((el) => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    return !['hidden', 'submit', 'button', 'reset', 'image'].includes(type) && isVisible(el);
  });

  const forms = Array.from(document.querySelectorAll('form')).map((form) => {
    const fields = fieldNodes.filter((field) => form.contains(field));
    const submit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), [role="button"]');
    return {
      selector: selectorFor(form),
      submitSelector: selectorFor(submit),
      submitLabel: submit ? (submit.value || textOf(submit) || submit.getAttribute('aria-label') || 'Submit') : '',
      fields: fields.map((field) => ({
        label: labelFor(field),
        selector: selectorFor(field),
        required: Boolean(field.required || field.getAttribute('aria-required') === 'true'),
        inputType: (field.getAttribute('type') || field.tagName.toLowerCase()).toLowerCase(),
        currentValue: field.value || '',
        placeholder: field.getAttribute('placeholder') || '',
        options: field.tagName.toLowerCase() === 'select'
          ? Array.from(field.options).map((option) => ({ value: option.value, label: option.textContent.trim() }))
          : undefined,
      })),
    };
  }).filter((form) => form.fields.length > 0);

  const orphanFields = fieldNodes.filter((field) => !field.closest('form'));
  if (orphanFields.length > 0) {
    const submit = document.querySelector('button[type="submit"], input[type="submit"], button, [role="button"]');
    forms.push({
      selector: 'body',
      submitSelector: selectorFor(submit),
      submitLabel: submit ? (submit.value || textOf(submit) || submit.getAttribute('aria-label') || 'Submit') : '',
      fields: orphanFields.map((field) => ({
        label: labelFor(field),
        selector: selectorFor(field),
        required: Boolean(field.required || field.getAttribute('aria-required') === 'true'),
        inputType: (field.getAttribute('type') || field.tagName.toLowerCase()).toLowerCase(),
        currentValue: field.value || '',
        placeholder: field.getAttribute('placeholder') || '',
        options: field.tagName.toLowerCase() === 'select'
          ? Array.from(field.options).map((option) => ({ value: option.value, label: option.textContent.trim() }))
          : undefined,
      })),
    });
  }

  const actionNodes = Array.from(document.querySelectorAll('button, a[href], input[type="button"], input[type="submit"], [role="button"]')).filter(isVisible);
  const actions = actionNodes.map((el) => {
    const href = el.href || el.getAttribute('href') || '';
    const label = (el.value || textOf(el) || el.getAttribute('aria-label') || el.getAttribute('title') || href || '').trim();
    const lower = label.toLowerCase();
    const type = el.tagName.toLowerCase() === 'a'
      ? 'navigate'
      : /submit|send|continue|confirm|pay|purchase|checkout|save/i.test(lower)
        ? 'submit'
        : 'click';
    return {
      label: label.slice(0, 120),
      selector: selectorFor(el),
      type,
      context: el.closest('form') ? 'form' : el.tagName.toLowerCase() === 'a' ? 'navigation' : 'button',
      href: href || undefined,
    };
  }).filter((action) => action.label && action.selector);

  const documents = Array.from(document.querySelectorAll('a[href]')).map((el) => {
    const href = new URL(el.getAttribute('href'), window.location.href).href;
    const label = textOf(el) || href.split('/').pop() || 'Document';
    const lower = (href + ' ' + label).toLowerCase();
    if (!/\\.pdf($|[?#])|invoice|bill|statement|report|\\.csv($|[?#])|\\.xlsx($|[?#])/.test(lower)) return null;
    let type = 'report';
    if (lower.includes('.pdf')) type = 'pdf';
    if (lower.includes('invoice')) type = 'invoice';
    if (lower.includes('bill') || lower.includes('statement')) type = 'bill';
    if (/\\.csv|\\.xlsx/.test(lower)) type = 'spreadsheet';
    return { type, url: href, title: label, selector: selectorFor(el) };
  }).filter(Boolean);

  const meta = {};
  document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
    const key = el.getAttribute('name') || el.getAttribute('property');
    const value = el.getAttribute('content');
    if (key && value) meta[key] = value;
  });

  return {
    text: document.body ? document.body.innerText.slice(0, 50000) : '',
    forms,
    actions,
    documents,
    metadata: meta,
  };
})()`;
