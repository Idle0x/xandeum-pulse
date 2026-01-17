import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ArrowUpCircle } from 'lucide-react'; // Added Icon

// ... (Imports unchanged) ... 
import { useNetworkData } from '../hooks/useNetworkData';
import { useNodeFilter } from '../hooks/useNodeFilter';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WatchlistSection } from '../components/dashboard/WatchlistSection';
import { NodesContainer } from '../components/dashboard/NodesContainer';
import { NodeGrid } from '../components/dashboard/NodeGrid';
import { NodeList } from '../components/dashboard/NodeList';
import { WelcomeCurtain } from '../components/WelcomeCurtain';
import { CapacityModal } from '../components/dashboard/stats/CapacityModal';
import { VitalsModal } from '../components/dashboard/stats/VitalsModal';
import { ConsensusModal } from '../components/dashboard/stats/ConsensusModal';
import { InspectorModal } from '../components/modals/InspectorModal';
import { LiveWireLoader, PulseGraphLoader } from '../components/common/Loaders';
import { AlertTriangle, X } from 'lucide-react';
import { Node } from '../types';
import { getSafeIp } from '../utils/nodeHelpers';


export default function Home() {
  const router = useRouter();

  // 1. DATA LAYER
  const { 
    nodes, loading, isBackgroundSyncing, error, lastSync, 
    mostCommonVersion, totalStorageCommitted, 
    totalStorageUsed, medianCommitted, avgNetworkHealth, 
    networkConsensus, refetch 
  } = useNetworkData();

  // 2. STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [networkFilter, setNetworkFilter] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  
  // Updated Sort State
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health' | 'credits'>('storage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [cycleStep, setCycleStep] = useState(1); 
  const [cycleReset, setCycleReset] = useState(0); 
  const [zenMode, setZenMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeStatsModal, setActiveStatsModal] = useState<'capacity' | 'vitals' | 'consensus' | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{visible: boolean, msg: string} | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const filteredNodes = useNodeFilter(nodes, searchQuery, networkFilter, sortBy, sortOrder);
  const stats = useDashboardStats(nodes, networkFilter, totalStorageCommitted, totalStorageUsed);
  const networkCount = networkFilter === 'ALL' ? nodes.length : nodes.filter(n => n.network === networkFilter).length;

  useEffect(() => {
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);
    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedView = localStorage.getItem('xandeum_view_mode');
    if (savedView === 'list') setViewMode('list');
  }, []);

  useEffect(() => {
    const cycleInterval = setInterval(() => { setCycleStep((prev) => prev + 1); }, 13000); 
    return () => clearInterval(cycleInterval);
  }, [cycleReset]); 

  const handleSortChange = (metric: 'uptime' | 'version' | 'storage' | 'health' | 'credits') => {
    if (sortBy === metric) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(metric);
        setSortOrder('desc'); 
    }
    // ... Cycle logic (Unchanged) ...
    let targetStep = cycleStep; 
    if (metric === 'storage') targetStep = 1; 
    if (metric === 'health') targetStep = 2;
    if (metric === 'uptime') targetStep = 3;
    if (metric !== 'version') {
      setCycleStep(targetStep);
      setCycleReset(prev => prev + 1); 
    }
  };

  const handleToggleZen = () => { 
     const v = !zenMode; 
     setZenMode(v); 
     localStorage.setItem('xandeum_zen_mode', String(v)); 
  };

  const handleNetworkCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (networkFilter === 'ALL') setNetworkFilter('MAINNET');
    else if (networkFilter === 'MAINNET') setNetworkFilter('DEVNET');
    else setNetworkFilter('ALL');
  };

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(address) ? favorites.filter(f => f !== address) : [...favorites, address];
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const exportCSV = () => { /* ... (Unchanged) ... */ };
  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  return (
    <Layout zenMode={zenMode} onClick={() => isMenuOpen && setIsMenuOpen(false)}>
      <WelcomeCurtain />
      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        zenMode={zenMode}
        onToggleZen={handleToggleZen} // PASSED
        networkFilter={networkFilter}
        onNetworkChange={setNetworkFilter}
        filteredCount={filteredNodes.length}
        onExport={exportCSV}
      />

      <Header 
        onToggleMenu={() => setIsMenuOpen(true)}
        zenMode={zenMode}
        onToggleZen={handleToggleZen}
        lastSync={lastSync}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        loading={loading}
        isBackgroundSyncing={isBackgroundSyncing}
        onRefetch={refetch}
        networkFilter={networkFilter}
        onCycleNetwork={handleNetworkCycle}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        viewMode={viewMode} // PASSED
        setViewMode={(m) => { setViewMode(m); localStorage.setItem('xandeum_view_mode', m); }} // PASSED
      />

      <main className={`p-4 md:p-8 ${zenMode ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1800px] mx-auto'} transition-all duration-500`}>
        <StatsOverview 
          stats={stats}
          totalStorageCommitted={totalStorageCommitted}
          totalNodes={nodes.length}
          displayedCount={networkCount} 
          networkFilter={networkFilter}
          onNetworkChange={setNetworkFilter}
          loading={loading}
          onOpenModal={setActiveStatsModal}
          zenMode={zenMode}
        />

        {error && (
          <div className="mb-8 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse">
            <AlertTriangle size={14} /> <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {!zenMode && favorites.length > 0 && (
          <WatchlistSection 
            nodes={watchListNodes} 
            onNodeClick={setSelectedNode} 
            onToggleFavorite={toggleFavorite} 
          />
        )}

        <NodesContainer
          viewMode={viewMode}
          setViewMode={(m) => { setViewMode(m); localStorage.setItem('xandeum_view_mode', m); }}
          count={filteredNodes.length}
          networkFilter={networkFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          zenMode={zenMode}
        >
          {loading && nodes.length === 0 ? (
             <PulseGraphLoader />
          ) : viewMode === 'grid' ? (
             <NodeGrid 
               key={`grid-${sortBy}-${sortOrder}-${filteredNodes.length}`} 
               loading={loading}
               nodes={filteredNodes}
               zenMode={zenMode}
               cycleStep={cycleStep}
               mostCommonVersion={mostCommonVersion}
               sortBy={sortBy}
               onNodeClick={setSelectedNode}
               onToggleFavorite={toggleFavorite}
               favorites={favorites}
             />
          ) : (
             <NodeList
               key={`list-${sortBy}-${sortOrder}-${filteredNodes.length}`}
               nodes={filteredNodes}
               onNodeClick={setSelectedNode}
               onToggleFavorite={toggleFavorite}
               favorites={favorites}
               sortBy={sortBy}
               sortOrder={sortOrder}
               onSortChange={handleSortChange}
             />
          )}

          {!loading && nodes.length > 0 && (
            <div className="flex items-center justify-center py-6 border-t border-zinc-800/50 bg-black/20 gap-4">
               {/* Active Pods Pill */}
               <div className="group flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-white/10 hover:bg-black/60 cursor-help" title="Live count of filtered nodes currently in view">
                  <div className="relative flex h-1.5 w-1.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 duration-1000"></span>
                     <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-zinc-400 transition-colors">
                     <span>Active Pods Uplink</span>
                     <span className="text-zinc-700">|</span>
                     <span className="text-zinc-300 font-black text-[10px]">{filteredNodes.length}</span>
                  </div>
               </div>

               {/* Back to Top Button */}
               <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                  title="Back to Top"
               >
                  <ArrowUpCircle size={18} />
               </button>
            </div>
          )}
        </NodesContainer>
      </main>

      <Footer zenMode={zenMode} nodeCount={filteredNodes.length} />
      {/* ... Modals (Unchanged) ... */}
    </Layout>
  );
}
