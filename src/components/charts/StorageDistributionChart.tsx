import React from 'react';
import { Minimize2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface StorageDistributionChartProps {
  nodeCommitted: number;
  medianCommitted: number;
  avgCommitted: number;
  isCompact?: boolean; // Optional prop for future flexibility
}

export const StorageDistributionChart = ({ 
  nodeCommitted, 
  medianCommitted, 
  avgCommitted,
  isCompact = false
}: StorageDistributionChartProps) => {
  
  // 1. Centralized Logic (The "10% Buffer" Math)
  const maxValue = Math.max(nodeCommitted, medianCommitted, avgCommitted) * 1.1;

  const bars = [
    { label: 'YOU', raw: nodeCommitted, type: 'MY_NODE' },
    { label: 'MEDIAN', raw: medianCommitted, type: 'MEDIAN' },
    { label: 'AVERAGE', raw: avgCommitted, type: 'AVG' }
  ].map(b => ({
    ...b,
    val: (b.raw / maxValue) * 100 // Calculate % height
  }));

  return (
    <div className="flex-1 w-full flex items-end justify-between gap-4 relative z-10 px-2 pb-2 h-full min-h-[120px]">
      {/* Floor Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>

      {bars.map((bar, i) => {
        const isMyNode = bar.type === 'MY_NODE';
        
        // Style Logic
        const barColor = isMyNode 
            ? 'bg-gradient-to-t from-purple-900/80 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
            : 'bg-zinc-800/60 border-t border-white/5';

        const labelColor = isMyNode ? 'text-purple-400' : 'text-zinc-600';

        return (
            <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">

                {/* Floating Data Label */}
                <div className="mb-2 text-[8px] font-mono font-bold text-zinc-600 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatBytes(bar.raw).split(' ')[0]} <span className="text-[7px]">{formatBytes(bar.raw).split(' ')[1]}</span>
                </div>

                {/* THE BAR (MONOLITH) */}
                <div 
                    className={`w-full max-w-[40px] md:max-w-[50px] rounded-t-sm md:rounded-t-md transition-all duration-1000 ease-out relative ${barColor}`} 
                    style={{ height: `${Math.max(bar.val, 2)}%` }} // Force min 2%
                >
                    {/* Top Highlight Line */}
                    <div className={`absolute top-0 left-0 right-0 h-[1px] ${isMyNode ? 'bg-white/60 shadow-[0_0_8px_white]' : 'bg-white/10'}`}></div>
                </div>

                {/* X-AXIS LABEL */}
                <div className={`mt-2 text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                    {bar.label}
                </div>
            </div>
        );
      })}
    </div>
  );
};
