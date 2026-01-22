import { useState, useEffect } from 'react';
// ... other imports ...
import { SupabaseDebug } from '../components/SupabaseDebug'; // Import the debugger

export default function Dashboard() {
  // ... your existing state and hooks ...

  return (
    <>
      {/* 1. ADD THE DEBUGGER HERE AT THE VERY TOP */}
      <SupabaseDebug />

      {/* 2. Your existing dashboard layout starts below */}
      <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500/30">
         {/* ... the rest of your dashboard code ... */}
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ArrowUpCircle, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'; 

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

  // Sorting State
  const [sortBy, setSortBy] = useState<'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits'>('storage');
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

  // PAGINATION STATE (Performance Windowing)
  const [visibleCount, setVisibleCount] = useState(30);

  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedDeepLink = useRef<string | null>(null);

  // 5. USE FILTER HOOK
  const filteredNodes = useNodeFilter(nodes, searchQuery, networkFilter, sortBy, sortOrder);
  const stats = useDashboardStats(nodes, networkFilter, totalStorageCommitted, totalStorageUsed);

  // 6. CALCULATE DISPLAY NODES (The Slicing Logic)
  const displayedNodes = filteredNodes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNodes.length;

  // --- HELPER: SYNC NETWORK STATE TO URL ---
  const updateNetwork = (net: 'ALL' | 'MAINNET' | 'DEVNET') => {
    setNetworkFilter(net);
    // Shallow routing ensures we update URL without re-running data fetching methods (if any)
    // or refreshing the page
    router.push({
      pathname: router.pathname,
      query: { ...router.query, network: net }
    }, undefined, { shallow: true });
  };

  // --- EFFECTS ---

  useEffect(() => {
    const savedZen = localStorage.getItem('xandeum_zen_mode');
    if (savedZen === 'true') setZenMode(true);
    const savedFavs = localStorage.getItem('xandeum_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedView = localStorage.getItem('xandeum_view_mode');
    if (savedView === 'list') setViewMode('list');
  }, []);

  // --- NEW: INITIALIZE NETWORK FROM URL ---
  useEffect(() => {
    if (!router.isReady) return;
    
    // Check if 'network' query param exists
    const { network } = router.query;
    if (network) {
        const netParam = (network as string).toUpperCase();
        if (['ALL', 'MAINNET', 'DEVNET'].includes(netParam) && netParam !== networkFilter) {
            setNetworkFilter(netParam as 'ALL' | 'MAINNET' | 'DEVNET');
        }
    }
  }, [router.isReady, router.query.network]);

  // MASTER TIMER LOGIC (For Card Metrics Cycling)
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setCycleStep((prev) => prev + 1);
    }, 13000); 
    return () => clearInterval(cycleInterval);
  }, [cycleReset]); 

  // AUTO-RESET PAGINATION ON FILTER/SORT CHANGE
  // This ensures if I sort by "Uptime", I see the top 30 uptimes immediately
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, networkFilter, sortBy, sortOrder]);


  // --- ADVANCED DEEP LINKING LOGIC ---
  useEffect(() => {
    if (loading || !router.isReady || !router.query.open || nodes.length === 0) return;

    const targetKey = router.query.open as string;
    const targetNetwork = router.query.network as string; // This might be used by the new sync logic too
    const targetAddr = router.query.focusAddr as string;

    const requestSignature = `${targetKey}-${targetNetwork}-${targetAddr}`;

    // Prevent infinite loop if already handled
    if (lastProcessedDeepLink.current === requestSignature) return;

    let match = nodes.find(n => 
        n.pubkey === targetKey && 
        (!targetNetwork || n.network === targetNetwork) &&
        (!targetAddr || n.address === targetAddr)
    );
    // Fallbacks
    if (!match && targetNetwork) {
        match = nodes.find(n => n.pubkey === targetKey && n.network === targetNetwork);
    }
    if (!match) {
        match = nodes.find(n => n.pubkey === targetKey);
    }

    if (match) {
        lastProcessedDeepLink.current = requestSignature;
        // If node is hidden by current filter, force update filter using our new helper
        if (match.network !== networkFilter && networkFilter !== 'ALL') {
             // We don't use updateNetwork here to avoid overwriting the 'open' query param flow immediately, 
             // but we could. For safety in deep linking, simple state set is often safer unless we want to persist 'ALL'
             // Let's use updateNetwork to keep URL clean and synced.
             // However, deep linking logic often has its own complex URL params. 
             // Let's stick to setNetworkFilter('ALL') here to avoid fighting the router if it's already navigating
             setNetworkFilter('ALL'); 
        }
        setSelectedNode(match);
    }
  }, [loading, router.isReady, router.query, nodes, networkFilter]);


  // --- ACTIONS ---

  const handleSortChange = (metric: 'uptime' | 'version' | 'storage' | 'storage_used' | 'health' | 'credits') => {
    if (sortBy === metric) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(metric);
        setSortOrder('desc'); 
    }

    // Sync the "Cycling Metric" on cards with the chosen sort
    let targetStep = cycleStep; 
    if (metric === 'storage') targetStep = 1;
    if (metric === 'storage_used') targetStep = 0;
    if (metric === 'health') targetStep = 2;
    if (metric === 'uptime') targetStep = 3;

    if (metric !== 'version' && metric !== 'credits') {
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
    let next: 'ALL' | 'MAINNET' | 'DEVNET' = 'ALL';
    if (networkFilter === 'ALL') next = 'MAINNET';
    else if (networkFilter === 'MAINNET') next = 'DEVNET';
    else next = 'ALL';
    
    updateNetwork(next);
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
        onToggleZen={handleToggleZen} 
        networkFilter={networkFilter}
        onNetworkChange={updateNetwork} // UPDATED: Use helper
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
        onCycleNetwork={handleNetworkCycle} // Updated to use helper internally
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        setViewMode={(m) => { setViewMode(m); localStorage.setItem('xandeum_view_mode', m); }}

        // Pass Filtered Count for Search Feedback
        filteredCount={filteredNodes.length}
      />

      <main className={`p-4 md:p-8 ${zenMode ? 'max-w-full' : 'max-w-7xl 2xl:max-w-[1800px] mx-auto'} transition-all duration-500`}>
        <StatsOverview 
          stats={stats}
          totalStorageCommitted={totalStorageCommitted}
          totalNodes={nodes.length}    
          displayedCount={filteredNodes.length} 
          networkFilter={networkFilter}
          onNetworkChange={updateNetwork} // UPDATED: Use helper
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
               // Force rebuild on sort to allow smooth re-ordering animation
               key={`grid-${sortBy}-${sortOrder}-${filteredNodes.length}`} 
               loading={loading}
               nodes={displayedNodes} // PASSING SLICED DATA
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
               // Force rebuild on sort
               key={`list-${sortBy}-${sortOrder}-${filteredNodes.length}`}
               nodes={displayedNodes} // PASSING SLICED DATA
               onNodeClick={setSelectedNode}
               onToggleFavorite={toggleFavorite}
               favorites={favorites}
               sortBy={sortBy}
               sortOrder={sortOrder}
               onSortChange={handleSortChange}
             />
          )}

          {/* --- PAGINATION CONTROLS (LOAD MORE) --- */}
          {!loading && nodes.length > 0 && (
            <div className="flex flex-col items-center justify-center py-6 border-t border-zinc-800/50 bg-black/20 gap-3">

               <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  Showing {Math.min(visibleCount, filteredNodes.length)} of {filteredNodes.length} Nodes
               </div>

               <div className="flex items-center gap-3">
                   {hasMore && (
                       <button 
                         onClick={() => setVisibleCount(prev => prev + 30)}
                         className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${zenMode ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'}`}
                       >
                         <ChevronDown size={12} /> Load Next 30
                       </button>
                   )}

                   {visibleCount > 30 && (
                       <button 
                         onClick={() => {
                            setVisibleCount(30);
                            window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional UX enhancement
                         }}
                         className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${zenMode ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:text-zinc-300'}`}
                       >
                         <ChevronUp size={12} /> Collapse
                       </button>
                   )}
               </div>

            </div>
          )}
        </NodesContainer>
      </main>

      {/* FOOTER: Pass Total and Filtered Count for Bottom-Left Indicator */}
      <Footer 
        zenMode={zenMode} 
        totalNodes={nodes.length} 
        filteredCount={filteredNodes.length} 
      />

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
          // Construct simplified stats object for the modal
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
