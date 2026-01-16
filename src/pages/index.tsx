import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// --- CUSTOM HOOKS ---
import { useNetworkData } from '../hooks/useNetworkData';
import { useNodeFilter } from '../hooks/useNodeFilter';
import { useDashboardStats } from '../hooks/useDashboardStats';

// --- LAYOUT COMPONENTS ---
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';

// --- DASHBOARD WIDGETS ---
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WatchlistSection } from '../components/dashboard/WatchlistSection';
import { NodesContainer } from '../components/dashboard/NodesContainer';
import { NodeGrid } from '../components/dashboard/NodeGrid';
import { NodeList } from '../components/dashboard/NodeList';

// --- MODALS & EXTRAS ---
import { WelcomeCurtain } from '../components/WelcomeCurtain';
import { CapacityModal } from '../components/dashboard/stats/CapacityModal';
import { VitalsModal } from '../components/dashboard/stats/VitalsModal';
import { ConsensusModal } from '../components/dashboard/stats/ConsensusModal';
import { InspectorModal } from '../components/modals/InspectorModal';
import { LiveWireLoader, PulseGraphLoader } from '../components/common/Loaders';
import { Node } from '../types';
import { getSafeIp } from '../utils/nodeHelpers';
import { AlertTriangle, X } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  // --- 1. DATA & STATE MANAGEMENT ---
  const { 
    nodes, loading, isBackgroundSyncing, error, lastSync, 
    networkStats, mostCommonVersion, totalStorageCommitted, 
    totalStorageUsed, medianCommitted, avgNetworkHealth, 
    networkConsensus, refetch 
  } = useNetworkData();

  const {
    searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
    networkFilter, setNetworkFilter, sortBy, sortOrder, handleSortChange,
    filteredNodes
  } = useNodeFilter(nodes);

  const stats = useDashboardStats(nodes, networkFilter, totalStorageCommitted, totalStorageUsed);

  // --- 2. UI STATE ---
  const [zenMode, setZenMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeStatsModal, setActiveStatsModal] = useState<'capacity' | 'vitals' | 'consensus' | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{visible: boolean, msg: string} | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cycle State & Refs
  const [cycleStep, setCycleStep] = useState(0); 
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // --- 3. EFFECTS & PERSISTENCE ---
  useEffect(() => {
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);

    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedView = localStorage.getItem('xandeum_view_mode');
    if (savedView === 'list') setViewMode('list');
  }, []);

  // --- THE FIXED CYCLE LOGIC ---
  useEffect(() => {
    // 1. Clear any existing timer immediately to prevent "Flicker" or double-timing
    if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);

    // 2. Define which sorts trigger a "Snap"
    // (Using index mapping: 0=StorageUsed, 1=Committed, 2=Health, 3=Uptime)
    const SNAP_MAP: Record<string, number> = {
      'storage': 1, // CORRECTED: Now maps to 'Committed' (Index 1)
      'health': 2,
      'uptime': 3
    };

    const targetStep = SNAP_MAP[sortBy];
    const isGenericSort = targetStep === undefined;

    // 3. LOGIC BRANCHING
    if (!isGenericSort) {
      // CASE A: User clicked a cycling metric -> Snap immediately & reset timer
      setCycleStep(targetStep);
    } 
    // CASE B: Generic Sort -> Do nothing (cycle continues undisturbed)

    // 4. START THE TIMER
    cycleTimerRef.current = setInterval(() => {
      setCycleStep(prev => prev + 1);
    }, 13000);

    // Cleanup
    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [sortBy, sortOrder, viewMode]); // Dependency on sortOrder ensures clicking the same header resets the timer

  // Handle URL Deep Linking
  useEffect(() => {
    if (!loading && nodes.length > 0 && router.query.open) {
      const pubkeyToOpen = router.query.open as string;
      const target = nodes.find(n => n.pubkey === pubkeyToOpen);
      if (target) {
        setSelectedNode(target);
        router.replace('/', undefined, { shallow: true });
      }
    }
  }, [loading, nodes, router.query]);

  // --- 4. ACTION HANDLERS ---
  const toggleZenMode = () => {
    const newState = !zenMode;
    setZenMode(newState);
    localStorage.setItem('xandeum_zen_mode', String(newState));
  };

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('xandeum_view_mode', mode);
  };

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(address) 
      ? favorites.filter(f => f !== address) 
      : [...favorites, address];
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
  };

  const handleNetworkCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (networkFilter === 'ALL') setNetworkFilter('MAINNET');
    else if (networkFilter === 'MAINNET') setNetworkFilter('DEVNET');
    else setNetworkFilter('ALL');
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const exportCSV = () => {
    const headers = 'Node_IP,Public_Key,Rank,Credits,Version,Uptime,Capacity,Used,Health,Country,Last_Seen,Is_Fav\n';
    const rows = filteredNodes.map(n => 
      `${getSafeIp(n)},${n.pubkey},${n.rank},${n.credits},${n.version},${n.uptime},${n.storage_committed},${n.storage_used},${n.health},${n.location?.countryName},${n.last_seen_timestamp},${favorites.includes(n.address || '')}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xandeum_pulse_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Derive Watchlist
  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  // --- 5. RENDER ---
  return (
    <Layout zenMode={zenMode} onClick={() => isMenuOpen && setIsMenuOpen(false)}>
      <WelcomeCurtain />

      {loading && <div className="fixed top-0 left-0 right-0 z-50"><LiveWireLoader /></div>}

      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        zenMode={zenMode}
        networkFilter={networkFilter}
        onNetworkChange={setNetworkFilter}
        filteredCount={filteredNodes.length}
        onExport={exportCSV}
      />

      <Header 
        onToggleMenu={() => setIsMenuOpen(true)}
        zenMode={zenMode}
        onToggleZen={toggleZenMode}
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
        viewMode={viewMode}
      />

      <main className={`p-4 md:p-8 ${zenMode ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1800px] mx-auto'} transition-all duration-500`}>
        {/* Statistics Grid */}
        <StatsOverview 
          stats={stats}
          totalStorageCommitted={totalStorageCommitted}
          totalNodes={nodes.length}
          networkFilter={networkFilter}
          onNetworkChange={setNetworkFilter}
          loading={loading}
          onOpenModal={setActiveStatsModal}
          zenMode={zenMode}
        />

        {/* Error State */}
        {error && (
          <div className="mb-8 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse">
            <AlertTriangle size={14} /> <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {/* Watchlist Section */}
        {!zenMode && favorites.length > 0 && (
          <WatchlistSection 
            nodes={watchListNodes} 
            onNodeClick={setSelectedNode} 
            onToggleFavorite={toggleFavorite} 
          />
        )}

        <NodesContainer
          viewMode={viewMode}
          setViewMode={handleViewChange}
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
               // FIX: Key removed to prevent full re-render (Lag Fix)
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
               // FIX: Key removed to prevent full re-render (Lag Fix)
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
            <div className="flex items-center justify-center py-6 border-t border-zinc-800/50 bg-black/20">
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
            </div>
          )}
        </NodesContainer>

      </main>

      <Footer zenMode={zenMode} nodeCount={filteredNodes.length} />

      {activeStatsModal === 'capacity' && <CapacityModal onClose={() => setActiveStatsModal(null)} nodes={nodes} medianCommitted={medianCommitted} totalCommitted={totalStorageCommitted} totalUsed={totalStorageUsed} />}
      {activeStatsModal === 'vitals' && <VitalsModal onClose={() => setActiveStatsModal(null)} nodes={nodes} avgHealth={avgNetworkHealth} consensusPercent={networkConsensus} consensusVersion={mostCommonVersion} />}
      {activeStatsModal === 'consensus' && <ConsensusModal onClose={() => setActiveStatsModal(null)} nodes={nodes} mostCommonVersion={mostCommonVersion} />}

      {selectedNode && (
        <InspectorModal 
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          zenMode={zenMode}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          nodes={nodes}
          networkStats={networkStats}
          medianCommitted={medianCommitted}
          totalStorageCommitted={totalStorageCommitted}
          mostCommonVersion={mostCommonVersion}
          onShowToast={showToast}
        />
      )}

      {toast && toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-md px-4 pointer-events-none">
            <div className={`border px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 pointer-events-auto ${zenMode ? 'bg-black border-zinc-700 text-white' : 'bg-zinc-900 border-yellow-500/30 text-zinc-200'}`}>
               <AlertTriangle size={20} className={zenMode ? 'text-white' : 'text-yellow-500'} />
               <div className="text-xs font-bold leading-relaxed">{toast.msg}</div>
               <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white ml-auto"><X size={16}/></button>
            </div>
        </div>
      )}
    </Layout>
  );
}
