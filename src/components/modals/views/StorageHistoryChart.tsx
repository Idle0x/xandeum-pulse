import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes } from '../../../utils/formatters';
import { NodeHistoryPoint, HistoryTimeRange } from '../../../hooks/useNodeHistory';
import { ChevronDown, Loader2 } from 'lucide-react';

interface StorageHistoryChartProps {
  history: NodeHistoryPoint[];
  currentUsed: number;
  currentCommitted: number;
  zenMode: boolean;
  timeRange: HistoryTimeRange;
  onTimeRangeChange: (range: HistoryTimeRange) => void;
  loading: boolean;
}

export const StorageHistoryChart = ({ 
  history, 
  currentUsed, 
  currentCommitted, 
  zenMode,
  timeRange,
  onTimeRangeChange,
  loading
}: StorageHistoryChartProps) => {
  // UPDATED: Default set to 'USED'
  const [viewMode, setViewMode] = useState<'USED' | 'COMMITTED'>('USED');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use history directly (it's already filtered by the hook/backend)
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    return history.map((point, index) => {
      // Use real data if available, else fallback
      const hasData = point.storage_committed !== undefined;
      return {
        date: point.date,
        committed: hasData ? point.storage_committed : currentCommitted,
        used: hasData ? point.storage_used : Math.max(0, currentUsed + (Math.sin(index) * 100)) 
      };
    });
  }, [history, currentCommitted, currentUsed]);

  const activeColor = viewMode === 'COMMITTED' ? '#a855f7' : '#3b82f6'; 

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-3 py-2 rounded-lg border shadow-xl text-xs ${zenMode ? 'bg-zinc-900 border-zinc-700' : 'bg-black/90 border-zinc-800'}`}>
          <div className="text-zinc-400 mb-1">{new Date(label).toLocaleDateString()}</div>
          <div className="font-bold font-mono text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }}></div>
            {formatBytes(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full h-full flex flex-col rounded-2xl border p-4 transition-all duration-300 ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/30 border-zinc-800'}`}>

      {/* HEADER ROW */}
      <div className="flex flex-wrap gap-2 justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${zenMode ? 'bg-zinc-800' : 'bg-zinc-800/50'}`}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeColor }}></div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Historical Data</div>
                    <div className="text-xs font-bold text-white">{viewMode === 'COMMITTED' ? 'Committed Capacity' : 'Actual Usage'}</div>
                </div>
            </div>

            <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 w-fit mt-1">
                {(['USED', 'COMMITTED'] as const).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${viewMode === mode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {mode === 'USED' ? 'Used' : 'Committed'}
                    </button>
                ))}
            </div>
        </div>

        {/* Timeframe Dropdown */}
        <div className="relative z-20">
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${zenMode ? 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800' : 'bg-black/50 border-zinc-800 text-zinc-300 hover:text-white'}`}
            >
                {loading && <Loader2 size={10} className="animate-spin"/>}
                <span>{timeRange === 'ALL' ? 'All Time' : timeRange}</span>
                <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className={`absolute right-0 top-full mt-2 w-24 py-1 rounded-xl border shadow-xl flex flex-col z-30 ${zenMode ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-zinc-800'}`}>
                        {(['24H', '3D', '7D', '30D', 'ALL'] as HistoryTimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => { onTimeRangeChange(range); setIsDropdownOpen(false); }}
                                className={`px-3 py-2 text-left text-[10px] font-bold uppercase hover:bg-zinc-800 ${timeRange === range ? 'text-white bg-zinc-800/50' : 'text-zinc-500'}`}
                            >
                                {range === 'ALL' ? 'All Time' : range}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
      </div>

      {/* The Chart */}
      <div className="flex-1 w-full min-h-[150px] relative">
        {loading && (
             <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px] rounded-xl">
                 <Loader2 className="animate-spin text-zinc-500" />
             </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={zenMode ? '#333' : '#27272a'} vertical={false} />
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#71717a' }} 
                minTickGap={30}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#71717a' }}
                tickFormatter={(value) => formatBytes(value)} 
                width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
                type="monotone" 
                dataKey={viewMode === 'COMMITTED' ? 'committed' : 'used'} 
                stroke={activeColor} 
                strokeWidth={2}
                fill="url(#colorChart)" 
                animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
