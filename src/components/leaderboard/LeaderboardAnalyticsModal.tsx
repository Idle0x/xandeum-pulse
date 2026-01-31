import { useState, useMemo } from 'react';
import { X, Trophy, Wallet, Activity, BarChart3, ChevronDown, Network } from 'lucide-react';
import { 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  ComposedChart 
} from 'recharts';
import { useNetworkHistory, HistoryTimeRange } from '../../hooks/useNetworkHistory';

type NetworkScope = 'MAINNET' | 'DEVNET' | 'COMBINED';

interface LeaderboardAnalyticsModalProps {
  onClose: () => void;
  currentStats?: {
    totalCredits: number;
    avgCredits: number;
    dominance: number;
    nodeCount: number;
  };
  initialNetwork?: NetworkScope;
}

const TIME_OPTIONS = [
    { label: '24 Hours', value: '24H' },
    { label: '3 Days', value: '3D' },
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: 'All Time', value: 'ALL' },
] as const;

const AXIS_STYLE = {
    fontSize: 9, 
    fill: '#52525b', // zinc-600
    fontFamily: 'monospace'
};

export const LeaderboardAnalyticsModal = ({ onClose, currentStats, initialNetwork = 'MAINNET' }: LeaderboardAnalyticsModalProps) => {
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>('24H');
  const [networkScope, setNetworkScope] = useState<NetworkScope>(initialNetwork);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Independent toggles for "Show Nodes" on each chart
  const [nodeToggles, setNodeToggles] = useState({
    credits: false,
    dominance: false,
    avg: false
  });

  const toggleNodes = (key: keyof typeof nodeToggles) => {
    setNodeToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const { history, loading } = useNetworkHistory(timeRange);

  const formatXAxis = (val: string) => {
      const date = new Date(val);
      if (timeRange === '24H') {
          return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const keys = useMemo(() => {
      const prefix = networkScope === 'COMBINED' ? 'total_' : `${networkScope.toLowerCase()}_`;
      const avgPrefix = networkScope === 'COMBINED' ? 'avg_' : `${networkScope.toLowerCase()}_avg_`;
      const domKey = networkScope === 'COMBINED' ? 'top10_dominance' : `${networkScope.toLowerCase()}_dominance`;

      return {
          credits: networkScope === 'COMBINED' ? 'total_credits' : `${networkScope.toLowerCase()}_credits`, 
          avg: `${avgPrefix}credits`, 
          dominance: domKey,
          nodes: networkScope === 'COMBINED' ? 'total_nodes' : `${networkScope.toLowerCase()}_nodes`
      };
  }, [networkScope]);

  const metrics = useMemo(() => {
      if (!history || history.length < 2) return null;

      const start = history[0];
      const end = history[history.length - 1];
      const days = history.length;
      const getVal = (obj: any, key: string) => Number(obj[key] || 0);

      const startCreds = getVal(start, keys.credits);
      const endCreds = getVal(end, keys.credits);

      const startDom = getVal(start, keys.dominance);
      const endDom = getVal(end, keys.dominance);

      const startAvg = getVal(start, keys.avg);
      const endAvg = getVal(end, keys.avg);

      return {
          currentValues: {
              credits: endCreds,
              dominance: endDom,
              avg: endAvg
          },
          credit: { 
              delta: endCreds - startCreds, 
              pct: startCreds > 0 ? ((endCreds - startCreds) / startCreds) * 100 : 0 
          },
          dom: { 
              delta: endDom - startDom 
          },
          avg: { 
              delta: endAvg - startAvg, 
              velocity: days > 0 ? Math.round((endAvg - startAvg) / days) : 0 
          }
      };
  }, [history, keys]);

  const ChartHeader = ({ 
      icon: Icon, 
      title, 
      value, 
      delta, 
      pct, 
      suffix = '', 
      subLabel, 
      customRightElement,
      toggleKey,
      isToggled
  }: any) => {
      const isPos = delta > 0;
      const isNeg = delta < 0;
      const color = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-zinc-500';

      return (
          <div className="flex justify-between items-start mb-2 w-full border-b border-zinc-800/30 pb-3 shrink-0">
              <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Icon size={10} className="text-zinc-600"/> {title}
                      </div>
                      <button 
                        onClick={() => toggleNodes(toggleKey)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors border ${
                            isToggled 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                : 'bg-zinc-800/50 text-zinc-600 border-zinc-800 hover:text-zinc-400'
                        }`}
                        title={isToggled ? "Hide Nodes" : "Show Nodes Overlay"}
                      >
                        <Network size={8} />
                        {isToggled ? 'Nodes On' : 'Nodes'}
                      </button>
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight font-mono">
                      {value}
                  </div>
              </div>
              <div className="flex flex-col items-end justify-center min-h-[40px]">
                  <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">
                      {subLabel || `Growth (${timeRange})`}
                  </div>
                  {customRightElement ? (
                      customRightElement
                  ) : (
                      !loading && metrics ? (
                          <div className={`flex items-center gap-1.5 ${color}`}>
                              <span className="text-[10px] font-mono font-bold">
                                  {isPos ? '+' : ''}{suffix ? delta.toFixed(2) + suffix : delta.toLocaleString()}
                              </span>
                              {pct !== undefined && (
                                  <span className={`text-[9px] px-1 py-0.5 rounded bg-zinc-900 border ${isPos ? 'border-emerald-500/20 text-emerald-500' : isNeg ? 'border-rose-500/20 text-rose-500' : 'border-zinc-800 text-zinc-500'}`}>
                                      {Math.abs(pct).toFixed(2)}%
                                  </span>
                              )}
                          </div>
                      ) : (
                          <div className="w-12 h-3 bg-zinc-800/50 rounded animate-pulse" />
                      )
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-800/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/10">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Market Analysis</h3>
              <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                  Financial Report & Trends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg mr-2">
                {(['MAINNET', 'DEVNET', 'COMBINED'] as const).map((net) => (
                    <button
                        key={net}
                        onClick={() => setNetworkScope(net)}
                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            networkScope === net 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                    >
                        {net === 'COMBINED' ? 'All' : net}
                    </button>
                ))}
            </div>

            <div className="relative">
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-[10px] font-bold text-zinc-300 rounded transition-all min-w-[100px] justify-between uppercase tracking-wider"
                >
                    <span>{TIME_OPTIONS.find(o => o.value === timeRange)?.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-950 border border-zinc-800 rounded shadow-xl overflow-hidden py-1 z-50">
                        {TIME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setTimeRange(opt.value); setIsDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-900 ${timeRange === opt.value ? 'text-white bg-zinc-900' : 'text-zinc-500'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition"><X size={16} /></button>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="space-y-4">

            {/* ROW 1: TOTAL CREDITS */}
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-72 flex flex-col relative overflow-hidden">
                <ChartHeader 
                    icon={Wallet}
                    title={`${networkScope === 'COMBINED' ? 'Total' : networkScope} Credits`}
                    value={metrics ? (metrics.currentValues.credits / 1_000_000).toFixed(2) + "M" : "Loading..."}
                    delta={metrics?.credit.delta}
                    pct={metrics?.credit.pct}
                    toggleKey="credits"
                    isToggled={nodeToggles.credits}
                />
                <div className="flex-1 w-full min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor={networkScope === 'DEVNET' ? "#3b82f6" : "#eab308"} stopOpacity={0.15}/>
                                 <stop offset="95%" stopColor={networkScope === 'DEVNET' ? "#3b82f6" : "#eab308"} stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />

                           <XAxis 
                               dataKey="date" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={AXIS_STYLE} 
                               minTickGap={40} 
                               tickFormatter={formatXAxis} 
                           />

                           {/* LEFT Y-AXIS (Nodes) - Conditional */}
                           {nodeToggles.credits && (
                               <YAxis 
                                   yAxisId="left"
                                   orientation="left"
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={{ ...AXIS_STYLE, fill: '#3b82f6' }} 
                                   width={40} 
                                   domain={['auto', 'auto']}
                               />
                           )}

                           {/* RIGHT Y-AXIS (Credits) */}
                           <YAxis 
                               yAxisId="right"
                               orientation="right"
                               axisLine={false} 
                               tickLine={false} 
                               tick={AXIS_STYLE} 
                               width={40} 
                               domain={['auto', 'auto']}
                               tickFormatter={(val) => (val/1000000).toFixed(1) + 'M'} 
                           />

                           <Tooltip 
                               contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                               itemStyle={{ fontFamily: 'monospace' }} 
                               labelFormatter={(label) => new Date(label).toLocaleString()}
                           />

                           {/* MAIN METRIC AREA (Mapped to Right Axis) */}
                           <Area 
                                yAxisId="right"
                                type="monotone" 
                                dataKey={keys.credits} 
                                name="Credits"
                                stroke={networkScope === 'DEVNET' ? "#3b82f6" : "#eab308"} 
                                strokeWidth={2} 
                                fill="url(#creditGrad)" 
                                animationDuration={1000} 
                           />

                           {/* NODES LINE OVERLAY (Mapped to Left Axis) */}
                           {nodeToggles.credits && (
                               <Line 
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey={keys.nodes}
                                    name="Total Nodes"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    animationDuration={1000}
                               />
                           )}
                        </ComposedChart>
                     </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2: SMALLER CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* DOMINANCE */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-64 flex flex-col">
                    <ChartHeader 
                        icon={BarChart3}
                        title="Top 10 Dominance"
                        value={metrics ? metrics.currentValues.dominance.toFixed(1) + "%" : "..."}
                        delta={metrics?.dom.delta}
                        suffix="%"
                        toggleKey="dominance"
                        isToggled={nodeToggles.dominance}
                    />
                    <div className="flex-1 w-full mt-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />

                               <XAxis 
                                   dataKey="date" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   minTickGap={30}
                                   tickFormatter={formatXAxis}
                               />

                               {/* LEFT Y-AXIS (Nodes) */}
                               {nodeToggles.dominance && (
                                   <YAxis 
                                       yAxisId="left"
                                       orientation="left"
                                       axisLine={false} 
                                       tickLine={false} 
                                       tick={{ ...AXIS_STYLE, fill: '#3b82f6' }} 
                                       width={40} 
                                       domain={['auto', 'auto']}
                                   />
                               )}

                               {/* RIGHT Y-AXIS (Dominance) */}
                               <YAxis 
                                   yAxisId="right"
                                   orientation="right"
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   width={40}
                                   domain={['auto', 'auto']}
                                   tickFormatter={(val) => val.toFixed(0) + '%'}
                               />

                               <Tooltip 
                                   contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                                   itemStyle={{ fontFamily: 'monospace' }}
                                   labelFormatter={(label) => new Date(label).toLocaleString()}
                               />

                               <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey={keys.dominance} 
                                    name="Dominance"
                                    stroke="#3b82f6" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    animationDuration={1000} 
                                />

                                {nodeToggles.dominance && (
                                   <Line 
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey={keys.nodes}
                                        name="Total Nodes"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        animationDuration={1000}
                                   />
                               )}
                            </ComposedChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* AVERAGE EARNINGS */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-5 h-64 flex flex-col">
                    <ChartHeader 
                        icon={Activity}
                        title="Average Earnings"
                        value={metrics ? (metrics.currentValues.avg / 1000).toFixed(1) + "k" : "..."}
                        subLabel="Daily Credits Yield"
                        toggleKey="avg"
                        isToggled={nodeToggles.avg}
                        customRightElement={
                            metrics && (
                                <div className={`text-[10px] font-mono font-bold ${metrics.avg.velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {metrics.avg.velocity > 0 ? '+' : ''}{metrics.avg.velocity}/day
                                </div>
                            )
                        }
                    />
                    <div className="flex-1 w-full mt-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={history} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />

                               <XAxis 
                                   dataKey="date" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   minTickGap={30}
                                   tickFormatter={formatXAxis}
                               />

                               {/* LEFT Y-AXIS (Nodes) */}
                               {nodeToggles.avg && (
                                   <YAxis 
                                       yAxisId="left"
                                       orientation="left"
                                       axisLine={false} 
                                       tickLine={false} 
                                       tick={{ ...AXIS_STYLE, fill: '#3b82f6' }} 
                                       width={40} 
                                       domain={['auto', 'auto']}
                                   />
                               )}

                               {/* RIGHT Y-AXIS (Avg Earnings) */}
                               <YAxis 
                                   yAxisId="right"
                                   orientation="right"
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={AXIS_STYLE}
                                   width={40}
                                   domain={['auto', 'auto']}
                                   tickFormatter={(val) => (val/1000).toFixed(1) + 'k'}
                               />

                               <Tooltip 
                                   contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }} 
                                   itemStyle={{ fontFamily: 'monospace' }}
                                   labelFormatter={(label) => new Date(label).toLocaleString()}
                               />

                               <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey={keys.avg} 
                                    name="Avg Earnings"
                                    stroke="#d4d4d8" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    animationDuration={1000} 
                               />

                               {nodeToggles.avg && (
                                   <Line 
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey={keys.nodes}
                                        name="Total Nodes"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        animationDuration={1000}
                                   />
                               )}
                            </ComposedChart>
                         </ResponsiveContainer>
                    </div>
                </div>

            </div>

        </div>
      </div>
    </div>
  );
};
