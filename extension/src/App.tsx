import { useState, useEffect } from 'react';
import { Brain, Play, Square, History, Save, Sparkles, LogOut } from 'lucide-react';
import PromptInput from './components/PromptInput';
import WorkflowList from './components/WorkflowList';
import ExecutionLogs from './components/ExecutionLogs';
import RecordingControls from './components/RecordingControls';
import AuthScreen from './components/AuthScreen';
import { sendMessageToBackground } from './utils/chromeMessaging';
import { useAuth } from './hooks/useAuth';
import type { Workflow, WorkflowExecution } from './types/workflow';

function App() {
  const { user, loading, login, register, logout } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'workflows' | 'history'>('prompt');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    if (user) {
      loadWorkflows();
      loadExecutions();
    }
  }, [user]);

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-[400px] h-[600px] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Not logged in — show auth screen ───────────────────────────────────────
  if (!user) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={(email, password, name) => register(email, password, name)}
      />
    );
  }

  // ── Logged in — main app ───────────────────────────────────────────────────

  async function loadWorkflows() {
    try {
      const result = await sendMessageToBackground({ type: 'GET_WORKFLOWS' });
      if (result.success) setWorkflows(result.workflows || []);
    } catch {
      setWorkflows([]);
    }
  }

  async function loadExecutions() {
    try {
      const result = await sendMessageToBackground({ type: 'GET_EXECUTIONS' });
      if (result.success) setExecutions(result.executions || []);
    } catch {
      setExecutions([]);
    }
  }

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    try {
      const result = await sendMessageToBackground({ type: 'EXECUTE_PROMPT', prompt });
      if (result.success) {
        setCurrentExecution(result.execution);
        await loadExecutions();
      } else {
        alert(`Execution failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Execution error: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = async () => {
    await sendMessageToBackground({ type: 'STOP_EXECUTION' });
    setIsExecuting(false);
  };

  const handleToggleRecording = async () => {
    const result = await sendMessageToBackground({
      type: isRecording ? 'STOP_RECORDING' : 'START_RECORDING',
    });
    if (result.success) setIsRecording(!isRecording);
  };

  const handleSaveWorkflow = async (workflow: Workflow) => {
    const result = await sendMessageToBackground({ type: 'SAVE_WORKFLOW', workflow });
    if (result.success) await loadWorkflows();
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    const result = await sendMessageToBackground({ type: 'DELETE_WORKFLOW', workflowId });
    if (result.success) await loadWorkflows();
  };

  const handleRunWorkflow = async (workflowId: string) => {
    setIsExecuting(true);
    try {
      const result = await sendMessageToBackground({ type: 'RUN_WORKFLOW', workflowId });
      if (result.success) {
        setCurrentExecution(result.execution);
        await loadExecutions();
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const planBadgeColor: Record<string, string> = {
    free: 'bg-surface2 text-secondary',
    pro: 'bg-blue-500/20 text-blue-400',
    enterprise: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="w-[400px] h-[600px] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-surface2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">FlowPilot AI</h1>
              <p className="text-xs text-secondary">AI Browser Automation</p>
            </div>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">
                {(user.name?.[0] || user.email[0]).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-primary font-medium leading-none">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 capitalize font-medium ${planBadgeColor[user.plan] || 'bg-surface2 text-secondary'}`}>
                  {user.plan}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-surface2 text-secondary hover:text-error transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border-b border-surface2 flex">
        {(['prompt', 'workflows', 'history'] as const).map(tab => {
          const icons = { prompt: <Sparkles className="w-4 h-4 inline mr-1" />, workflows: <Save className="w-4 h-4 inline mr-1" />, history: <History className="w-4 h-4 inline mr-1" /> };
          const labels = { prompt: 'Automate', workflows: 'Workflows', history: 'History' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-accent bg-surface2'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {icons[tab]}{labels[tab]}
            </button>
          );
        })}
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
