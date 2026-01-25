import React, { useRef, useLayoutEffect } from 'react';
import { Globe, X } from 'lucide-react';
import { ViewMode, CountryAggregated } from '../../types/map';
import { formatStorage, formatCredits, formatUptime } from '../../utils/mapHelpers';
import { ViewModeToggle } from './ViewModeToggle';

// Define local robust color map to guarantee UI matches requirements
const THEME_COLORS: Record<ViewMode, { text: string; bg: string; border: string }> = {
  STORAGE: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
  CREDITS: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500' },
  HEALTH: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500' },
};

interface CountryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryBreakdown: CountryAggregated[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  globalTotals: { storage: number; credits: number; nodes: number };
}

export const CountryBreakdownModal: React.FC<CountryBreakdownModalProps> = ({ 
  isOpen, onClose, countryBreakdown, viewMode, setViewMode, globalTotals 
}) => {
  const modalListRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);

  // Snapshot & Restore Scroll Position
  useLayoutEffect(() => {
    if (modalListRef.current) {
      modalListRef.current.scrollTop = scrollPosRef.current;
    }
  }, [countryBreakdown]); 

  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollPosRef.current = e.currentTarget.scrollTop;
  };

  if (!isOpen) return null;

  // Get active theme colors
  const theme = THEME_COLORS[viewMode];

  return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

          <div className="p-5 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {/* Applied dynamic theme color to the Header Icon */}
                  <Globe size={18} className={theme.text} /> Global Breakdown
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ranking {countryBreakdown.length} active regions.
                </p>
              </div>
              
              {/* UPDATED CLOSE BUTTON: Professional Red Glass Style */}
              <button 
                onClick={onClose} 
                className="p-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 hover:bg-red-500/20 hover:text-red-400 backdrop-blur-md transition-all shadow-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="w-full">
               <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} className="w-full justify-between bg-black/40 border-zinc-800" />
            </div>
          </div>

          <div 
            ref={modalListRef}
            onScroll={handleModalScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
          >
            {countryBreakdown.map((c, i) => {
              let primaryShare = 0;
              let metricLabel = '';
              let metricValue = '';

              if (viewMode === 'STORAGE') {
                primaryShare = (c.storage / (globalTotals.storage || 1)) * 100;
                metricLabel = 'Capacity';
                metricValue = formatStorage(c.storage);
              } else if (viewMode === 'CREDITS') {
                primaryShare = (c.credits / (globalTotals.credits || 1)) * 100;
                metricLabel = 'Earnings';
                metricValue = formatCredits(c.credits);
              } else {
                primaryShare = c.avgHealth; 
                metricLabel = 'Health';
                metricValue = c.avgHealth.toFixed(2) + '%';
              }

              const nodeShare = (c.count / (globalTotals.nodes || 1)) * 100;

              return (
                <div key={c.code} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-4">#{i + 1}</span>
                      <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.code} className="w-5 rounded-[2px]" />
                      <span className="text-sm font-bold text-zinc-200">{c.name}</span>
                    </div>
                    {/* Applied dynamic theme color to the Metric Value */}
                    <div className={`text-sm font-mono font-bold ${theme.text}`}>
                      {metricValue}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                      {/* Applied dynamic theme color to the Progress Bar */}
                      <div className={`h-full ${theme.bg} shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.max(2, primaryShare)}%` }}></div>
                    </div>
                    {viewMode === 'HEALTH' ? (
                       <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono uppercase tracking-wide text-zinc-500 leading-none mt-1">
                          <span className={`${theme.text} font-bold`}>{c.stableCount} nodes stable</span>
                          <span className="text-zinc-700">|</span>
                          <span>avg uptime: <span className="text-zinc-300">{formatUptime(c.avgUptime)}</span></span>
                          <span className="text-zinc-700">|</span>
                          <span>Hosts <span className="text-zinc-300">{c.count}</span> nodes ({nodeShare.toFixed(1)}%)</span>
                       </div>
                    ) : (
                       <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wide text-zinc-500">
                          <span>
                            {/* Applied dynamic theme color to the Share Text */}
                            <span className={theme.text}>{primaryShare.toFixed(2)}%</span> of {metricLabel}
                          </span>
                          <span>
                            Hosts <span className="text-zinc-300">{c.count}</span> nodes ({nodeShare.toFixed(1)}%)
                          </span>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
};
