// src/components/leaderboard/FilterControls.tsx
import React from 'react';
import { Search, X, Zap, Activity, Layers } from 'lucide-react';
import { NetworkType } from '../../types/leaderboard';

interface FilterControlsProps {
  networkFilter: NetworkType | 'COMBINED';
  setNetworkFilter: (val: NetworkType | 'COMBINED') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function FilterControls({ 
  networkFilter, setNetworkFilter, 
  searchQuery, setSearchQuery 
}: FilterControlsProps) {
  
  return (
    <div className="max-w-5xl mx-auto mb-6 relative space-y-3">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
           {/* NETWORK TOGGLE */}
           <div className="flex w-full md:w-auto bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
               <button onClick={() => setNetworkFilter('MAINNET')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'MAINNET' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                   <Zap size={12} className={networkFilter === 'MAINNET' ? 'fill-black' : ''}/> MAINNET
               </button>
               <button onClick={() => setNetworkFilter('DEVNET')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'DEVNET' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                   <Activity size={12} /> DEVNET
               </button>
               <button onClick={() => setNetworkFilter('COMBINED')} className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-2 ${networkFilter === 'COMBINED' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                   <Layers size={12} /> ALL
               </button>
           </div>

           {/* SEARCH BAR */}
           <div className="relative w-full">
              <Search className="absolute left-4 top-3 md:top-3.5 text-zinc-500" size={16} />
              <input 
                  type="text" 
                  placeholder={networkFilter === 'COMBINED' ? "Search all nodes..." : `Search ${networkFilter.toLowerCase()} nodes...`} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 md:p-3 pl-10 md:pl-12 pr-10 text-[12px] md:text-sm text-white focus:border-yellow-500 outline-none transition placeholder-zinc-600" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
              />
              {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3 md:top-3.5 text-zinc-500 hover:text-white">
                      <X size={16} />
                  </button>
              )}
           </div>
      </div>
    </div>
  );
}
