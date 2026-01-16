import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// --- CUSTOM HOOKS ---
import { useNetworkData } from '../hooks/useNetworkData';
import { useNodeFilter } from '../hooks/useNodeFilter';
import { useDashboardStats } from '../hooks/useDashboardStats';

// --- COMPONENTS ---
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WatchlistSection } from '../components/dashboard/WatchlistSection';
import { NodesContainer } from '../components/dashboard/NodesContainer';
import { NodeGrid } from '../components/dashboard/NodeGrid';
import { NodeList } from '../components/dashboard/NodeList';

// --- EXTRAS ---
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

  // 1. DATA LAYER
  const { 
    nodes, loading, isBackgroundSyncing, error, lastSync, 
    mostCommonVersion, totalStorageCommitted, 
    totalStorageUsed, medianCommitted, avgNetworkHealth, 
    networkConsensus, refetch 
  } = useNetworkData();

  // 2. STATE (Centralized)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [networkFilter, setNetworkFilter] = useState<'ALL' | 'MAINNET' | 'DEVNET'>('ALL');
  
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'health'>('storage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 3. CYCLE & TIMER STATE
  const [cycleStep, setCycleStep] = useState(1); 
  const [cycleReset, setCycleReset] = useState(0); 

  // 4. UI STATE
  const [zenMode, setZenMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeStatsModal, setActiveStatsModal] = useState<'capacity' | 'vitals' | 'consensus' | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{visible: boolean, msg: string} | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // 5. USE FILTER HOOK (Using the Pure Calculation version from previous step)
  const filteredNodes = useNodeFilter(nodes, searchQuery, networkFilter, sortBy, sortOrder);
  const stats = useDashboardStats(nodes, networkFilter, totalStorageCommitted, totalStorageUsed);

  // --- EFFECTS ---

  useEffect(() => {
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);
    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedView = localStorage.getItem('xandeum_view_mode');
    if (savedView === 'list') setViewMode('list');
  }, []);

  // MASTER TIMER LOGIC
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setCycleStep((prev) => prev + 1);
    }, 13000); 

    return () => clearInterval(cycleInterval);
  }, [cycleReset]); 

  // --- ACTIONS ---

  const handleSortChange = (metric: 'uptime' | 'version' | 'storage' | 'health') => {
    if (sortBy === metric) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(metric);
        setSortOrder('desc'); 
    }

    let targetStep = cycleStep; 
    if (metric === 'storage') targetStep = 1; 
    if (metric === 'health') targetStep = 2;
    if (metric === 'uptime') targetStep = 3;

    if (metric !== 'version') {
      setCycleStep(targetStep);
      setCycleReset(prev => prev + 1); 
    }
  };

  const handleNetworkCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (networkFilter === 'ALL') setNetworkFilter('MAINNET');
    else if (networkFilter === 'MAINNET') setNetworkFilter('DEVNET');
    else setNetworkFilter('ALL');
  };

  const toggleFavorite = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(address) 
      ? favorites.filter(f => f !== address) 
      : [...favorites, address];
    setFavorites(newFavs);
    localStorage.setItem('xandeum_favorites', JSON.stringify(newFavs));
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

  const watchListNodes = nodes.filter(node => favorites.includes(node.address || ''));

  // --- RENDER ---
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
        onToggleZen={() => { const v = !zenMode; setZenMode(v); localStorage.setItem('xandeum_zen_mode', String(v)); }}
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
               // FORCE REBUILD ON SORT: This is the magic key you requested.
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
               // FORCE REBUILD ON SORT
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
          networkStats={nodes.length > 0 ? { avgBreakdown: {}, totalNodes: nodes.length, systemStatus: { credits: true, rpc: true }, consensusVersion: mostCommonVersion, medianStorage: medianCommitted } : undefined}
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
