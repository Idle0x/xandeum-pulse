import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface HistoryChartProps {
  data: { date: string; value: number }[];
  color: string;
  loading: boolean;
  height?: number;
}

export const HistoryChart = ({ data, color, loading, height = 60 }: HistoryChartProps) => {
  // 1. Loading State: A subtle pulse skeleton
  if (loading) return <div className={`w-full h-[${height}px] animate-pulse bg-white/5 rounded-lg opacity-20`} />;
  
  // 2. Empty State: Don't break layout, just hide
  if (!data || data.length === 0) return null;

  // 3. Render: "Ghost" Chart (No axes, no grids, just signal)
  return (
    <div style={{ height }} className="w-full relative opacity-40 hover:opacity-100 transition-opacity duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: '#fff', strokeWidth: 1, opacity: 0.2 }}
            formatter={(value: number) => [value.toLocaleString(), 'Value']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${color.replace('#', '')})`} 
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
