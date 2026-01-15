import { CheckCircle } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes, formatUptime } from '../../../utils/formatters';
import { getSafeIp, compareVersions } from '../../../utils/nodeHelpers';

interface ZenCardProps {
  node: Node;
  onClick: (node: Node) => void;
  mostCommonVersion: string;
  sortBy: string;
}

export const ZenCard = ({ node, onClick, mostCommonVersion, sortBy }: ZenCardProps) => {
  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  const health = node.health || 0;
  const isVersionSort = sortBy === 'version';

  return (
    <div
      onClick={() => onClick(node)}
      // Removed hover:shadow-lg, transition-all, hover:border-zinc-600
      // Strict OLED black box
      className="group relative border border-zinc-800 bg-black p-3 md:p-4 rounded-xl cursor-pointer flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-2 md:mb-4 border-b border-zinc-800 pb-2 md:pb-3">
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">NODE ID</div>
          <div className="font-mono text-xs md:text-sm text-white truncate w-24 md:w-32 lg:w-48">{node.pubkey || 'Unknown'}</div>
          <div className="text-[9px] md:text-[10px] text-zinc-500 font-mono mt-0.5">{getSafeIp(node)}</div>
        </div>
        {/* Health: White if good, Zinc if bad. No Green/Yellow. */}
        <div className="text-lg md:text-xl font-bold font-mono text-white">
          {health}<span className="text-zinc-600 text-xs">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4 text-[10px] md:text-xs">
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Storage</div>
          <div className="font-mono text-zinc-300">{formatBytes(node.storage_used)}</div>
          {/* Progress Bar: High contrast White on Zinc-900 */}
          <div className="w-full h-1 bg-zinc-900 rounded-full mt-1">
            <div className="h-full bg-white" style={{ width: node.storage_usage_percentage }}></div>
          </div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Uptime</div>
          <div className="font-mono text-zinc-300">{formatUptime(node.uptime)}</div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Version</div>
          {/* Version Sort: Underlined or White Border, no color pulse */}
          <div className={`font-mono flex items-center gap-1 md:gap-2 ${isVersionSort ? 'text-white underline decoration-zinc-500 underline-offset-2' : 'text-zinc-400'}`}>
            {node.version} {isLatest && <CheckCircle size={8} className="text-zinc-500" />}
          </div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Health Rank</div>
          <div className="font-mono text-zinc-400">#{node.health_rank || '-'}</div>
        </div>
      </div>
    </div>
  );
};
