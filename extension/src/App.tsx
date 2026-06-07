import { useState, useEffect } from 'react';
import { Brain, Play, Square, History, Save, Sparkles } from 'lucide-react';
import PromptInput from './components/PromptInput';
import WorkflowList from './components/WorkflowList';
import ExecutionLogs from './components/ExecutionLogs';
import RecordingControls from './components/RecordingControls';
import { sendMessageToBackground } from './utils/chromeMessaging';
import type { Workflow, WorkflowExecution } from './types/workflow';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'workflows' | 'history'>('prompt');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, []);

  const loadWorkflows = async () => {
    try {
      const result = await sendMessageToBackground({ type: 'GET_WORKFLOWS' });
      console.log('Workflows response:', result);
      if (result.success) {
        setWorkflows(result.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setWorkflows([]);
    }
  };

  const loadExecutions = async () => {
    try {
      const result = await sendMessageToBackground({ type: 'GET_EXECUTIONS' });
      console.log('Executions response:', result);
      if (result.success) {
        setExecutions(result.executions || []);
      }
    } catch (error) {
      console.error('Failed to load executions:', error);
      setExecutions([]);
    }
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    
    setIsExecuting(true);
    try {
      console.log('Sending EXECUTE_PROMPT message:', prompt);
      const result = await sendMessageToBackground({
        type: 'EXECUTE_PROMPT',
        prompt,
      });
      console.log('Received response:', result);
      
      if (result.success) {
        setCurrentExecution(result.execution);
        await loadExecutions();
      } else {
        console.error('Execution failed:', result.error);
        alert(`Execution failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Execution failed:', error);
      alert(`Execution error: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = async () => {
    try {
      await sendMessageToBackground({ type: 'STOP_EXECUTION' });
      setIsExecuting(false);
    } catch (error) {
      console.error('Failed to stop execution:', error);
    }
  };

  const handleToggleRecording = async () => {
    try {
      const result = await sendMessageToBackground({
        type: isRecording ? 'STOP_RECORDING' : 'START_RECORDING',
      });
      
      if (result.success) {
        setIsRecording(!isRecording);
      }
    } catch (error) {
      console.error('Recording toggle failed:', error);
    }
  };

  const handleSaveWorkflow = async (workflow: Workflow) => {
    try {
      const result = await sendMessageToBackground({
        type: 'SAVE_WORKFLOW',
        workflow,
      });
      
      if (result.success) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const result = await sendMessageToBackground({
        type: 'DELETE_WORKFLOW',
        workflowId,
      });
      if (result.success) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleRunWorkflow = async (workflowId: string) => {
    setIsExecuting(true);
    try {
      const result = await sendMessageToBackground({
        type: 'RUN_WORKFLOW',
        workflowId,
      });
      
      if (result.success) {
        setCurrentExecution(result.execution);
        await loadExecutions();
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-surface2 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">FlowPilot AI</h1>
            <p className="text-xs text-secondary">AI Browser Automation</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border-b border-surface2 flex">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'prompt'
              ? 'text-primary border-b-2 border-accent bg-surface2'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          Automate
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'workflows'
              ? 'text-primary border-b-2 border-accent bg-surface2'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Save className="w-4 h-4 inline mr-1" />
          Workflows
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-accent bg-surface2'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'prompt' && (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={isExecuting || isRecording}
            />
            
            <RecordingControls
              isRecording={isRecording}
              onToggle={handleToggleRecording}
              disabled={isExecuting}
            />

            <div className="flex gap-2">
              <button
                onClick={handleExecute}
                disabled={!prompt.trim() || isExecuting || isRecording}
                className="flex-1 bg-accent hover:bg-blue-600 disabled:bg-surface2 disabled:text-secondary text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Automation
                  </>
                )}
              </button>
              
              {isExecuting && (
                <button
                  onClick={handleStopExecution}
                  className="bg-error hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-all"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
            </div>

            {currentExecution && (
              <ExecutionLogs execution={currentExecution} />
            )}
          </div>
        )}

        {activeTab === 'workflows' && (
          <WorkflowList
            workflows={workflows}
            onRun={handleRunWorkflow}
            onSave={handleSaveWorkflow}
            onDelete={handleDeleteWorkflow}
            disabled={isExecuting}
          />
        )}

        {activeTab === 'history' && (
          <ExecutionLogs
            executions={executions}
            onRunWorkflow={handleRunWorkflow}
          />
        )}
      </div>
    </div>
  );
}

export default App;
