import { Node } from '../../types';
import { getSafeIp } from '../../utils/nodeHelpers';
import { formatBytes } from '../../utils/formatters';
import { formatUptimePrecise } from './MicroComponents';

export const UnifiedLegend = ({ nodes, themes, metricMode = 'COUNTRY', specificMetric, onNodeClick }: { nodes: Node[], themes: any[], metricMode: 'COUNTRY' | 'METRIC', specificMetric?: 'storage' | 'credits' | 'health' | 'uptime', onNodeClick?: (node: Node) => void }) => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 p-4 md:p-6 mt-auto border-t border-white/5 bg-black/40 min-h-[80px]">
         {nodes.map((node, i) => {
             // SAFETY FIX: Loop themes
             const theme = themes[i % themes.length];
             
             let metricDisplay = null;
             const showMetricInLegend = metricMode === 'METRIC' && specificMetric && specificMetric !== 'health';

             if (metricMode === 'COUNTRY') {
                 metricDisplay = (
                    <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                        {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2.5 h-2 md:w-4 md:h-3 rounded-[1px]" />}
                        <span className="text-[8px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-wide truncate">{node.location?.countryName || 'Unknown Region'}</span>
                    </div>
                 );
             } else if (showMetricInLegend) {
                 let val = '';
                 if (specificMetric === 'storage') val = formatBytes(node.storage_committed || 0);
                 if (specificMetric === 'credits') val = (node.credits || 0).toLocaleString();
                 if (specificMetric === 'uptime') val = formatUptimePrecise(node.uptime || 0);

                 metricDisplay = (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] md:text-xs text-white font-mono font-bold">{val}</span>
                        <span className="text-[6px] md:text-[10px] text-zinc-500 uppercase tracking-wide">Actual</span>
                    </div>
                 );
             }

             return (
                 <div 
                    key={node.pubkey} 
                    onClick={() => onNodeClick && onNodeClick(node)}
                    className={`flex gap-2 md:gap-3 items-start p-2 md:p-3 rounded md:rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition ${onNodeClick ? 'cursor-pointer hover:border-white/20' : ''}`}
                 >
                     <div className="w-2 h-2 md:w-3 md:h-3 rounded-full mt-1 shrink-0 shadow-lg" style={{ backgroundColor: theme.hex }}></div>
                     <div className="flex flex-col gap-0.5 md:gap-1 overflow-hidden w-full">
                         <div className="text-[8px] md:text-xs font-mono font-bold text-zinc-300 truncate w-full tracking-wide" title={node.pubkey}>
                            {metricMode === 'COUNTRY' ? node.pubkey : node.pubkey?.slice(0, 16) + '...'}
                         </div>
                         {metricMode !== 'COUNTRY' && (
                             <div className="flex items-center gap-1.5 opacity-60">
                                {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2.5 h-2 rounded-[1px]" />}
                                <div className="text-[7px] md:text-[9px] font-mono text-zinc-400 truncate">{getSafeIp(node)}</div>
                             </div>
                         )}
                         {metricMode === 'COUNTRY' && (
                             <div className="text-[9px] md:text-sm font-mono font-bold text-zinc-200 truncate">{getSafeIp(node)}</div>
                         )}
                         {metricDisplay}
                     </div>
                 </div>
             )
         })}
      </div>
    )
 }

export const OverviewLegend = ({ nodes, themes }: { nodes: Node[], themes: any[] }) => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-4 border-t border-white/5 bg-black/40 min-h-[60px]">
          {nodes.map((node, i) => {
              // SAFETY FIX: Loop themes
              const theme = themes[i % themes.length];
              return (
              <div key={node.pubkey} className="flex items-center gap-1.5 md:gap-2">
                   <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] border border-white/10" style={{ backgroundColor: theme.hex }}></div>
                   <div className="flex flex-col">
                        <span className="text-[9px] md:text-xs font-mono font-bold text-zinc-300">{node.pubkey?.slice(0, 12)}...</span>
                        <div className="flex items-center gap-1 opacity-50">
                             {node.location?.countryCode && <img src={`https://flagcdn.com/w40/${node.location.countryCode.toLowerCase()}.png`} className="w-2 h-1.5 rounded-[1px]" />}
                             <span className="text-[7px] md:text-[9px] font-mono text-zinc-400">{getSafeIp(node)}</span>
                        </div>
                   </div>
              </div>
          )})}
      </div>
    )
  }
