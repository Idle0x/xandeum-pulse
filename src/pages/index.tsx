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
import { NodeGrid } from '../components/dashboard/NodeGrid';
import { NodeCard } from '../components/dashboard/cards/NodeCard'; // Re-imported for Watchlist

// --- MODALS & EXTRAS ---
import { WelcomeCurtain } from '../components/WelcomeCurtain';
import { CapacityModal } from '../components/dashboard/stats/CapacityModal';
import { VitalsModal } from '../components/dashboard/stats/VitalsModal';
import { ConsensusModal } from '../components/dashboard/stats/ConsensusModal';
import { InspectorModal } from '../components/modals/InspectorModal';
import { LiveWireLoader } from '../components/common/Loaders';
import { Node } from '../types';
import { getSafeIp } from '../utils/nodeHelpers';
import { AlertTriangle, Star, Activity, X } from 'lucide-react';

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
  const [cycleStep, setCycleStep] = useState(1);
  const [toast, setToast] = useState<{visible: boolean, msg: string} | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // --- 3. EFFECTS & PERSISTENCE ---
  useEffect(() => {
    // Restore Preferences
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);
    
    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Global Card Cycle Timer (13s)
    const cycleInterval = setInterval(() => setCycleStep(prev => prev + 1), 13000);
    return () => clearInterval(cycleInterval);
  }, []);

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

        {/* RESTORED: Watchlist Section */}
        {!zenMode && favorites.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <Star className="text-yellow-500" fill="currentColor" size={20} />
                <h3 className="text-lg font-bold text-white tracking-widest uppercase">Your Watchlist</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-b border-zinc-800 pb-10">
              {watchListNodes.map((node) => (
                <NodeCard 
                    key={`fav-${node.pubkey}`} 
                    node={node} 
                    onClick={setSelectedNode} 
                    onToggleFavorite={toggleFavorite} 
                    isFav={true} 
                    cycleStep={cycleStep} 
                    zenMode={zenMode} 
                    mostCommonVersion={mostCommonVersion} 
                    sortBy={sortBy} 
                />
              ))}
            </div>
          </div>
        )}

        {/* RESTORED: Nodes Header (Stacked for mobile visibility) */}
        {!loading && nodes.length > 0 && (
             <div className="flex items-start gap-3 mb-4 mt-1 md:mt-8">
                <div className="mt-1">
                   <Activity className={zenMode ? 'text-zinc-500' : (networkFilter === 'MAINNET' ? "text-green-500" : networkFilter === 'DEVNET' ? "text-blue-500" : "text-white")} size={20} />
                </div>
                <div className="flex flex-col">
                   <h3 className="text-xs md:text-lg font-bold text-white tracking-widest uppercase leading-tight">
                     {networkFilter === 'ALL' ? 'Nodes across all networks' : networkFilter === 'MAINNET' ? <span className={zenMode ? 'text-white' : "text-green-500"}>Nodes on Mainnet</span> : <span className={zenMode ? 'text-white' : "text-blue-500"}>Nodes on Devnet</span>} 
                     <span className="text-zinc-600 ml-2 text-xs md:text-sm">({filteredNodes.length})</span>
                   </h3>
                   <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 md:mt-1">
                     Distributed by <span className="text-zinc-300">{sortBy}</span> ({sortOrder === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'})
                   </div>
                </div>
            </div>
        )}

        {/* Node Grid */}
        <NodeGrid 
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
      </main>

      <Footer zenMode={zenMode} nodeCount={filteredNodes.length} />

      {/* --- MODALS --- */}
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

      {/* Toast Notification */}
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
