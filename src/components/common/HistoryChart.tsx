import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface HistoryChartProps {
  data: { date: string; value: number }[];
  color: string;
  loading: boolean;
  height?: number;
}

export const HistoryChart = ({ data, color, loading, height = 60 }: HistoryChartProps) => {
  if (loading) return <div className={`w-full h-[${height}px] animate-pulse bg-white/5 rounded-lg`} />;
  if (!data || data.length === 0) return <div className={`w-full h-[${height}px] flex items-center justify-center text-[10px] text-zinc-600`}>NO HISTORY DATA</div>;

  return (
    <div style={{ height }} className="w-full relative opacity-50 hover:opacity-100 transition-opacity duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: '#fff', strokeWidth: 0.5, opacity: 0.2 }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
