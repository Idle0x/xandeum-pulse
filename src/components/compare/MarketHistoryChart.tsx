import { useState, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Node } from '../../types';
import { useMultiNodeHistory, HistoryTimeRange } from '../../hooks/useMultiNodeHistory';
import { formatBytes } from '../../utils/formatters';
import { getSafeIp } from '../../utils/nodeHelpers';

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

  // 1. Fetch Multi-Node Data
  const { historyMap, loading } = useMultiNodeHistory(nodes, timeRange);

  // 2. Data Transformation & Universal Scale Calculation
  const { chartData, globalMax } = useMemo(() => {
    if (loading || Object.keys(historyMap).length === 0) return { chartData: [], globalMax: 0 };

    // Find longest history to anchor the timeline (The Master Timeline)
    const masterPubkey = Object.keys(historyMap).reduce((a, b) => 
        historyMap[a].length > historyMap[b].length ? a : b
    );
    const masterTimeline = historyMap[masterPubkey] || [];

    let calculatedMax = 0;

    const data = masterTimeline.map((snap, index) => {
        // Create the base data point with the timestamp
        const point: any = { date: snap.created_at };

        nodes.forEach(node => {
            if (!node.pubkey) return;
            const nodeHistory = historyMap[node.pubkey];
            
            // --- FIX: DETECT MISSING SNAPSHOTS ---
            // If this node doesn't have a snapshot at this specific index (timeline mismatch),
            // we must set it to NULL, not 0. 0 implies a crash; Null implies "no data yet".
            const nodeSnap = nodeHistory?.[index];

            if (!nodeSnap) {
                point[node.pubkey] = null;
                return; 
            }

            let val: number | null = 0;

            // Strict Metric Isolation
            switch(metric) {
                case 'credits': 
                    val = nodeSnap.credits ?? null; 
                    break;
                case 'health': 
                    val = nodeSnap.health ?? null; 
                    break;
                case 'uptime': 
                    val = nodeSnap.uptime ?? null; 
                    break;
                case 'storage': 
                    // Strict mode check to ensure USED doesn't contaminate COMMITTED
                    val = storageMode === 'USED' 
                        ? (nodeSnap.storage_used ?? null) 
                        : (nodeSnap.storage_committed ?? null);
                    break;
            }

            // Fallback: If val is explicitly null (missing in DB), keep it null.
            // Only convert to 0 if we really mean 0. 
            // However, for graphing, if val is null, we treat it as null in the point object.
            
            point[node.pubkey] = val;

            // Only update Max if we have a valid number
            if (typeof val === 'number' && val > calculatedMax) {
                calculatedMax = val;
            }
        });

        return point;
    });

    return { chartData: data, globalMax: calculatedMax };
  }, [historyMap, nodes, metric, storageMode, loading]);

  // 3. Scale Configuration (Locking units for the entire Y-Axis)
  const scaleConfig = useMemo(() => {
    // If Global Max is 0 (empty data), default to base units to prevent division by zero errors
    const safeMax = globalMax || 1;

    if (metric === 'storage') {
        if (safeMax >= 1024 ** 4) return { divisor: 1024 ** 4, unit: 'TB' };
        if (safeMax >= 1024 ** 3) return { divisor: 1024 ** 3, unit: 'GB' };
        if (safeMax >= 1024 ** 2) return { divisor: 1024 ** 2, unit: 'MB' };
        return { divisor: 1024, unit: 'KB' };
    }
    if (metric === 'credits') {
        if (safeMax >= 1_000_000) return { divisor: 1_000_000, unit: 'M' };
        if (safeMax >= 1_000) return { divisor: 1_000, unit: 'k' };
        return { divisor: 1, unit: '' };
    }
    if (metric === 'uptime') return { divisor: 3600, unit: 'h' };
    return { divisor: 1, unit: '' }; // Health is 0-100
  }, [metric, globalMax]);

  // 4. Formatting Helpers
  const formatYAxis = useCallback((val: number) => {
    if (val === 0) return '0';
    const scaled = val / scaleConfig.divisor;
    const numStr = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
    return `${numStr} ${scaleConfig.unit}`;
  }, [scaleConfig]);

  const formatXAxis = useCallback((tickItem: string) => {
    const date = new Date(tickItem);
    if (timeRange === '24H') {
       return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  }, [timeRange]);

  if (loading) return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Aligning Node Histories...</div>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-black/20 rounded-xl border border-white/5 overflow-hidden">
        {/* TOOLBAR */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-zinc-900/30">
            <div className="flex items-center gap-2">
                {metric === 'storage' && (
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                        <button onClick={() => setStorageMode('USED')} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition ${storageMode === 'USED' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Used</button>
                        <button onClick={() => setStorageMode('COMMITTED')} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition ${storageMode === 'COMMITTED' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Capacity</button>
                    </div>
                )}
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider px-2">Performance Comparison</div>
            </div>

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
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#71717a'}} 
                        minTickGap={35}
                        tickFormatter={formatXAxis}
                        height={20}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#71717a'}} 
                        width={50}
                        tickFormatter={formatYAxis}
                        domain={[0, 'auto']} 
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '6px', fontWeight: 'bold' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        formatter={(value: any, name: any) => {
                            if (value === null) return ['No Data', name];
                            const node = nodes.find(n => n.pubkey === name);
                            const valNum = Number(value);
                            return [
                                metric === 'storage' ? formatBytes(valNum) : valNum.toLocaleString(), 
                                node ? getSafeIp(node) : 'Unknown Node'
                            ];
                        }}
                    />
                    {nodes.map((node, i) => {
                        if (!node.pubkey) return null;
                        const theme = themes[i % themes.length];
                        const isActive = hoveredNodeKey === node.pubkey;
                        const isDimmed = hoveredNodeKey && hoveredNodeKey !== node.pubkey;

                        return (
                            <Line 
                                key={node.pubkey} 
                                type="monotone" 
                                dataKey={node.pubkey} 
                                stroke={theme.hex} 
                                dot={false}
                                strokeOpacity={isDimmed ? 0.15 : 1}
                                strokeWidth={isActive ? 3 : 2}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                onMouseEnter={() => onHover?.(node.pubkey || null)}
                                onMouseLeave={() => onHover?.(null)}
                                animationDuration={800}
                                connectNulls={true} // IMPORTANT: Bridges gaps caused by missing/null data
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
