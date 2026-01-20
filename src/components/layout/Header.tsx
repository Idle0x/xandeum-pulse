import { useState, useEffect } from 'react';
import { 
  Menu, Activity, Search, Monitor, RefreshCw, Repeat, 
  Clock, Database, Server, HeartPulse, ArrowUp, ArrowDown, Info, X, 
  LayoutGrid, List, Coins, HardDrive 
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
  loading: boolean;
  isBackgroundSyncing: boolean;
  onRefetch: () => void;
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET';
  onCycleNetwork: (e: React.MouseEvent) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (metric: 'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filteredCount: number;
}

export const Header = ({
  onToggleMenu, zenMode, onToggleZen, lastSync,
  searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
  loading, isBackgroundSyncing, onRefetch,
  networkFilter, onCycleNetwork,
  sortBy, sortOrder, onSortChange,
  viewMode, setViewMode,
  filteredCount
}: HeaderProps) => {

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchTips = [
    "Search by node IP, public key, version or country",
    "Click on any node for detailed insights & history",
    "Use the map view to visualize network topology",
    "Compare your node metrics against the network leaders",
    "Copy a node URL to share a direct deep-link"
  ];

  const ListHeaderCell = ({ label, metric, alignRight = false }: { label: string, metric: any, alignRight?: boolean }) => (
    <div 
      onClick={() => onSortChange(metric)}
      className={`flex items-center gap-1 cursor-pointer transition-colors group select-none ${alignRight ? 'justify-end' : ''} ${sortBy === metric ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {label}
      <div className={`transition-transform duration-300 ${sortBy === metric && sortOrder === 'asc' ? 'rotate-180' : ''}`}>
        <ArrowDown size={10} className={sortBy === metric ? 'text-blue-500' : 'text-zinc-700'} />
      </div>
    </div>
  );

  // ALIGNMENT NOTE: Matches NodeList.tsx grid
  const gridClass = "grid-cols-[auto_2fr_1.0fr_1.1fr_1.1fr_1.1fr_1.0fr_1.0fr_0.8fr_auto]";

  return (
    <header className={`sticky top-0 z-[50] border-b px-4 py-1 md:py-3 flex flex-col gap-1 md:gap-4 transition-all duration-500 overflow-visible ${zenMode ? 'bg-black border-zinc-800' : 'bg-[#09090b]/90 backdrop-blur-md border-zinc-800'}`}>
      <div className="flex justify-between items-start w-full">

        {/* Left: Menu & Logo */}
        <div className="flex items-start gap-3 md:gap-4 shrink-0 pt-1"> 
          <button onClick={onToggleMenu} className={`p-2 rounded-xl transition mt-1 ${zenMode ? 'text-zinc-400 border border-zinc-800 hover:text-white' : 'text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'}`}>
            <Menu size={20} className="md:w-6 md:h-6" />
          </button>

          <div className="flex flex-col">
            {/* Row 1: Big Logo */}
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white leading-none">
              <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={28} /> PULSE
            </h1>

            {/* Row 2: Sync Time */}
            <div className="mt-2 md:mt-3 pl-1 flex items-center">
               <span className="text-[9px] md:text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                 Sync: <span className={zenMode ? 'text-zinc-400' : 'text-zinc-300'}>{lastSync}</span>
               </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar + Feedback Text */}
        <div className="flex-1 mx-4 relative group flex flex-col items-center min-w-0 pt-0.5 md:pt-1">

          {/* Search Input */}
          <div className="relative w-full max-w-3xl overflow-hidden rounded-lg">
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

           {/* Feedback Text Area: MOBILE=121%, DESKTOP=107% */}
           {!zenMode && (
             <div className="mt-1 md:mt-2 w-[121%] md:w-[107%] translate-x-[3.5%] overflow-hidden relative h-[20px] transition-all duration-300 mask-linear-fade flex items-center justify-center">
               {searchQuery ? (
                 <div className="flex items-center justify-center w-full text-[8px] md:text-xs text-zinc-400 font-mono tracking-wide uppercase animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                    Showing <span className="text-white font-bold mx-1">{filteredCount}</span> results for <span className="text-blue-400 font-bold ml-1">"{searchQuery}"</span>
                 </div>
               ) : isSearchFocused ? (
                 <div className="flex items-center justify-center w-full text-[8px] md:text-xs text-blue-400 font-mono tracking-wide uppercase animate-in fade-in whitespace-nowrap">
                    <Info size={10} className="mr-1.5" /> Type to filter nodes instantly
                 </div>
               ) : (
                 <div className="flex items-center whitespace-nowrap animate-ticker w-full">
                    {[...searchTips, ...searchTips].map((tip, i) => (
                      <div key={i} className="flex items-center mx-8">
                         <div className="w-1 h-1 rounded-full bg-blue-500/50 mr-3"></div>
                         <span className="text-[8px] md:text-xs text-zinc-500 font-mono tracking-wide uppercase">{tip}</span>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
           {!zenMode && <style>{` @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee { animation: marquee 15s linear infinite; } @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-ticker { display: flex; width: max-content; animation: ticker 60s linear infinite; } .mask-linear-fade { mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); } `}</style>}
        </div>

        {/* Right: Zen / Grid Toggle */}
        <div className="shrink-0 relative flex flex-col items-end gap-1 w-10 md:w-auto h-10 md:h-12 justify-start mt-0.5">
            {!isScrolled && (
              <div className="transition-all duration-300 flex items-center justify-end animate-in fade-in zoom-in">
                  <button onClick={onToggleZen} className={`p-2 rounded-lg transition flex items-center gap-2 group ${zenMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white' : 'bg-red-900/10 border border-red-500/20 text-red-500 hover:bg-red-900/30'}`} title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}>
                  <Monitor size={18} />
                  <span className="hidden md:inline text-xs font-bold">{zenMode ? 'EXIT ZEN' : 'ZEN MODE'}</span>
                  </button>
              </div>
            )}
            {isScrolled && !zenMode && (
              <div className="transition-all duration-300 flex items-center justify-end animate-in fade-in zoom-in">
                   <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                      <button onClick={() => setViewMode('grid')} className={`p-1.5 md:p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>
                        <LayoutGrid size={16} className="md:w-5 md:h-5"/> 
                      </button>
                      <button onClick={() => setViewMode('list')} className={`p-1.5 md:p-2 rounded ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>
                        <List size={16} className="md:w-5 md:h-5"/>
                      </button>
                   </div>
              </div>
            )}
        </div>
      </div>

      {/* Bottom Row: Controls */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-2 scrollbar-hide w-full mt-1 md:mt-6 border-t border-zinc-800/50 pt-2 overflow-visible">
        <button onClick={onRefetch} disabled={loading} className={`flex items-center gap-1 md:gap-2 px-3 h-6 md:px-6 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs shrink-0 ${loading ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-wait' : zenMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-zinc-900 border border-zinc-800 text-blue-400 hover:bg-zinc-800 hover:scale-105 transform active:scale-95'}`}>
          <RefreshCw size={10} className={`md:w-[14px] md:h-[14px] ${loading || isBackgroundSyncing ? 'animate-spin' : ''}`} /> {loading ? 'SYNC...' : 'REFRESH'}
        </button>

        <div className="relative shrink-0 ml-1">
            <button onClick={onCycleNetwork} className={`flex items-center gap-1 px-3 h-6 md:h-12 rounded-xl transition font-bold text-[9px] md:text-xs border active:scale-95 ${zenMode ? 'bg-black border-zinc-800 text-zinc-400' : 'bg-black/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${networkFilter === 'MAINNET' ? 'bg-green-500' : networkFilter === 'DEVNET' ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                <span>{networkFilter === 'ALL' ? 'ALL' : networkFilter === 'MAINNET' ? 'MAINNET' : 'DEVNET'}</span>
            </button>
        </div>

        {/* Desktop Controls (Grid/Zen mode specific toggles) */}
        {!zenMode && (!isScrolled || viewMode === 'grid') && (
             <div className="hidden md:flex gap-2 relative ml-auto">
                {['uptime', 'storage', 'storage_used', 'version', 'health', 'credits'].map((opt) => (
                    <button key={opt} onClick={() => onSortChange(opt as any)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition border whitespace-nowrap ${sortBy === opt ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                        {opt === 'storage' ? 'COMM.' : opt === 'storage_used' ? 'USED' : opt.toUpperCase()}
                        {sortBy === opt && (sortOrder === 'asc' ? <ArrowUp size={10} className="ml-1" /> : <ArrowDown size={10} className="ml-1" />)}
                    </button>
                ))}
             </div>
        )}

        {/* Mobile Sort Buttons (Fallback) */}
        <div className="flex gap-1 relative ml-auto md:hidden">
             {['uptime', 'storage', 'storage_used', 'version', 'health', 'credits'].map((opt) => (
                <button key={opt} onClick={() => onSortChange(opt as any)} className={`flex items-center gap-1 px-1.5 h-6 rounded-lg text-[8px] font-bold transition border whitespace-nowrap ${sortBy === opt ? zenMode ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-blue-500/10 border-blue-500/50 text-blue-400' : zenMode ? 'bg-black border border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                {opt === 'uptime' && <Clock size={10} />}
                {opt === 'storage' && <Database size={10} />}
                {opt === 'storage_used' && <HardDrive size={10} />}
                {opt === 'version' && <Server size={10} />}
                {opt === 'health' && <HeartPulse size={10} />}
                {opt === 'credits' && <Coins size={10} />}
                {opt === 'storage' ? 'COMM.' : opt === 'storage_used' ? 'USED' : opt.toUpperCase()}
                {sortBy === opt && (sortOrder === 'asc' ? <ArrowUp size={8} className="ml-0.5" /> : <ArrowDown size={8} className="ml-0.5" />)}
                </button>
            ))}
        </div>
      </div>

      {/* === DESKTOP LIST VIEW HEADER (STICKY) === */}
      {/* This new row matches the 'main' container width and 'NodeList' internal padding */}
      {viewMode === 'list' && !zenMode && isScrolled && (
         <div className="w-full border-t border-zinc-800/50 pt-2 pb-1 hidden md:block">
            <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-8">
               <div className={`${gridClass} gap-4 px-5 items-center text-[9px] font-bold uppercase tracking-wider`}>
                  <div className="w-2"></div>
                  <div className="pl-1"></div>
                  <div></div>
                  <ListHeaderCell label="Version" metric="version" />
                  <ListHeaderCell label="Health" metric="health" />
                  <ListHeaderCell label="Uptime" metric="uptime" alignRight />
                  <ListHeaderCell label="Comm." metric="storage" alignRight />
                  <ListHeaderCell label="Used" metric="storage_used" alignRight />
                  <ListHeaderCell label="Credits" metric="credits" alignRight />
                  <div className="w-6"></div>
               </div>
            </div>
         </div>
      )}

      {/* === MOBILE-ONLY SEARCH DATA STRIP (UPDATED: SLIM & GLASSY) === */}
      {searchQuery && (
        <div className="md:hidden w-full bg-cyan-500/10 border-b border-cyan-500/20 backdrop-blur-sm animate-in slide-in-from-top-2">
            <div className="px-4 py-0.5 text-center leading-none">
                <p className="text-[10px] italic font-medium text-cyan-200/70 break-words">
                Showing 
                <span className="not-italic font-black text-white mx-1 text-[11px]">
                    {filteredCount}
                </span> 
                results for 
                <span className="not-italic font-bold text-cyan-100 ml-1 break-all">
                    "{searchQuery}"
                </span>
                </p>
            </div>
        </div>
      )}
    </header>
  );
};
