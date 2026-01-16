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
      {/* Layout: Row on both Mobile and Desktop for compact alignment */}
      <div className="flex flex-row justify-between items-center p-3 md:p-5 border-b border-zinc-800/50 gap-2">
        
        {/* LEFT: Title Block */}
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
          <div className="shrink-0">
             <Activity className={networkFilter === 'MAINNET' ? "text-green-500" : networkFilter === 'DEVNET' ? "text-blue-500" : "text-white"} size={16} className="md:w-5 md:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
             <h3 className="text-xs md:text-lg font-bold text-white tracking-widest uppercase leading-tight flex items-center gap-2 truncate">
               <span className="truncate">
                 {networkFilter === 'ALL' ? 'Nodes Registry' : networkFilter === 'MAINNET' ? <span className="text-green-500">Mainnet</span> : <span className="text-blue-500">Devnet</span>}
               </span>
               <span className="text-zinc-600 text-[10px] md:text-sm shrink-0">({count})</span>
             </h3>
             <div className="text-[8px] md:text-[9px] font-mono text-zinc-500 uppercase mt-0.5 truncate hidden sm:block">
               Sorted by <span className="text-zinc-300">{sortBy}</span> ({sortOrder === 'asc' ? 'Low to High' : 'High to Low'})
             </div>
          </div>
        </div>

        {/* RIGHT: View Toggle (Segmented Control) */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-zinc-800 shrink-0">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 md:p-1.5 rounded transition-all duration-300 ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
            title="Grid View"
          >
            <LayoutGrid size={14} className="md:w-4 md:h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 md:p-1.5 rounded transition-all duration-300 ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
            title="List View"
          >
            <List size={14} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className={`transition-opacity duration-300 ${viewMode === 'grid' ? 'p-2 md:p-4' : 'p-0'}`}>
        {children}
      </div>

    </div>
  );
};
