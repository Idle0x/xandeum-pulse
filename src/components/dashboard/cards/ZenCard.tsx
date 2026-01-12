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
      className="group relative border border-zinc-800 bg-black/50 hover:border-zinc-600 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-2 md:mb-4 border-b border-zinc-800 pb-2 md:pb-3">
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">NODE ID</div>
          <div className="font-mono text-xs md:text-sm text-zinc-300 truncate w-24 md:w-32 lg:w-48">{node.pubkey || 'Unknown'}</div>
          <div className="text-[9px] md:text-[10px] text-zinc-600 font-mono mt-0.5">{getSafeIp(node)}</div>
        </div>
        <div className={`text-lg md:text-xl font-bold ${health && health >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
          {health}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4 text-[10px] md:text-xs">
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Storage</div>
          <div className="font-mono text-zinc-300">{formatBytes(node.storage_used)}</div>
          <div className="w-full h-1 bg-zinc-900 rounded-full mt-1">
            <div className="h-full bg-zinc-600" style={{ width: node.storage_usage_percentage }}></div>
          </div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Uptime</div>
          <div className="font-mono text-orange-400">{formatUptime(node.uptime)}</div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Version</div>
          <div className={`font-mono flex items-center gap-1 md:gap-2 ${isVersionSort ? 'text-cyan-400 animate-pulse' : 'text-zinc-300'}`}>
            {node.version} {isLatest && <CheckCircle size={8} className="text-green-500" />}
          </div>
        </div>
        <div>
          <div className="text-[8px] md:text-[9px] text-zinc-600 uppercase font-bold mb-1">Health Rank</div>
          <div className="font-mono text-yellow-600">#{node.health_rank || '-'}</div>
        </div>
      </div>
    </div>
  );
};
