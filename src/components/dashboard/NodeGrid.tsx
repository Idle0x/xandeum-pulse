import { PulseGraphLoader } from '../common/Loaders';
import { NodeCard } from './cards/NodeCard';
import { ZenCard } from './cards/ZenCard';
import { Node } from '../../types';

interface NodeGridProps {
  loading: boolean;
  nodes: Node[];
  zenMode: boolean;
  cycleStep: number;
  mostCommonVersion: string;
  sortBy: string;
  onNodeClick: (node: Node) => void;
  onToggleFavorite: (e: React.MouseEvent, address: string) => void;
  favorites: string[];
}

export const NodeGrid = ({
  loading,
  nodes,
  zenMode,
  cycleStep,
  mostCommonVersion,
  sortBy,
  onNodeClick,
  onToggleFavorite,
  favorites
}: NodeGridProps) => {

  // 1. Loading State
  if (loading && nodes.length === 0) {
    return <PulseGraphLoader />;
  }

  // 2. Empty State
  if (!loading && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <div className="text-zinc-500 font-mono text-sm">No nodes found matching criteria.</div>
      </div>
    );
  }

  // 3. Grid Render
  return (
    <div className="pb-20">
      <div className={`grid gap-2 md:gap-4 ${zenMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:gap-8'} mb-8`}>
        {nodes.map((node, index) => {
          const uniqueKey = node.pubkey ? `${node.pubkey}-${node.network}` : `fallback-${index}`;
          
          if (zenMode) {
            return (
               <ZenCard 
                 key={uniqueKey} 
                 node={node} 
                 onClick={onNodeClick} 
                 mostCommonVersion={mostCommonVersion} 
                 sortBy={sortBy} 
               />
            );
          }
          
          return (
            <NodeCard 
              key={uniqueKey} 
              node={node} 
              onClick={onNodeClick} 
              onToggleFavorite={onToggleFavorite} 
              isFav={favorites.includes(node.address || '')} 
              cycleStep={cycleStep} 
              zenMode={zenMode} 
              mostCommonVersion={mostCommonVersion} 
              sortBy={sortBy} 
            />
          );
        })}
      </div>

      {/* --- ACTIVE PODS UPLINK (Separator at bottom) --- */}
      <div className="flex items-center justify-center animate-in fade-in duration-1000">
         <div className="group flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-white/10 hover:bg-black/60 cursor-help" title="Live count of filtered nodes currently in view">
            <div className="relative flex h-1.5 w-1.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 duration-1000"></span>
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-zinc-400 transition-colors">
               <span>Active Pods Uplink</span>
               <span className="text-zinc-700">|</span>
               <span className="text-zinc-300 font-black text-[10px]">{nodes.length}</span>
            </div>
         </div>
      </div>
    </div>
  );
};
