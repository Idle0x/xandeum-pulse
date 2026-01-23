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
          earned, // Left Axis (Area)
          rank: curr.rank || 0 // Right Axis (Line)
      };
  }).slice(1);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
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

          {/* LEFT: EARNINGS (AREA) */}
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#71717a', fontFamily: 'monospace'}} 
            width={35}
            domain={['auto', 'auto']}
            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}
          />

          {/* RIGHT: RANK (LINE - Inverted) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            reversed={true} 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#3b82f6', fontFamily: 'monospace'}} 
            width={35}
            domain={['auto', 'auto']}
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

          {/* AREA CHART FOR EARNINGS */}
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="earned" 
            stroke="#eab308" 
            strokeWidth={1.5}
            fill="url(#areaGradient)" 
            animationDuration={800}
          />

          {/* LINE CHART FOR RANK */}
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="rank" 
            stroke="#3b82f6" 
            strokeWidth={1.5} 
            dot={false} 
            activeDot={{ r: 3, fill: '#3b82f6' }}
            animationDuration={800}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
