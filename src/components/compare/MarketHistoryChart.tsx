import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Database, Zap, Activity, Clock, Layers, Maximize2 } from 'lucide-react';
import { Node } from '../../types';
import { useMultiNodeHistory, HistoryTimeRange } from '../../hooks/useMultiNodeHistory';
import { formatBytes } from '../../utils/formatters';

interface MarketHistoryChartProps {
  nodes: Node[];
  themes: any[];
  metric: 'storage' | 'credits' | 'health' | 'uptime';
  hoveredNodeKey?: string | null;
  onHover?: (key: string | null) => void;
}

export const MarketHistoryChart = ({ nodes, themes, metric, hoveredNodeKey, onHover }: MarketHistoryChartProps) => {
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('7D');
  const [storageMode, setStorageMode] = useState<'USED' | 'COMMITTED'>('USED');

  // 1. Fetch Data for ALL nodes at once (Lazy loaded by parent mounting this component)
  const { historyMap, loading } = useMultiNodeHistory(nodes, timeRange);

  // 2. Transform Data for Recharts
  // We need a single array of objects where each object represents a timestamp,
  // and has keys for every node (e.g., { date: '...', nodeA: 10, nodeB: 20 })
  const chartData = useMemo(() => {
      if (loading || Object.keys(historyMap).length === 0) return [];

      // Find the node with the most history points to use as the "Master Timeline"
      const masterPubkey = Object.keys(historyMap).reduce((a, b) => 
          historyMap[a].length > historyMap[b].length ? a : b
      );
      const masterTimeline = historyMap[masterPubkey] || [];

      // Map timeline to data points
      return masterTimeline.map((snap, index) => {
          const point: any = { date: snap.created_at };
          
          nodes.forEach(node => {
              if (!node.pubkey) return;
              const nodeHistory = historyMap[node.pubkey];
              // Try to find a matching snapshot near this time, or fallback to index
              const nodeSnap = nodeHistory?.[index] || {}; 

              let val = 0;
              if (metric === 'credits') val = nodeSnap.credits || 0;
              if (metric === 'health') val = nodeSnap.health || 0;
              if (metric === 'uptime') val = nodeSnap.uptime || 0;
              if (metric === 'storage') {
                  val = storageMode === 'USED' 
                      ? (nodeSnap.storage_used || 0) 
                      : (nodeSnap.storage_committed || 0);
              }
              point[node.pubkey] = val;
          });
          return point;
      });
  }, [historyMap, nodes, metric, storageMode, loading]);

  // 3. Chart Configuration
  const isStacked = metric === 'credits' || metric === 'storage';
  const ChartComponent = isStacked ? AreaChart : LineChart;

  const formatYAxis = (val: number) => {
      if (metric === 'storage') return formatBytes(val);
      if (metric === 'credits') return (val / 1000).toFixed(0) + 'k';
      if (metric === 'uptime') return (val / 3600).toFixed(0) + 'h';
      return val.toString();
  };

  if (loading) return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <div className="text-xs font-mono text-zinc-500 uppercase">Synchronizing Timelines...</div>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-black/20 rounded-xl border border-white/5 overflow-hidden">
        
        {/* HEADER TOOLBAR */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-zinc-900/30">
            <div className="flex items-center gap-2">
                {metric === 'storage' && (
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                        <button onClick={() => setStorageMode('USED')} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition ${storageMode === 'USED' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Used</button>
                        <button onClick={() => setStorageMode('COMMITTED')} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition ${storageMode === 'COMMITTED' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Capacity</button>
                    </div>
                )}
                {!isStacked && <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider px-2">Multi-Axis Analysis</div>}
            </div>

            {/* TIMEFRAME SELECTOR */}
            <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                {['24H', '3D', '7D', '30D', 'ALL'].map((tf) => (
                    <button 
                        key={tf} 
                        onClick={() => setTimeRange(tf as HistoryTimeRange)} 
                        className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition ${timeRange === tf ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>

        {/* CHART AREA */}
        <div className="flex-1 w-full min-h-0 p-2 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={chartData}>
                    <defs>
                        {themes.map((theme, i) => (
                            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.hex} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={theme.hex} stopOpacity={0}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#71717a'}} 
                        minTickGap={30}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#71717a'}} 
                        width={40}
                        tickFormatter={formatYAxis}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ padding: 0 }}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        formatter={(value: number, name: string) => {
                            const node = nodes.find(n => n.pubkey === name);
                            return [
                                metric === 'storage' ? formatBytes(value) : value.toLocaleString(), 
                                node ? getSafeIp(node) : name.slice(0,8)
                            ];
                        }}
                    />
                    {nodes.map((node, i) => {
                        const theme = themes[i % themes.length];
                        const isActive = hoveredNodeKey === node.pubkey;
                        const isDimmed = hoveredNodeKey && hoveredNodeKey !== node.pubkey;

                        // Visual Logic
                        const opacity = isDimmed ? 0.1 : 1;
                        const strokeWidth = isActive ? 3 : 1.5;
                        const zIndex = isActive ? 100 : 1;

                        if (isStacked) {
                            return (
                                <Area 
                                    key={node.pubkey} 
                                    type="monotone" 
                                    dataKey={node.pubkey} 
                                    stackId="1" 
                                    stroke={theme.hex} 
                                    fill={`url(#grad-${i % themes.length})`}
                                    fillOpacity={opacity}
                                    strokeOpacity={opacity}
                                    strokeWidth={strokeWidth}
                                    onMouseEnter={() => onHover?.(node.pubkey || null)}
                                    onMouseLeave={() => onHover?.(null)}
                                />
                            );
                        } else {
                            return (
                                <Line 
                                    key={node.pubkey} 
                                    type="monotone" 
                                    dataKey={node.pubkey} 
                                    stroke={theme.hex} 
                                    dot={false}
                                    strokeOpacity={opacity}
                                    strokeWidth={strokeWidth}
                                    onMouseEnter={() => onHover?.(node.pubkey || null)}
                                    onMouseLeave={() => onHover?.(null)}
                                />
                            );
                        }
                    })}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
