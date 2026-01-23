import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface Props {
  history: any[];
  loading: boolean;
}

export const DualAxisGrowthChart = ({ history, loading }: Props) => {
  
  if (loading) return <div className="w-full h-full animate-pulse bg-white/5 rounded-xl" />;
  if (!history || history.length < 2) return <div className="flex items-center justify-center h-full text-zinc-600 text-xs">Insufficient History</div>;

  // Transform data: Calculate Daily Earned (Delta)
  const data = history.map((curr, i) => {
      const prev = history[i - 1];
      const earned = prev ? Math.max(0, curr.credits - prev.credits) : 0;
      return {
          date: curr.date,
          credits: curr.credits, // Total line (optional)
          earned, // The BAR height
          rank: curr.rank || 0
      };
  }).slice(1); // Skip first point (no delta)

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          
          {/* X AXIS */}
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#52525b'}} 
            minTickGap={30}
            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})}
          />

          {/* LEFT AXIS: EARNINGS (BARS) */}
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#eab308'}} 
            width={30}
            tickFormatter={(val) => (val >= 1000 ? (val/1000).toFixed(0) + 'k' : val)}
          />

          {/* RIGHT AXIS: RANK (LINE) - INVERTED */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            reversed={true} // Rank 1 is higher visually
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#3b82f6'}} 
            width={30}
            domain={['auto', 'auto']}
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            itemStyle={{ padding: 0 }}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            formatter={(val: number, name: string) => [
                name === 'earned' ? `+${val.toLocaleString()} Credits` : `#${val}`,
                name === 'earned' ? 'Daily Earnings' : 'Global Rank'
            ]}
          />

          {/* THE METRICS */}
          <Bar yAxisId="left" dataKey="earned" fill="url(#barGradient)" barSize={8} radius={[2, 2, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="rank" stroke="#3b82f6" strokeWidth={2} dot={false} />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
