import React from 'react';
import { Play, Trash2, Copy } from 'lucide-react';
import type { Workflow } from '../types/workflow';

interface WorkflowListProps {
  workflows: Workflow[];
  onRun: (workflowId: string) => void;
  onSave: (workflow: Workflow) => void;
  onDelete?: (workflowId: string) => void;
  disabled?: boolean;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ workflows, onRun, onSave, onDelete, disabled }) => {
  const handleDelete = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      onDelete?.(workflowId);
    }
  };

  const handleDuplicate = (workflow: Workflow) => {
    const duplicated = {
      ...workflow,
      id: crypto.randomUUID(),
      name: `${workflow.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    onSave(duplicated);
  };

  if (workflows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-secondary mb-2">No saved workflows yet</p>
          <p className="text-xs text-secondary">
            Create your first automation by describing a task
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-surface border border-surface2 rounded-lg p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-primary mb-1">{workflow.name}</h3>
                <p className="text-xs text-secondary line-clamp-2">{workflow.description}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">
                  {workflow.steps.length} steps
                </span>
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className="flex gap-1">
                    {workflow.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-surface2 text-secondary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRun(workflow.id)}
                  disabled={disabled}
                  className="p-2 hover:bg-surface2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Run workflow"
                >
                  <Play className="w-4 h-4 text-accent" />
                </button>
                <button
                  onClick={() => handleDuplicate(workflow)}
                  className="p-2 hover:bg-surface2 rounded-lg transition-colors"
                  title="Duplicate workflow"
                >
                  <Copy className="w-4 h-4 text-secondary" />
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="p-2 hover:bg-surface2 rounded-lg transition-colors"
                  title="Delete workflow"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowList;
