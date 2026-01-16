import { ReactNode } from 'react';
import { Activity, LayoutGrid, List } from 'lucide-react';

interface NodesContainerProps {
  children: ReactNode;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  count: number;
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  zenMode: boolean;
}

export const NodesContainer = ({
  children,
  viewMode,
  setViewMode,
  count,
  networkFilter,
  sortBy,
  sortOrder,
  zenMode
}: NodesContainerProps) => {
  if (zenMode) return <>{children}</>;

  return (
    <div className="border border-zinc-800 rounded-2xl bg-black/20 overflow-hidden mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* --- HEADER BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-5 gap-4 border-b border-zinc-800/50">
        
        {/* LEFT: Title Block */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
             <Activity className={networkFilter === 'MAINNET' ? "text-green-500" : networkFilter === 'DEVNET' ? "text-blue-500" : "text-white"} size={20} />
          </div>
          <div className="flex flex-col">
             <h3 className="text-sm md:text-lg font-bold text-white tracking-widest uppercase leading-tight flex items-center gap-2">
               {networkFilter === 'ALL' ? 'Nodes Registry' : networkFilter === 'MAINNET' ? <span className="text-green-500">Mainnet Nodes</span> : <span className="text-blue-500">Devnet Nodes</span>} 
               <span className="text-zinc-600 text-xs md:text-sm">({count})</span>
             </h3>
             <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 md:mt-1">
               Sorted by <span className="text-zinc-300">{sortBy}</span> ({sortOrder === 'asc' ? 'Low to High' : 'High to Low'})
             </div>
          </div>
        </div>

        {/* RIGHT: View Toggle (Segmented Control) */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-zinc-800 self-end md:self-auto">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
            title="List View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {/* Adding 'p-2' here naturally shrinks the grid items slightly as requested */}
      <div className={`transition-opacity duration-300 ${viewMode === 'grid' ? 'p-2 md:p-4' : 'p-0'}`}>
        {children}
      </div>

    </div>
  );
};
