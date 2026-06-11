import type { Message, Response, Workflow, WorkflowExecution, AIRequest } from '../types/workflow';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002/api';
const TOKEN_KEY = 'fp_token';

/** Get stored JWT from chrome.storage.local */
async function getToken(): Promise<string | null> {
  return new Promise(resolve => {
    chrome.storage.local.get([TOKEN_KEY], result => resolve(result[TOKEN_KEY] ?? null));
  });
}

/** Build fetch headers with auth token if available */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

let currentExecution: WorkflowExecution | null = null;
let stopRequested = false;

const AI_FETCH_TIMEOUT_MS = 45_000;
const STEP_TIMEOUT_MS = 45_000;
const TOTAL_TIMEOUT_MS = 180_000;
const MAX_AGENT_ROUNDS = 20;

function broadcastExecutionUpdate(execution: WorkflowExecution): void {
  chrome.runtime.sendMessage({ type: 'EXECUTION_UPDATE', execution }).catch(() => {});
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
    case 'GET_CURRENT_EXECUTION':
      return { success: true, execution: currentExecution };
    // Sent by the website after login/logout to sync auth state
    case 'SET_AUTH_TOKEN':
    case 'CLEAR_AUTH_TOKEN':
      // These are handled by onMessageExternal — ignore if received internally
      return { success: true };
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

/** Wait for navigation + SPA render before executing steps on a new page */
async function waitForTabReady(tabId: number, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  while (Date.now() < deadline) {
    const res = await sendToTab(tabId, { type: 'ANALYZE_PAGE' });
    const count = res?.pageContext?.elements?.length ?? 0;
    if (count > 3) return;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
}

// ─── API calls ──────────────────────────────────────────────────────────────

async function getWorkflows(): Promise<Response> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/workflows`, { headers: await authHeaders() });
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
      headers: await authHeaders(),
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
    await fetch(`${BACKEND_API_URL}/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
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

    const tabInfo = await chrome.tabs.get(tab.id);
    const deadline = Date.now() + TOTAL_TIMEOUT_MS;
    const isTimedOut = () => Date.now() > deadline;

    const execution: WorkflowExecution = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: '',
      status: 'running',
      startedAt: new Date().toISOString(),
      variables: {},
      currentStep: 0,
      logs: [{
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Starting automation...',
        step: 0,
      }],
      retryCount: 0,
      userId: 'default-user',
      url: tabInfo.url,
    };

    stopRequested = false;
    currentExecution = execution;
    broadcastExecutionUpdate(execution);

    const completedSteps: string[] = [];
    let globalStepIndex = 0;
    let pageJustNavigated = false;
    let pageMenuOpened = false;

    for (let round = 0; round < MAX_AGENT_ROUNDS; round++) {
      if (stopRequested || isTimedOut()) break;

      if (pageJustNavigated) {
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Waiting for page to load...',
          step: globalStepIndex,
        });
        broadcastExecutionUpdate(execution);
        await waitForTabReady(tab.id);
        pageJustNavigated = false;
      } else if (pageMenuOpened) {
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Waiting for menu...',
          step: globalStepIndex,
        });
        broadcastExecutionUpdate(execution);
        await new Promise(resolve => setTimeout(resolve, 1000));
        pageMenuOpened = false;
      }

      await ensureContentScriptLoaded(tab.id);

      execution.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: round === 0 ? 'Analyzing page...' : 'AI thinking about next action...',
        step: globalStepIndex,
      });
      broadcastExecutionUpdate(execution);

      const pageContext = await analyzePage(tab.id);
      if (!pageContext.success) {
        execution.status = 'failed';
        execution.error = pageContext.error || 'Failed to analyze page';
        broadcastExecutionUpdate(execution);
        break;
      }

      let agentResult: AgentStepResult | null;
      try {
        agentResult = await fetchAgentStep(prompt, pageContext.pageContext, completedSteps);
      } catch (error) {
        execution.status = 'failed';
        execution.error = (error as Error).message || 'AI planning failed';
        broadcastExecutionUpdate(execution);
        break;
      }

      if (!agentResult) {
        execution.status = 'failed';
        execution.error = 'AI service error or timeout — is the backend running on port 3002?';
        broadcastExecutionUpdate(execution);
        break;
      }

      if (agentResult.reasoning) {
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `AI: ${agentResult.reasoning}`,
          step: globalStepIndex,
        });
        broadcastExecutionUpdate(execution);
      }

      if (agentResult.done || !agentResult.step) {
        if (round === 0 && !agentResult.done) {
          execution.status = 'failed';
          execution.error = agentResult.reasoning || 'AI could not find a next action on this page.';
        }
        break;
      }

      const step = agentResult.step;
      const urlAtRoundStart = (await chrome.tabs.get(tab.id)).url || '';

      globalStepIndex++;
      execution.currentStep = globalStepIndex;
      if (step.retryCount == null) step.retryCount = 2;

      try {
        const result = await executeStep(tab.id, step, execution.variables);
        const label = step.description || `${step.action} ${step.target || ''}`.trim();
        completedSteps.push(label);
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Step ${globalStepIndex}: ${label}`,
          step: globalStepIndex - 1,
          details: result,
        });
        broadcastExecutionUpdate(execution);

        if (step.action === 'click' || step.action === 'navigate') {
          const pollUntil = Date.now() + Math.max(step.waitTime || 800, 3500);
          let urlChanged = false;
          while (Date.now() < pollUntil) {
            await new Promise(resolve => setTimeout(resolve, 250));
            const currentUrl = (await chrome.tabs.get(tab.id)).url || '';
            if (currentUrl !== urlAtRoundStart) {
              urlChanged = true;
              break;
            }
          }
          if (urlChanged) {
            pageJustNavigated = true;
          } else {
            pageMenuOpened = true;
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      } catch (error) {
        const errMsg = (error as Error).message || 'Unknown step error';
        execution.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Step ${globalStepIndex} failed: ${errMsg}`,
          step: globalStepIndex - 1,
          details: errMsg,
        });
        execution.status = 'failed';
        execution.error = errMsg;
        broadcastExecutionUpdate(execution);
        break;
      }

      if (execution.status === 'failed' || stopRequested || isTimedOut()) break;
    }

    if (isTimedOut() && execution.status === 'running') {
      execution.status = 'failed';
      execution.error = 'Automation timed out after 3 minutes';
    }

    if (stopRequested) {
      execution.status = 'stopped';
      execution.completedAt = new Date().toISOString();
    } else if (execution.status === 'running') {
      execution.status = completedSteps.length > 0 ? 'completed' : 'failed';
      if (execution.status === 'failed' && !execution.error) {
        execution.error = 'No steps were executed';
      }
      if (execution.status === 'completed') {
        execution.completedAt = new Date().toISOString();
      }
    }

    broadcastExecutionUpdate(execution);

    try {
      await fetchWithTimeout(`${BACKEND_API_URL}/executions`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(execution),
      }, 10_000);
    } catch {
      // backend unavailable
    }

    currentExecution = null;
    const succeeded = execution.status === 'completed' || execution.status === 'stopped';
    return {
      success: succeeded,
      execution,
      error: succeeded ? undefined : (execution.error || 'Automation failed'),
    };
  } catch (error) {
    currentExecution = null;
    const errMsg = (error as Error).message || 'Unexpected automation error';
    return { success: false, error: errMsg };
  }
}

interface AgentStepResult {
  step: any | null;
  reasoning: string;
  done: boolean;
}

async function fetchAgentStep(
  prompt: string,
  pageContext: any,
  completedSteps: string[]
): Promise<AgentStepResult | null> {
  const trimmedContext = pageContext ? {
    ...pageContext,
    elements: (pageContext.elements ?? [])
      .filter((el: any) => el.type === 'input' || el.type === 'button' || el.type === 'select' || el.type === 'link')
      .slice(0, 25),
  } : undefined;

  const aiRequest: AIRequest = {
    prompt,
    pageContext: trimmedContext,
    mode: 'agent',
    completedSteps,
  };

  let aiResponse: globalThis.Response;
  try {
    aiResponse = await fetchWithTimeout(`${BACKEND_API_URL}/ai/generate-workflow`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(aiRequest),
    }, AI_FETCH_TIMEOUT_MS);
  } catch {
    return null;
  }

  if (!aiResponse.ok) {
    let errText = `AI service returned ${aiResponse.status}`;
    try {
      const errBody = await aiResponse.json();
      if (errBody?.error) errText = errBody.error;
    } catch { /* ignore */ }
    throw new Error(errText);
  }

  const data = await aiResponse.json();
  const steps: any[] = Array.isArray(data?.workflow) ? data.workflow : [];

  if (steps.length === 0 && data?.reasoning) {
    const reasoning = String(data.reasoning);
    if (reasoning.includes('⚠️') || reasoning.toLowerCase().includes('cannot')) {
      throw new Error(reasoning);
    }
  }

  return {
    step: steps[0] ?? null,
    reasoning: data?.reasoning || '',
    done: data?.done === true || (steps.length === 0 && !data?.reasoning?.includes('⚠️')),
  };
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

    stopRequested = false;
    currentExecution = execution;

    const steps = workflow.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (stopRequested) break;

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

    if (stopRequested) {
      execution.status = 'stopped';
      execution.completedAt = new Date().toISOString();
    } else if (execution.status === 'running') {
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
    }

    // Persist execution to backend (best-effort — don't fail if backend is down)
    try {
      await fetch(`${BACKEND_API_URL}/executions`, {
        method: 'POST',
        headers: await authHeaders(),
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
  const response = await Promise.race([
    sendToTab(tabId, { type: 'EXECUTE_STEP', step, variables }),
    new Promise<null>(resolve => setTimeout(() => resolve(null), STEP_TIMEOUT_MS)),
  ]);

  if (response === null) {
    throw new Error('Step timed out — page may have navigated or the element was not found');
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
  stopRequested = true;
  if (currentExecution) {
    currentExecution.status = 'stopped';
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
    const response = await fetch(`${BACKEND_API_URL}/executions`, { headers: await authHeaders() });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const executions = await response.json();
    return { success: true, executions: Array.isArray(executions) ? executions : [] };
  } catch (error) {
    console.error('Get executions error:', error);
    return { success: false, error: (error as Error).message };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Orvicc extension installed');
});

// Handle messages sent from the Orvicc website (externally_connectable)
chrome.runtime.onMessageExternal.addListener(
  (message: Message, _sender, sendResponse) => {
    console.log('External message received:', message.type);

    if (message.type === 'SET_AUTH_TOKEN' && message.token) {
      chrome.storage.local.set(
        { fp_token: message.token, fp_user: message.user ?? null },
        () => {
          console.log('Token stored from website login');
          sendResponse({ success: true });
        }
      );
      return true; // async
    }

    if (message.type === 'CLEAR_AUTH_TOKEN') {
      chrome.storage.local.remove(['fp_token', 'fp_user'], () => {
        console.log('Token cleared from website logout');
        sendResponse({ success: true });
      });
      return true;
    }

    sendResponse({ success: false, error: 'Unknown external message type' });
  }
);
