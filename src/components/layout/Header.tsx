import { 
  Menu, Activity, Search, Monitor, RefreshCw, Repeat, 
  Clock, Database, Server, HeartPulse, ArrowUp, ArrowDown, Info, X 
} from 'lucide-react';

interface HeaderProps {
  onToggleMenu: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
  lastSync: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (val: boolean) => void;
  searchTip: string;
  loading: boolean;
  isBackgroundSyncing: boolean;
  onRefetch: () => void;
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET';
  onCycleNetwork: (e: React.MouseEvent) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (metric: 'uptime' | 'version' | 'storage' | 'health') => void;
}

export const Header = ({
  onToggleMenu, zenMode, onToggleZen, lastSync,
  searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused, searchTip,
  loading, isBackgroundSyncing, onRefetch,
  networkFilter, onCycleNetwork,
  sortBy, sortOrder, onSortChange
}: HeaderProps) => {
  return (
    <header className={`sticky top-0 z-[50] border-b px-4 py-1 md:py-3 flex flex-col gap-1 md:gap-4 transition-all duration-500 overflow-visible ${zenMode ? 'bg-black border-zinc-800' : 'bg-[#09090b]/90 backdrop-blur-md border-zinc-800'}`}>
      <div className="flex justify-between items-center w-full">
        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-4">
          <button onClick={onToggleMenu} className={`p-2 md:p-3.5 rounded-xl transition ${zenMode ? 'text-zinc-400 border border-zinc-800 hover:text-white' : 'text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'}`}>
            <Menu size={20} className="md:w-7 md:h-7" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
              <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={20} /> PULSE
            </h1>
            <span className="text-[9px] text-zinc-600 font-mono tracking-wider ml-1">Sync: {lastSync}</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-4 relative group flex flex-col items-center">
          <div className="relative w-full overflow-hidden rounded-lg">
            <Search className={`absolute left-3 top-2.5 size-4 z-10 ${zenMode ? 'text-zinc-600' : 'text-zinc-500'}`} />
            {!zenMode && !searchQuery && !isSearchFocused && (
              <div className="absolute inset-0 flex items-center pointer-events-none pl-10 pr-4 overflow-hidden z-0">
                <div className="whitespace-nowrap animate-marquee text-sm text-zinc-600 font-mono opacity-80">
                  Search nodes by Version, IP Address, Country, or Public Key...
                </div>
              </div>
            )}
            <input 
              type="text" 
              placeholder={zenMode ? "Search..." : ""} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className={`w-full rounded-lg py-2 pl-10 pr-8 md:pr-4 text-sm outline-none transition-all relative z-10 bg-transparent ${zenMode ? 'border border-zinc-800 text-zinc-300 focus:border-zinc-600 placeholder:text-zinc-700' : 'border border-zinc-800 text-white focus:border-blue-500 shadow-inner'}`} 
              onFocus={() => setIsSearchFocused(true)} 
              onBlur={() => setIsSearchFocused(false)} 
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-zinc-500 hover:text-white transition z-20 p-0.5 bg-black/20 rounded-full hover:bg-zinc-700"><X size={14} /></button>}
          </div>
          {!zenMode && (
            <div className="mt-1 md:mt-2 w-full text-center pointer-events-none min-h-[16px] md:min-h-[20px] transition-all duration-300 hidden md:block">
              <p className="text-[9px] md:text-xs text-zinc-500 font-mono tracking-wide uppercase flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500 whitespace-normal text-center leading-tight">
                <Info size={10} className="text-blue-500 shrink-0 md:w-3 md:h-3" />
                <span>{isSearchFocused ? 'Type to filter nodes instantly' : searchTip}</span>
              </p>
            </div>
          )}
          {!zenMode && <style jsx>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } } .animate-marquee { animation: marquee 15s linear infinite; } `}</style>}
        </div>

        {/* Right: Zen Toggle */}
        <button onClick={onToggleZen} className={`p-2 rounded-lg transition flex items-center gap-2 group ${zenMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white' : 'bg-red-900/10 border border-red-500/20 text-red-500 hover:bg-red-900/30'}`} title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}>
          <Monitor size={18} />
          <span className="hidden md:inline text-xs font-bold">{zenMode ? 'EXIT ZEN' : 'ZEN MODE'}</span>
        </button>
      </div>

      {/* Bottom Row: Controls */}
      <div className="flex items-center justify-between gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-2 scrollbar-hide w-full mt-1 md:mt-6 border-t border-zinc-800/50 pt-2 overflow-visible">
        {/* Refresh */}
        <button onClick={onRefetch} disabled={loading} className={`flex items-center gap-1 md:gap-2 px-3 h-6 md:px-6 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs shrink-0 ${loading ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-wait' : zenMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-zinc-900 border border-zinc-800 text-blue-400 hover:bg-zinc-800 hover:scale-105 transform active:scale-95'}`}>
          <RefreshCw size={10} className={`md:w-[14px] md:h-[14px] ${loading || isBackgroundSyncing ? 'animate-spin' : ''}`} /> {loading ? 'SYNC...' : 'REFRESH'}
        </button>

        {/* Network Cycle Switch */}
        <div className="relative shrink-0">
           <button 
              onClick={onCycleNetwork}
              className={`flex items-center gap-1 px-2 h-6 md:px-4 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs border active:scale-95 ${zenMode ? 'bg-black border-zinc-800 text-zinc-400' : 'bg-black/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}
           >
              <div className={`w-1.5 h-1.5 rounded-full ${networkFilter === 'MAINNET' ? 'bg-green-500' : networkFilter === 'DEVNET' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
              <span>{networkFilter === 'ALL' ? 'ALL' : networkFilter === 'MAINNET' ? 'MAIN' : 'DEV'}</span>
              <Repeat size={10} className="md:w-3 md:h-3 opacity-50"/>
           </button>
        </div>

        {/* Sort Toggles */}
        <div className="flex gap-1 md:gap-2 relative ml-auto">
          {['uptime', 'storage', 'version', 'health'].map((opt) => (
            <button key={opt} onClick={() => onSortChange(opt as any)} className={`flex items-center gap-1 px-1.5 h-6 md:px-3 md:py-2 md:h-auto rounded-lg text-[8px] md:text-xs font-bold transition border whitespace-nowrap ${sortBy === opt ? zenMode ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-blue-500/10 border-blue-500/50 text-blue-400' : zenMode ? 'bg-black border border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
              {opt === 'uptime' && <Clock size={10} className="md:w-3 md:h-3" />}{opt === 'storage' && <Database size={10} className="md:w-3 md:h-3" />}{opt === 'version' && <Server size={10} className="md:w-3 md:h-3" />}{opt === 'health' && <HeartPulse size={10} className="md:w-3 md:h-3" />}
              {opt.toUpperCase()}
              {sortBy === opt && (sortOrder === 'asc' ? <ArrowUp size={8} className="ml-0.5 md:ml-1 md:w-[10px] md:h-[10px]" /> : <ArrowDown size={8} className="ml-0.5 md:ml-1 md:w-[10px] md:h-[10px]" />)}
            </button>
          ))}
          {!zenMode && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none md:hidden"></div>}
        </div>
      </div>
    </header>
  );
};
