import React from 'react';
import { Database, Activity, Zap } from 'lucide-react';
import { ViewMode } from '../../types/map';
import { MODE_COLORS } from '../../utils/mapConstants';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, setViewMode, className = "" }) => (
  <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
      {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
          let Icon = Database;
          if (mode === 'HEALTH') Icon = Activity;
          if (mode === 'CREDITS') Icon = Zap;
          const active = viewMode === mode;
          const activeColorBg = MODE_COLORS[mode].bg;
          return (
              <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${active ? `${activeColorBg} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                  <Icon size={14} className={active ? "text-white" : "text-zinc-500"} />
                  <span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
              </button>
          )
      })}
  </div>
);
