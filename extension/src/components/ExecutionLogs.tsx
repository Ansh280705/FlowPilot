import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { WorkflowExecution } from '../types/workflow';

interface ExecutionLogsProps {
  execution?: WorkflowExecution;
  executions?: WorkflowExecution[];
  onRunWorkflow?: (workflowId: string) => void;
}

const ExecutionLogs: React.FC<ExecutionLogsProps> = ({ execution, executions, onRunWorkflow }) => {
  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'running':
        return <Clock className="w-4 h-4 text-accent animate-spin" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-secondary" />;
    }
  };

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      case 'running':
        return 'text-accent';
      case 'paused':
        return 'text-warning';
      default:
        return 'text-secondary';
    }
  };

  if (execution) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          {getStatusIcon(execution.status)}
          <span className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
            {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-surface2 rounded-lg p-3">
          <div className="space-y-2">
            {execution.logs.map((log, index) => (
              <div key={index} className="text-xs">
                <span className="text-secondary">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`ml-2 ${
                  log.level === 'error' ? 'text-error' :
                  log.level === 'warn' ? 'text-warning' :
                  log.level === 'info' ? 'text-primary' :
                  'text-secondary'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (executions && executions.length > 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-3">
          {executions.map((exec) => (
            <div
              key={exec.id}
              className="bg-surface border border-surface rounded-lg p-4 hover:border-surface2 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(exec.status)}
                  <span className={`text-sm font-medium ${getStatusColor(exec.status)}`}>
                    {exec.status.charAt(0).toUpperCase() + exec.status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-secondary">
                  {new Date(exec.startedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="text-xs text-secondary mb-2">
                Step {exec.currentStep} · Workflow {exec.workflowId.slice(0, 8)}…
              </div>
              
              {exec.error && (
                <div className="text-xs text-error mb-2 line-clamp-2">
                  {exec.error}
                </div>
              )}
              
              {onRunWorkflow && exec.status === 'completed' && (
                <button
                  onClick={() => onRunWorkflow(exec.workflowId)}
                  className="text-xs text-accent hover:underline"
                >
                  Run again
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-secondary mb-2">No execution history yet</p>
        <p className="text-xs text-secondary">
          Run an automation to see execution logs here
        </p>
      </div>
    </div>
  );
};

export default ExecutionLogs;
