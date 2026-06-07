export type WorkflowAction =
  | 'click'
  | 'type'
  | 'select'
  | 'wait'
  | 'scroll'
  | 'hover'
  | 'upload'
  | 'extract'
  | 'navigate'
  | 'pressKey'
  | 'conditional';

export interface WorkflowStep {
  id: string;
  action: WorkflowAction;
  target?: string;
  value?: string;
  selector?: string;
  selectorType?: 'css' | 'xpath' | 'text' | 'aria' | 'placeholder' | 'label';
  waitTime?: number;
  waitForSelector?: string;
  condition?: {
    type: 'elementExists' | 'elementVisible' | 'textContains' | 'valueEquals';
    target: string;
    value?: string;
  };
  then?: WorkflowStep[];
  else?: WorkflowStep[];
  retryCount?: number;
  description?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables?: WorkflowVariable[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  isPublic: boolean;
  tags?: string[];
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'csv';
  defaultValue?: string;
  description?: string;
  required: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'stopped';
  startedAt: string;
  completedAt?: string;
  variables: Record<string, string>;
  currentStep: number;
  logs: ExecutionLog[];
  error?: string;
  retryCount: number;
  userId: string;
  url?: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  step?: number;
  details?: any;
}

export interface PageContext {
  url: string;
  title: string;
  elements: PageElement[];
  forms: FormInfo[];
  tables: TableInfo[];
  modals: ModalInfo[];
}

export interface PageElement {
  type: 'input' | 'button' | 'select' | 'textarea' | 'link' | 'image' | 'heading' | 'list';
  selector: string;
  text?: string;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  className?: string;
  visible: boolean;
  clickable: boolean;
}

export interface FormInfo {
  selector: string;
  fields: PageElement[];
  submitButton?: PageElement;
}

export interface TableInfo {
  selector: string;
  headers: string[];
  rowCount: number;
}

export interface ModalInfo {
  selector: string;
  title?: string;
  buttons: PageElement[];
  isOpen: boolean;
}

export interface SelectorMatch {
  selector: string;
  type: 'css' | 'xpath' | 'text' | 'aria' | 'placeholder' | 'label';
  confidence: number;
  element?: any;
}

export interface AIRequest {
  prompt: string;
  pageContext?: PageContext;
  existingWorkflow?: Workflow;
  variables?: Record<string, string>;
}

export interface AIResponse {
  enhancedPrompt: string;
  workflow: WorkflowStep[];
  reasoning?: string;
  confidence: number;
}

export interface DocumentUpload {
  id: string;
  filename: string;
  type: 'image' | 'pdf';
  extractedText?: string;
  extractedData?: Record<string, string>;
  uploadedAt: string;
  userId: string;
  workflowId?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Message {
  type: string;
  [key: string]: any;
}

export interface Response {
  success: boolean;
  [key: string]: any;
}
