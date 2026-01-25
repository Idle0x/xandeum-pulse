import React from 'react';
import { Database, Activity, Zap } from 'lucide-react';
import { ViewMode } from '../../types/map';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, setViewMode, className = "" }) => {
  
  // Explicit styling helper to guarantee colors
  const getActiveClass = (mode: ViewMode) => {
    switch (mode) {
      case 'STORAGE': return 'bg-purple-500 text-white shadow-md shadow-purple-500/20';
      case 'CREDITS': return 'bg-orange-500 text-white shadow-md shadow-orange-500/20';
      case 'HEALTH':  return 'bg-green-500 text-white shadow-md shadow-green-500/20';
      default: return 'bg-zinc-800 text-white';
    }
  };

  return (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
        {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
            let Icon = Database;
            if (mode === 'HEALTH') Icon = Activity;
            if (mode === 'CREDITS') Icon = Zap;
            
            const isActive = viewMode === mode;
            
            return (
                <button 
                  key={mode} 
                  onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? getActiveClass(mode) 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                    <Icon size={14} className={isActive ? "text-white" : "text-zinc-500"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
                </button>
            )
        })}
    </div>
  );
};
