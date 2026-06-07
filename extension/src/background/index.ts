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

// ─── helpers ────────────────────────────────────────────────────────────────

/** Get the active tab safely — returns null if none found */
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

/** Send a message and resolve with the response (never rejects) */
function sendToTab(tabId: number, message: object): Promise<any> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response ?? null);
      }
    });
  });
}

// ─── API calls ──────────────────────────────────────────────────────────────

async function getWorkflows(): Promise<Response> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/workflows`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const workflows = await response.json();
    return { success: true, workflows: Array.isArray(workflows) ? workflows : [] };
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
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const savedWorkflow = await response.json();
    return { success: true, workflow: savedWorkflow };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function deleteWorkflow(workflowId: string): Promise<Response> {
  try {
    await fetch(`${BACKEND_API_URL}/workflows/${workflowId}`, { method: 'DELETE' });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executePrompt(prompt: string): Promise<Response> {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return { success: false, error: 'No active tab found' };

    await ensureContentScriptLoaded(tab.id);

    const pageContext = await analyzePage(tab.id);
    if (!pageContext.success) return pageContext;

    const aiRequest: AIRequest = {
      prompt,
      pageContext: pageContext.pageContext,
    };

    const aiResponse = await fetch(`${BACKEND_API_URL}/ai/generate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiRequest),
    });

    if (!aiResponse.ok) throw new Error(`AI service error: ${aiResponse.status}`);

    const workflowData = await aiResponse.json();

    // AI may return { workflow: [...] }, { steps: [...] }, or a bare array
    const steps = workflowData?.workflow ?? workflowData?.steps ?? workflowData;
    if (!Array.isArray(steps) || steps.length === 0) {
      // Use the reasoning message if the AI returned one (e.g. not-automation detection)
      const reason = workflowData?.reasoning || 'AI did not return any workflow steps. Try a more specific prompt.';
      return { success: false, error: reason };
    }

    // Build a minimal Workflow object so executeWorkflow can run it
    const workflow: Workflow = {
      id: '',
      name: prompt.slice(0, 60),
      description: prompt,
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'default-user',
      isPublic: false,
    };

    return await executeWorkflow(workflow, tab.id);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function runWorkflow(workflowId: string, variables: Record<string, string> = {}): Promise<Response> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/workflows/${workflowId}`);
    if (!response.ok) throw new Error(`Could not load workflow: ${response.status}`);
    const workflow: Workflow = await response.json();

    if (!workflow?.id) throw new Error('Invalid workflow data received from server');

    const tab = await getActiveTab();
    if (!tab?.id) return { success: false, error: 'No active tab found' };

    await ensureContentScriptLoaded(tab.id);

    return await executeWorkflow(workflow, tab.id, variables);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executeWorkflow(
  workflow: Workflow,
  tabId: number,
  variables: Record<string, string> = {}
): Promise<Response> {
  try {
    const tabInfo = await chrome.tabs.get(tabId);

    const execution: WorkflowExecution = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id || '',
      status: 'running',
      startedAt: new Date().toISOString(),
      variables,
      currentStep: 0,
      logs: [],
      retryCount: 0,
      userId: 'default-user',
      url: tabInfo.url,
    };

    currentExecution = execution;

    const steps = workflow.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (!currentExecution || currentExecution.status === 'stopped') break;

      const step = steps[i];
      execution.currentStep = i + 1;

      try {
        const result = await executeStep(tabId, step, variables);
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Step ${i + 1}: ${step.description || step.action}`,
          step: i,
          details: result,
        });
      } catch (error) {
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Step ${i + 1} failed: ${(error as Error).message}`,
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

    // Persist execution to backend (best-effort — don't fail if backend is down)
    try {
      await fetch(`${BACKEND_API_URL}/executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execution),
      });
    } catch {
      // backend unavailable — execution result still returned to UI
    }

    currentExecution = null;
    return { success: true, execution };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function executeStep(tabId: number, step: any, variables: Record<string, string>): Promise<any> {
  const response = await sendToTab(tabId, { type: 'EXECUTE_STEP', step, variables });

  if (response === null) {
    throw new Error('No response from content script — page may have navigated or crashed');
  }
  if (!response.success) {
    throw new Error(response.error || 'Step execution failed');
  }
  return response.result;
}

async function ensureContentScriptLoaded(tabId: number): Promise<void> {
  const res = await sendToTab(tabId, { type: 'PING' });
  if (res?.success) return;

  // Not loaded yet — inject the compiled content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content-script.js'],
    });
  } catch {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
      throw new Error('This page does not support extensions. Please navigate to a regular website.');
    }
    throw new Error('Could not inject automation script. Please refresh the page and try again.');
  }

  // Wait for initialisation then verify
  await new Promise(resolve => setTimeout(resolve, 400));
  const verified = await sendToTab(tabId, { type: 'PING' });
  if (!verified?.success) {
    throw new Error('Script injected but not responding. Please refresh the page and try again.');
  }
}

async function analyzePage(tabId: number): Promise<Response> {
  const response = await sendToTab(tabId, { type: 'ANALYZE_PAGE' });
  if (!response) return { success: false, error: 'No response from page analyzer' };
  return response;
}

async function stopExecution(): Promise<Response> {
  if (currentExecution) {
    currentExecution.status = 'stopped';
    currentExecution = null;
  }
  return { success: true };
}

async function startRecording(): Promise<Response> {
  const tab = await getActiveTab();
  if (!tab?.id) return { success: false, error: 'No active tab found' };
  const response = await sendToTab(tab.id, { type: 'START_RECORDING' });
  return response ?? { success: false, error: 'No response from content script' };
}

async function stopRecording(): Promise<Response> {
  const tab = await getActiveTab();
  if (!tab?.id) return { success: false, error: 'No active tab found' };
  const response = await sendToTab(tab.id, { type: 'STOP_RECORDING' });
  return response ?? { success: false, error: 'No response from content script' };
}

async function getExecutions(): Promise<Response> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/executions`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const executions = await response.json();
    return { success: true, executions: Array.isArray(executions) ? executions : [] };
  } catch (error) {
    console.error('Get executions error:', error);
    return { success: false, error: (error as Error).message };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('FlowPilot AI extension installed');
});
