import type { Message, Response, Workflow, WorkflowExecution, AIRequest } from '../types/workflow';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

let currentExecution: WorkflowExecution | null = null;

console.log('Background script loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  handleMessage(message, sender)
    .then((response) => {
      console.log('Background sending response:', response);
      sendResponse(response);
    })
    .catch((error) => {
      console.error('Background error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep message channel open for async response
});

async function handleMessage(message: Message, _sender: any): Promise<Response> {
  switch (message.type) {
    case 'GET_WORKFLOWS':
      return getWorkflows();
    
    case 'SAVE_WORKFLOW':
      return saveWorkflow(message.workflow);
    
    case 'DELETE_WORKFLOW':
      return deleteWorkflow(message.workflowId);
    
    case 'EXECUTE_PROMPT':
      return executePrompt(message.prompt);
    
    case 'RUN_WORKFLOW':
      return runWorkflow(message.workflowId, message.variables);
    
    case 'STOP_EXECUTION':
      return stopExecution();
    
    case 'START_RECORDING':
      return startRecording();
    
    case 'STOP_RECORDING':
      return stopRecording();
    
    case 'GET_EXECUTIONS':
      return getExecutions();
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function getWorkflows(): Promise<Response> {
  try {
    console.log('Fetching workflows from:', `${BACKEND_API_URL}/workflows`);
    const response = await fetch(`${BACKEND_API_URL}/workflows`);
    console.log('Workflows response status:', response.status);
    const workflows = await response.json();
    console.log('Workflows data:', workflows);
    return { success: true, workflows };
  } catch (error) {
    console.error('Get workflows error:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function saveWorkflow(workflow: Workflow): Promise<Response> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    const savedWorkflow = await response.json();
    return { success: true, workflow: savedWorkflow };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function deleteWorkflow(workflowId: string): Promise<Response> {
  try {
    await fetch(`${BACKEND_API_URL}/workflows/${workflowId}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executePrompt(prompt: string): Promise<Response> {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      return { success: false, error: 'No active tab found' };
    }

    // Ensure content script is loaded
    await ensureContentScriptLoaded(tab.id);

    // Analyze page
    const pageContext = await analyzePage(tab.id);
    if (!pageContext.success) {
      return pageContext;
    }

    // Send to AI for workflow generation
    const aiRequest: AIRequest = {
      prompt,
      pageContext: pageContext.pageContext,
    };

    const aiResponse = await fetch(`${BACKEND_API_URL}/ai/generate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiRequest),
    });

    const workflowData = await aiResponse.json();

    // Execute the generated workflow
    return await executeWorkflow(workflowData.workflow, tab.id);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function runWorkflow(workflowId: string, variables: Record<string, string> = {}): Promise<Response> {
  try {
    // Get workflow from backend
    const response = await fetch(`${BACKEND_API_URL}/workflows/${workflowId}`);
    const workflow = await response.json();

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      return { success: false, error: 'No active tab found' };
    }

    // Ensure content script is loaded
    await ensureContentScriptLoaded(tab.id);

    return await executeWorkflow(workflow, tab.id, variables);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executeWorkflow(workflow: Workflow, tabId: number, variables: Record<string, string> = {}): Promise<Response> {
  try {
    // Create execution record
    const execution: WorkflowExecution = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id || '',
      status: 'running',
      startedAt: new Date().toISOString(),
      variables,
      currentStep: 0,
      logs: [],
      retryCount: 0,
      userId: 'user-id', // TODO: Get from auth
      url: (await chrome.tabs.get(tabId)).url,
    };

    currentExecution = execution;

    // Execute each step
    const steps = workflow.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (!currentExecution || currentExecution.status === 'stopped') {
        break;
      }

      const step = steps[i];
      execution.currentStep = i + 1;

      try {
        const result = await executeStep(tabId, step, variables);
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Executed step: ${step.action}`,
          step: i,
          details: result,
        });
      } catch (error) {
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed step: ${step.action}`,
          step: i,
          details: (error as Error).message,
        });
        execution.status = 'failed';
        execution.error = (error as Error).message;
        break;
      }
    }

    if (execution.status === 'running') {
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
    }

    // Save execution to backend
    await fetch(`${BACKEND_API_URL}/executions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(execution),
    });

    currentExecution = null;
    return { success: true, execution };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executeStep(tabId: number, step: any, variables: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, {
      type: 'EXECUTE_STEP',
      step,
      variables,
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response.success) {
        resolve(response.result);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

async function ensureContentScriptLoaded(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch {
    // Content script not present — inject it programmatically
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content-scripts/index.ts'],
    });
    // Give it a moment to initialise
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function analyzePage(tabId: number): Promise<Response> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_PAGE' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

async function stopExecution(): Promise<Response> {
  if (currentExecution) {
    currentExecution.status = 'stopped';
    currentExecution = null;
  }
  return { success: true };
}

async function startRecording(): Promise<Response> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    return { success: false, error: 'No active tab found' };
  }

  return new Promise((resolve) => {
    if (!tab.id) {
      resolve({ success: false, error: 'No active tab found' });
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

async function stopRecording(): Promise<Response> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    return { success: false, error: 'No active tab found' };
  }

  return new Promise((resolve) => {
    if (!tab.id) {
      resolve({ success: false, error: 'No active tab found' });
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

async function getExecutions(): Promise<Response> {
  try {
    console.log('Fetching executions from:', `${BACKEND_API_URL}/executions`);
    const response = await fetch(`${BACKEND_API_URL}/executions`);
    console.log('Executions response status:', response.status);
    const executions = await response.json();
    console.log('Executions data:', executions);
    return { success: true, executions };
  } catch (error) {
    console.error('Get executions error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('FlowPilot AI extension installed');
});
