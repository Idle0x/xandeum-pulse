import React, { useState, useEffect, useRef } from 'react';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { X, TrendingUp, TrendingDown, Minus, RefreshCw, Activity, WifiOff, Wifi } from 'lucide-react';

interface StabilityRibbonProps {
  history: NodeHistoryPoint[];
  loading: boolean;
  days?: number; 
  timeRange?: HistoryTimeRange;
  color?: string; 
}

export const StabilityRibbon = ({ history, loading, days = 30, timeRange = '30D', color: customColor }: StabilityRibbonProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. GLOBAL DISMISSAL (Click Outside) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedIdx(null);
      }
    };

    if (selectedIdx !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIdx]);

  const slots = Array.from({ length: days });

  if (loading) {
    return (
      <div className="flex gap-[2px] w-full animate-pulse h-2 md:h-3">
        {slots.map((_, i) => (
          <div key={i} className="flex-1 bg-zinc-800 rounded-[1px] opacity-20" />
        ))}
      </div>
    );
  }

  const displayData = history.slice(-days);

  // --- SMART FORMATTERS ---
  const formatHealth = (val: number) => Number(val.toFixed(2));

  const getDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
          return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // --- 2. FORENSIC STATE ANALYZER ---
  // Determines the state of a single point based on context
  const getPointState = (point: NodeHistoryPoint, prevPoint: NodeHistoryPoint | undefined) => {
      if (!point || point.health === 0) return { type: 'OFFLINE', color: 'bg-zinc-700', label: 'OFFLINE', icon: WifiOff, textColor: 'text-zinc-500' };

      const currUptime = point.uptime || 0;
      const prevUptime = prevPoint?.uptime || 0;

      // 1. RESTART DETECTION
      // If uptime dropped significantly (e.g., > 60s drop), it restarted.
      // Or if uptime is very low (< 10 mins) and we have no prev data context
      if ((prevPoint && currUptime < prevUptime - 60) || currUptime < 600) {
          return { type: 'RESTART', color: 'bg-blue-500', label: 'RESTARTED', icon: RefreshCw, textColor: 'text-blue-400' };
      }

      // 2. STAGNANT DETECTION
      // If uptime is identical to previous, but time has passed.
      if (prevPoint && Math.abs(currUptime - prevUptime) < 5 && point.health > 0) {
          return { type: 'STAGNANT', color: 'bg-yellow-500', label: 'STAGNANT', icon: Activity, textColor: 'text-yellow-500' };
      }

      // 3. LOW HEALTH (Degraded)
      if (point.health < 50) {
          return { type: 'DEGRADED', color: 'bg-orange-500', label: 'UNSTABLE', icon: Activity, textColor: 'text-orange-500' };
      }

      // 4. STABLE (Default)
      return { type: 'STABLE', color: 'bg-green-500', label: 'STABLE', icon: Wifi, textColor: 'text-green-400' };
  };


  // --- RENDER SELECTED TOOLTIP ---
  const renderTooltip = () => {
      if (selectedIdx === null) return null;

      const dataIndex = displayData.length - (days - selectedIdx);
      const point = displayData[dataIndex];
      const prevPoint = displayData[dataIndex - 1];

      if (!point) return null;

      // Calculate Trend
      const diff = prevPoint ? point.health - prevPoint.health : 0;
      const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
      const trendColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-500';

      // Analyze State
      const state = getPointState(point, prevPoint);

      // Edge Positioning
      let positionClass = "-translate-x-1/2 left-1/2"; 
      if (selectedIdx < 4) positionClass = "left-0 translate-x-0"; 
      if (selectedIdx > days - 5) positionClass = "right-0 translate-x-0"; 

      return (
          <div className={`absolute bottom-full mb-2 ${positionClass} z-50 animate-in fade-in zoom-in-95 duration-200`}>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 w-52 relative">
                  <div className={`absolute -bottom-1.5 w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 transform rotate-45 ${selectedIdx < 4 ? 'left-4' : selectedIdx > days - 5 ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>
                  
                  <div className="relative z-10 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SNAPSHOT</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(null); }} className="text-zinc-500 hover:text-white"><X size={12}/></button>
                      </div>

                      {/* Health Score */}
                      <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black ${point.health >= 80 ? 'text-green-400' : point.health >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {formatHealth(point.health)}
                          </span>
                          <span className="text-xs font-bold text-zinc-500">%</span>
                      </div>

                      {/* State Badge & Trend */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          {/* DYNAMIC STATE BADGE */}
                          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/5 bg-white/5 ${state.textColor}`}>
                              <state.icon size={10} />
                              <span className="text-[9px] font-black uppercase">{state.label}</span>
                          </div>

                          <span className="text-[9px] font-mono text-zinc-400">
                              {getDateLabel(point.date)}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      
      {/* TOOLTIP LAYER */}
      {renderTooltip()}

      {/* INTERACTIVE RIBBON */}
      <div className="flex gap-[2px] w-full h-2 md:h-3">
        {slots.map((_, i) => {
          const dataIndex = displayData.length - (days - i);
          const point = displayData[dataIndex];
          const prevPoint = displayData[dataIndex - 1];
          const isSelected = selectedIdx === i;

          // Determine visual style based on forensic state
          const state = point ? getPointState(point, prevPoint) : { color: 'bg-zinc-800/30' };
          let finalColor = state.color;
          if (customColor && point) finalColor = customColor; // Override if forced

          const style: React.CSSProperties = {};
          if (customColor && point) style.backgroundColor = customColor;

          return (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); point && setSelectedIdx(isSelected ? null : i); }}
              className={`
                  flex-1 rounded-[1px] transition-all duration-200 relative group
                  ${!customColor ? finalColor : ''} 
                  ${point ? 'cursor-pointer hover:opacity-100 hover:scale-y-150 origin-bottom' : 'opacity-30 cursor-default'}
                  ${isSelected ? 'opacity-100 scale-y-150 ring-1 ring-white/50 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-80'}
              `} 
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
};
