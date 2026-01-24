import React from 'react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Props {
  history: any[];
  loading: boolean;
  mode: 'ACCUMULATION' | 'VELOCITY'; 
  showRank: boolean;     
  timeRange: string; // <--- NEW PROP
}

export const DualAxisGrowthChart = ({ history, loading, mode, showRank, timeRange }: Props) => {
  if (loading) return <div className="w-full h-full animate-pulse bg-zinc-900/30 rounded-xl" />;
  if (!history || history.length < 2) return <div className="flex items-center justify-center h-full text-zinc-600 text-[9px] font-mono">Insufficient Data</div>;

  // 1. FORMATTING LOGIC
  const formatAxis = (tickItem: string | number) => {
    const date = new Date(tickItem);
    if (timeRange === '24H') {
        // Returns "14:30" or "02:30"
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // Returns "Jan 24"
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatTooltipLabel = (label: string | number) => {
      const date = new Date(label);
      if (timeRange === '24H') {
          // Full Date + Time for context
          return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // 2. DATA TRANSFORMATION
  const data = history.map((curr, i) => {
      const prev = history[i - 1];
      let creditValue = 0;

      if (mode === 'ACCUMULATION') {
          creditValue = curr.credits; 
      } else {
          creditValue = prev ? Math.max(0, curr.credits - prev.credits) : 0;
      }

      return {
          date: curr.date,
          credits: creditValue,
          rank: curr.rank || 0
      };
  });

  const chartData = mode === 'VELOCITY' ? data.slice(1) : data;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/> 
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />

          {/* 3. UPDATED XAXIS */}
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#52525b', fontFamily: 'monospace'}} 
            // Use slightly larger gap for Time string to avoid "12:00 13:00" bunching
            minTickGap={timeRange === '24H' ? 40 : 30} 
            tickFormatter={formatAxis}
            dy={5}
          />

          {showRank && (
              <YAxis 
                yAxisId="left"
                orientation="left"
                reversed={true} 
                allowDecimals={false}
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 8, fill: '#3b82f6', fontFamily: 'monospace'}} 
                width={35} 
                domain={['auto', 'auto']}
              />
          )}

          <YAxis 
            yAxisId="right"
            orientation="right"
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#71717a', fontFamily: 'monospace'}} 
            width={45} 
            domain={['auto', 'auto']} 
            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}
          />

          <Tooltip 
            cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                return (
                    <div className="bg-zinc-950 border border-zinc-800 p-2 rounded shadow-xl text-[10px]">
                        <div className="text-zinc-500 font-mono mb-1.5 border-b border-zinc-900 pb-0.5">
                            {/* Updated Label Formatter */}
                            {formatTooltipLabel(label)}
                        </div>
                        {payload.map((p: any, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 mb-0.5">
                                <span className="text-zinc-400 capitalize">
                                    {p.name === 'credits' 
                                        ? (mode === 'ACCUMULATION' ? 'Total Credits' : 'Daily Yield') 
                                        : 'Rank'}
                                </span>
                                <span className={`font-mono font-bold ${p.name === 'credits' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                    {p.name === 'credits' ? Number(p.value).toLocaleString() : `#${p.value}`}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            }}
          />

          <Area 
            yAxisId="right" 
            type="monotone" 
            dataKey="credits" 
            stroke="#eab308" 
            strokeWidth={1.5}
            fill="url(#areaGradient)" 
            animationDuration={500}
          />

          {showRank && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="rank" 
                stroke="#3b82f6" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                opacity={0.6}
                dot={false} 
                activeDot={{ r: 3, fill: '#3b82f6' }}
                animationDuration={500}
              />
          )}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
