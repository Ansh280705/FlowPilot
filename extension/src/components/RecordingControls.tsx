import React from 'react';
import { Circle, Square } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({ isRecording, onToggle, disabled }) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isRecording
            ? 'bg-error hover:bg-red-600 text-white'
            : 'bg-surface2 hover:bg-surface text-primary'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Circle className="w-4 h-4" />
            Record Workflow
          </>
        )}
      </button>
      
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
          <span className="text-xs text-secondary">Recording actions...</span>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
