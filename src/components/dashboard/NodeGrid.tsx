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
    <div className={`grid gap-2 md:gap-4 ${zenMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:gap-8'}`}>
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
  );
};
