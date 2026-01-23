import React from 'react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Props {
  history: any[];
  loading: boolean;
}

export const DualAxisGrowthChart = ({ history, loading }: Props) => {
  if (loading) return <div className="w-full h-full animate-pulse bg-zinc-900/30 rounded-xl" />;
  if (!history || history.length < 2) return <div className="flex items-center justify-center h-full text-zinc-600 text-[9px] font-mono">Insufficient Data</div>;

  // Transform Data
  const data = history.map((curr, i) => {
      const prev = history[i - 1];
      const earned = prev ? Math.max(0, curr.credits - prev.credits) : 0;
      return {
          date: curr.date,
          earned, 
          rank: curr.rank || 0
      };
  }).slice(1);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* Adjusted margins to fit the axes comfortably */}
        <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/> 
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
          
          {/* X AXIS */}
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#52525b', fontFamily: 'monospace'}} 
            minTickGap={30}
            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})}
            dy={5}
          />

          {/* LEFT AXIS: RANK (Blue, Integers Only) */}
          <YAxis 
            yAxisId="left"
            orientation="left"
            reversed={true} // Rank 1 is top
            allowDecimals={false} // Prevent 36.6
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#3b82f6', fontFamily: 'monospace'}} 
            width={30}
            // Add padding to domain so it doesn't look zoomed in on 1 rank change
            domain={['auto', 'auto']}
          />

          {/* RIGHT AXIS: EARNINGS (Yellow, Compact K notation) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#71717a', fontFamily: 'monospace'}} 
            width={35}
            domain={['auto', 'auto']}
            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}
          />

          <Tooltip 
            cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const dateStr = label ? new Date(label).toLocaleDateString() : '';

                return (
                    <div className="bg-zinc-950 border border-zinc-800 p-2 rounded shadow-xl text-[10px]">
                        <div className="text-zinc-500 font-mono mb-1.5 border-b border-zinc-900 pb-0.5">
                            {dateStr}
                        </div>
                        {payload.map((p: any, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 mb-0.5">
                                <span className="text-zinc-400 capitalize">{p.name === 'earned' ? 'Yield' : 'Rank'}</span>
                                <span className={`font-mono font-bold ${p.name === 'earned' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                    {p.name === 'earned' ? `+${Number(p.value).toLocaleString()}` : `#${p.value}`}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            }}
          />

          {/* EARNINGS AREA (Right Axis) */}
          <Area 
            yAxisId="right" 
            type="monotone" 
            dataKey="earned" 
            stroke="#eab308" 
            strokeWidth={1.5}
            fill="url(#areaGradient)" 
            animationDuration={800}
          />

          {/* RANK LINE (Left Axis) */}
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
            animationDuration={800}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
