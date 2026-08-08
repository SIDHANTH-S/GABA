/**
 * shared/types.ts
 * Single source of truth for all TypeScript interfaces
 * Dependencies: none (pure types)
 */

// ============================================================
// PAGE UNDERSTANDING
// ============================================================

export type PageIntent =
  | 'checkout'
  | 'form-fill'
  | 'article'
  | 'dashboard'
  | 'search'
  | 'document'
  | 'product-listing'
  | 'login'
  | 'unknown';

export interface SemanticPageModel {
  url: string;
  title: string;
  pageIntent: PageIntent;
  timestamp: number;
  entities: SemanticEntity[];
  forms: SemanticForm[];
  actions: PageAction[];
  navigation: NavItem[];
  documents: DetectedDocument[];
  metadata: Record<string, string>;
}

export type EntityType =
  | 'price' | 'date' | 'person' | 'address'
  | 'product' | 'email' | 'phone' | 'url'
  | 'order-number' | 'percentage';

export interface SemanticEntity {
  id: string;
  type: EntityType;
  value: string;
  normalizedValue?: string;
  confidence: number;
  domSelector: string;
}

export type SemanticFieldType =
  | 'firstName' | 'lastName' | 'fullName'
  | 'email' | 'phone'
  | 'address' | 'city' | 'state' | 'zip' | 'country'
  | 'creditCard' | 'cvv' | 'expiry'
  | 'username' | 'password'
  | 'search' | 'generic';

export interface FormField {
  id: string;
  label: string;
  semanticType: SemanticFieldType;
  selector: string;
  required: boolean;
  inputType: string;
  currentValue?: string;
  placeholder?: string;
  options?: SelectOption[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SemanticForm {
  id: string;
  formSelector: string;
  submitSelector: string;
  fields: FormField[];
  isDestructive: boolean;
  submitLabel?: string;
}

export interface PageAction {
  id: string;
  label: string;
  selector: string;
  type: 'click' | 'navigate' | 'download' | 'submit';
  context: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface DetectedDocument {
  type: 'pdf' | 'invoice' | 'bill' | 'report' | 'spreadsheet';
  url: string;
  title: string;
  selector: string;
  size?: string;
}

// ============================================================
// ACCESSIBILITY TREE (CDP)
// ============================================================

export interface AXNode {
  nodeId: string;
  role: string;
  name: string;
  value?: string;
  description?: string;
  children: AXNode[];
  domNodeId?: number;
  boundingBox?: DOMRect;
  properties: Record<string, unknown>;
}

export interface DOMRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================
// USER MEMORY
// ============================================================

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: AddressData;
  custom: Record<string, string>;
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface DomainMemory {
  domain: string;
  lastVisited: number;
  formInputs: Record<string, string>;
  preferences: Record<string, unknown>;
  taskHistory: string[];
}

export interface WorkflowRecording {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  steps: RecordedStep[];
  createdAt: number;
  lastUsed?: number;
  runCount: number;
}

export type RecordedStepType = 'click' | 'fill' | 'navigate' | 'wait' | 'extract';

export interface RecordedStep {
  id: string;
  type: RecordedStepType;
  selector?: string;
  value?: string;
  url?: string;
  label?: string;
  timestamp: number;
}

export interface TabGroup {
  id: string;
  name: string;
  intent: PageIntent;
  color: TabGroupColor;
  tabIds: number[];
  createdAt: number;
  updatedAt: number;
}

export type TabGroupColor = 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'yellow';

// ============================================================
// TASK PLANNING & EXECUTION
// ============================================================

export type TaskStatus = 'pending' | 'running' | 'paused' | 'complete' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface TaskPlan {
  id: string;
  intent: string;
  rawCommand: string;
  steps: PlanStep[];
  estimatedDuration: number;
  requiresCheckpoint: boolean;
  context: SemanticPageModel;
  status: TaskStatus;
  currentStepIndex: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface PlanStep {
  id: string;
  sequence: number;
  description: string;
  action: AgentAction;
  expectedOutcome?: string;
  retryCount: number;
  maxRetries: number;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export type ActionType =
  | 'click' | 'fill' | 'navigate' | 'extract' | 'submit'
  | 'download' | 'wait' | 'scroll' | 'keypress'
  | 'group-tabs' | 'checkpoint';

export interface AgentAction {
  id: string;
  type: ActionType;
  payload: ActionPayload;
  isDestructive: boolean;
  requiresUserConfirmation: boolean;
  timestamp?: number;
  result?: ActionResult;
}

export interface ActionPayload {
  selector?: string;
  value?: string;
  url?: string;
  extractTarget?: 'json' | 'csv' | 'text';
  keys?: string[];
  duration?: number;
  scrollAmount?: number;
  groupName?: string;
  tabIds?: number[];
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================================
// IPC TYPES
// ============================================================

export interface TaskPlanUpdate {
  planId: string;
  stepId: string;
  stepStatus: StepStatus;
  planStatus: TaskStatus;
  currentStepIndex: number;
}

export interface CheckpointPayload {
  id: string;
  planId: string;
  stepId: string;
  stepDescription: string;
  action: AgentAction;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================
// CDP SESSION TYPES
// ============================================================

export interface CDPSession {
  send(method: string, params?: Record<string, unknown>): Promise<unknown>;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}

export type NodeId = number;
