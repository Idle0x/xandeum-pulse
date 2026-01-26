import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const DualAxisGrowthChart = ({ 
  history, 
  loading, 
  mode, 
  showRank, 
  timeRange 
}: any) => {

  const data = useMemo(() => {
      if (!history || history.length === 0) return [];
      return [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  // FIX: CALCULATE DOMAIN MANUALLY FOR FLATLINE SUPPORT
  const domainSettings = useMemo(() => {
      if (data.length === 0) return { min: 0, max: 100 };

      const values = data.map((d: any) => d.credits);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      // If Flatline (0 Variance), create a forced buffer so Recharts can draw it
      if (minVal === maxVal) {
          return {
              min: Math.max(0, minVal - 10),
              max: maxVal + 10
          };
      }
      return { min: 'auto', max: 'auto' };
  }, [data]);

  if (loading) return <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600 animate-pulse">Loading Chart...</div>;
  
  if (!data || data.length === 0) {
      return <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600">No Data Available</div>;
  }

  return (
    <div className="w-full h-full min-h-[100px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
            <defs>
                <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />

            <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9, fill: '#555' }} 
                axisLine={false}
                tickLine={false}
                minTickGap={30}
                tickFormatter={(val) => {
                    const d = new Date(val);
                    return timeRange === '24H' 
                        ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : d.toLocaleDateString([], {month: 'short', day: 'numeric'});
                }}
            />

            <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[domainSettings.min, domainSettings.max]} // <--- APPLIED FIX
                tick={{ fontSize: 9, fill: '#eab308' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />

            <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                itemStyle={{ color: '#e4e4e7' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '2px' }}
                formatter={(value: any, name: string) => [
                    value.toLocaleString(), 
                    name === 'credits' ? 'Credits' : 'Rank'
                ]}
                labelFormatter={(label) => new Date(label).toLocaleString()}
            />

            <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="credits" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#eab308' }}
                animationDuration={500}
            />

            {showRank && (
                 <Line 
                    yAxisId="left" 
                    type="step" 
                    dataKey="rank" 
                    stroke="#3b82f6" 
                    strokeWidth={1} 
                    dot={false} 
                    opacity={0.5}
                 />
            )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
