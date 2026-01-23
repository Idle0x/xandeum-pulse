import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Props {
  history: any[];
  loading: boolean;
}

export const DualAxisGrowthChart = ({ history, loading }: Props) => {
  if (loading) return <div className="w-full h-full animate-pulse bg-zinc-900/30 rounded-xl" />;
  if (!history || history.length < 2) return <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-mono">Insufficient Data</div>;

  // Transform Data
  const data = history.map((curr, i) => {
      const prev = history[i - 1];
      const earned = prev ? Math.max(0, curr.credits - prev.credits) : 0;
      return {
          date: curr.date,
          earned, // Left Axis (Bar)
          rank: curr.rank || 0 // Right Axis (Line)
      };
  }).slice(1);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#eab308" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.4} />
          
          {/* X AXIS */}
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#52525b', fontFamily: 'monospace'}} 
            minTickGap={40}
            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric', month:'numeric'})}
          />

          {/* LEFT: EARNINGS */}
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#71717a', fontFamily: 'monospace'}} 
            width={40}
            domain={['auto', 'auto']} // Adapts to scale
            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}
          />

          {/* RIGHT: RANK (Inverted) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            reversed={true} 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#3b82f6', fontFamily: 'monospace'}} 
            width={40}
            domain={['auto', 'auto']}
          />

          <Tooltip 
            cursor={{ fill: '#ffffff05' }}
            content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                    <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs">
                        <div className="text-zinc-500 font-mono mb-2 border-b border-zinc-900 pb-1">
                            {new Date(label).toLocaleDateString()}
                        </div>
                        {payload.map((p: any, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 mb-1">
                                <span className="text-zinc-400 capitalize">{p.name === 'earned' ? 'Daily Yield' : 'Global Rank'}</span>
                                <span className={`font-mono font-bold ${p.name === 'earned' ? 'text-yellow-500' : 'text-blue-500'}`}>
                                    {p.name === 'earned' ? `+${p.value.toLocaleString()}` : `#${p.value}`}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            }}
          />

          <Bar 
            yAxisId="left" 
            dataKey="earned" 
            fill="url(#barGradient)" 
            barSize={12} 
            radius={[2, 2, 0, 0]} 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="rank" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
