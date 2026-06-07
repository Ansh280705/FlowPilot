import { DOMAnalyzer } from '../utils/domAnalyzer';
import { SelectorEngine } from '../utils/selectorEngine';
import { WorkflowExecutor } from '../utils/workflowExecutor';
import { WorkflowRecorder } from '../utils/workflowRecorder';
import type { Message, Response } from '../types/workflow';

let domAnalyzer: DOMAnalyzer;
let selectorEngine: SelectorEngine;
let workflowExecutor: WorkflowExecutor;
let workflowRecorder: WorkflowRecorder;

// Initialize engines
domAnalyzer = new DOMAnalyzer();
selectorEngine = new SelectorEngine();
workflowExecutor = new WorkflowExecutor(selectorEngine);
workflowRecorder = new WorkflowRecorder(selectorEngine);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep message channel open for async response
});

async function handleMessage(message: Message, _sender: any): Promise<Response> {
  switch (message.type) {
    case 'PING':
      return { success: true };
    
    case 'ANALYZE_PAGE':
      return analyzePage();
    
    case 'EXECUTE_STEP':
      return executeStep(message.step, message.variables);
    
    case 'START_RECORDING':
      workflowRecorder.start();
      return { success: true };
    
    case 'STOP_RECORDING': {
      const recordedSteps = workflowRecorder.stop();
      return { success: true, steps: recordedSteps };
    }
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function analyzePage(): Promise<Response> {
  try {
    const pageContext = domAnalyzer.analyzePage();
    return { success: true, pageContext };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executeStep(step: any, variables: Record<string, string> = {}): Promise<Response> {
  try {
    const result = await workflowExecutor.executeStep(step, variables);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Initialize recording event listeners
workflowRecorder.initialize();
