import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex-1 flex flex-col">
      <label className="text-sm font-medium text-secondary mb-2">
        Describe your automation task
      </label>
      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., 'Fill patient form and click finalize' or 'Upload invoice PDF and submit reimbursement form'"
          className="w-full h-32 bg-surface2 border border-surface rounded-lg p-3 text-primary placeholder-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute bottom-3 right-3">
          <Sparkles className="w-4 h-4 text-secondary" />
        </div>
      </div>
      <p className="text-xs text-secondary mt-2">
        AI will understand the page and generate automation steps
      </p>
    </div>
  );
};

export default PromptInput;
