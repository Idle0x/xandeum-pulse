import React, { useRef, useLayoutEffect } from 'react';
import { Globe, X } from 'lucide-react';
import { ViewMode, CountryAggregated } from '../../types/map';
import { MODE_COLORS } from '../../utils/mapConstants';
import { formatStorage, formatCredits, formatUptime } from '../../utils/mapHelpers';
import { ViewModeToggle } from './ViewModeToggle';

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

  return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

          <div className="p-5 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> Global Breakdown
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ranking {countryBreakdown.length} active regions.
                </p>
              </div>
              <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition">
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
              const barColor = MODE_COLORS[viewMode].bg;
              const textColor = MODE_COLORS[viewMode].tailwind;

              return (
                <div key={c.code} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-4">#{i + 1}</span>
                      <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.code} className="w-5 rounded-[2px]" />
                      <span className="text-sm font-bold text-zinc-200">{c.name}</span>
                    </div>
                    <div className={`text-sm font-mono font-bold ${textColor}`}>
                      {metricValue}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className={`h-full ${barColor} shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.max(2, primaryShare)}%` }}></div>
                    </div>
                    {viewMode === 'HEALTH' ? (
                       <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono uppercase tracking-wide text-zinc-500 leading-none mt-1">
                          <span className="text-green-500 font-bold">{c.stableCount} nodes stable</span>
                          <span className="text-zinc-700">|</span>
                          <span>avg uptime: <span className="text-zinc-300">{formatUptime(c.avgUptime)}</span></span>
                          <span className="text-zinc-700">|</span>
                          <span>hosts <span className="text-zinc-300">{nodeShare.toFixed(1)}%</span> of total nodes</span>
                       </div>
                    ) : (
                       <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wide text-zinc-500">
                          <span>
                            <span className={textColor}>{primaryShare.toFixed(2)}%</span> of {metricLabel}
                          </span>
                          <span>
                            Hosts <span className="text-zinc-300">{nodeShare.toFixed(2)}%</span> of Total Nodes
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
