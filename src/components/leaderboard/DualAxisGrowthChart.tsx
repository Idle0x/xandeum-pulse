import React from 'react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
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

  // GET LAST VALUES FOR THE "PRICE LINE"
  const lastPoint = data[data.length - 1];
  const lastEarned = lastPoint?.earned || 0;
  const lastRank = lastPoint?.rank || 0;

  // Custom Label Renderer for the Price Line Badge
  const renderLabel = (props: any, color: string, prefix: string, isInt: boolean) => {
      const { viewBox } = props;
      const val = isInt ? Math.round(props.value) : props.value;
      const displayVal = val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toLocaleString();

      return (
          <g transform={`translate(${viewBox.width + 5}, ${viewBox.y + 4})`}>
              <rect x="0" y="-10" width="35" height="14" fill={color} rx="2" opacity="0.2" />
              <text x="17.5" y="0" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {prefix}{displayVal}
              </text>
          </g>
      );
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* Added Right Margin for the Labels */}
        <ComposedChart data={data} margin={{ top: 5, right: 35, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.5}/> 
              <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
          
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 8, fill: '#52525b', fontFamily: 'monospace'}} 
            minTickGap={30}
            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric'})}
            dy={5}
          />

          {/* LEFT: EARNINGS (Hidden Axis) */}
          <YAxis 
            yAxisId="left"
            hide={true}
            domain={['auto', 'auto']}
          />

          {/* RIGHT: RANK (Hidden Axis) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            reversed={true} 
            hide={true}
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

          {/* 1. EARNINGS AREA (Primary) */}
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="earned" 
            stroke="#eab308" 
            strokeWidth={1.5}
            fill="url(#areaGradient)" 
            animationDuration={800}
          />
          {/* Reference Line for Last Earnings Value */}
          <ReferenceLine 
            yAxisId="left" 
            y={lastEarned} 
            stroke="#eab308" 
            strokeDasharray="2 2" 
            opacity={0.5}
            label={(props) => renderLabel(props, '#eab308', '+', false)}
          />

          {/* 2. RANK LINE (Secondary/Dotted) */}
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="rank" 
            stroke="#3b82f6" 
            strokeWidth={1.5} 
            strokeDasharray="4 4" // Dotted Line
            opacity={0.5}         // Reduced Opacity
            dot={false} 
            activeDot={{ r: 3, fill: '#3b82f6' }}
            animationDuration={800}
          />
          {/* Reference Line for Last Rank Value */}
          <ReferenceLine 
            yAxisId="right" 
            y={lastRank} 
            stroke="#3b82f6" 
            strokeDasharray="2 2" 
            opacity={0.3}
            label={(props) => renderLabel(props, '#3b82f6', '#', true)}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
