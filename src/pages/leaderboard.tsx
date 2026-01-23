import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Trophy, ArrowLeft } from 'lucide-react';

// --- HOOKS & TYPES ---
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import { useStoincSimulator } from '../hooks/useStoincSimulator';
import { NetworkType } from '../types/leaderboard';

// --- COMPONENTS ---
import StoincSimulator from '../components/leaderboard/StoincSimulator';
import StatsOverview from '../components/leaderboard/StatsOverview';
import FilterControls from '../components/leaderboard/FilterControls';
import NodeTable from '../components/leaderboard/NodeTable';
import { LeaderboardAnalyticsModal } from '../components/leaderboard/LeaderboardAnalyticsModal'; 

export default function Leaderboard() {
  const router = useRouter();

  // 1. Fetch Data
  const { allNodes, loading, creditsOffline } = useLeaderboardData();

  // 2. Initialize Simulator Logic
  const simController = useStoincSimulator(allNodes);

  // 3. Page State (Filtering & UI)
  const [networkFilter, setNetworkFilter] = useState<NetworkType | 'COMBINED'>('MAINNET');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // NEW: Analytics Modal State
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Refs for deep linking to prevent loops
  const lastProcessedHighlight = useRef<string | null>(null);

  // --- EFFECT: Load Favorites ---
  useEffect(() => {
    const saved = localStorage.getItem('xandeum_favorites');
    if (saved) {
        try { setFavorites(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // --- MEMO: Filter & Rank Logic ---
  // We keep this here because it binds the Data Hook to the View state
  const filteredAndRanked = useMemo(() => {
      // 1. Filter by Network
      const networkList = allNodes.filter(n => (networkFilter === 'COMBINED' || n.network === networkFilter));

      // 2. Sort (Credits -> Health -> Pubkey)
      networkList.sort((a, b) => b.credits - a.credits || b.health - a.health || a.pubkey.localeCompare(b.pubkey));

      // 3. Re-assign Ranks relative to current view
      const rankedList = networkList.map((n, i) => ({ ...n, rank: i + 1 }));

      if (!searchQuery) return rankedList;

      // 4. Search Filter
      const searchLower = searchQuery.toLowerCase();
      return rankedList.filter(n => 
          n.pubkey.toLowerCase().includes(searchLower) || 
          (n.address && n.address.toLowerCase().includes(searchLower))
      );
  }, [allNodes, networkFilter, searchQuery]);

  // --- HELPER: Get Current Stats for Modal ---
  const getCurrentStats = () => {
     // We calculate stats based on the currently filtered view (e.g. Mainnet only vs Combined)
     // so the modal matches the cards the user just clicked.
     const nodes = filteredAndRanked; 
     const total = nodes.reduce((sum, n) => sum + n.credits, 0);
     const avg = nodes.length ? Math.round(total / nodes.length) : 0;
     const top10 = nodes.slice(0, 10).reduce((sum, n) => sum + n.credits, 0);
     
     // FIX: Return a number, not a string. The Modal handles the .toFixed formatting.
     const dom = total > 0 ? (top10 / total) * 100 : 0;

     return { 
         totalCredits: total, 
         avgCredits: avg, 
         dominance: dom, 
         nodeCount: nodes.length 
     };
  };

  // --- EFFECT: Deep Link Handler ---
  // Handles URLs like /leaderboard?highlight=PUBKEY
  useEffect(() => {
      if (loading || !router.isReady || !router.query.highlight || allNodes.length === 0) return;

      const targetKey = router.query.highlight as string;
      const targetNetwork = router.query.network as string;
      const targetAddr = router.query.focusAddr as string; 
      const requestSignature = `${targetKey}-${targetNetwork}-${targetAddr}`;

      if (lastProcessedHighlight.current === requestSignature) return;

      const targetNode = allNodes.find(n => n.pubkey === targetKey && (!targetNetwork || n.network === targetNetwork));

      if (targetNode) {
          lastProcessedHighlight.current = requestSignature;

          // Auto-switch network tab if needed
          if (targetNode.network !== networkFilter && networkFilter !== 'COMBINED') {
              setNetworkFilter(targetNode.network as NetworkType);
          }

          // Expand and Scroll
          setTimeout(() => {
              const compositeId = `${targetNode.pubkey}-${targetNode.network}-${targetNode.address || 'no-ip'}`;
              setExpandedNode(compositeId);

              // Ensure it's visible in the list (if far down)
              // Calculate rough index
              const currentList = networkFilter === 'COMBINED' 
                ? [...allNodes].sort((a,b) => b.credits - a.credits)
                : allNodes.filter(n => n.network === targetNode.network).sort((a,b) => b.credits - a.credits);

              const idx = currentList.findIndex(n => n.pubkey === targetNode.pubkey);
              if (idx >= visibleCount) setVisibleCount(idx + 50);

              setTimeout(() => {
                  const el = document.getElementById(`node-${compositeId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
          }, 150);
      }
  }, [loading, router.isReady, router.query, allNodes, networkFilter]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-2 md:p-8 selection:bg-yellow-500/30">
      <Head><title>Xandeum Pulse - Credits & Reputation</title></Head>

      {/* HEADER */}
      <div className="max-w-5xl mx-2 md:mx-auto mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition text-xs md:text-sm font-bold uppercase tracking-wider group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Monitor
        </Link>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-yellow-500 justify-center">
            <Trophy className="w-6 h-6 md:w-8 md:h-8" /> CREDITS & REPUTATION
          </h1>
          <p className="text-[10px] md:text-xs text-zinc-500 mt-1 font-mono tracking-wide uppercase">
            The definitive registry of node reputation and network contribution
          </p>
        </div>
        <div className="w-32 hidden md:block"></div>
      </div>

      {/* WIZARD COMPONENT */}
      <StoincSimulator controller={simController} />

      {/* STATS OVERVIEW COMPONENT (Updated with onClick handler) */}
      {!loading && !creditsOffline && (
        <StatsOverview 
            nodes={filteredAndRanked} 
            networkFilter={networkFilter} 
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        />
      )}

      {/* FILTER CONTROLS COMPONENT */}
      <FilterControls 
        networkFilter={networkFilter} 
        setNetworkFilter={setNetworkFilter} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {/* DATA TABLE COMPONENT */}
      <NodeTable 
        nodes={filteredAndRanked}
        loading={loading}
        offline={creditsOffline}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        expandedNode={expandedNode}
        setExpandedNode={setExpandedNode}
        favorites={favorites}
        onSimulate={simController.loadNodeIntoSim}
        networkFilter={networkFilter}
      />

      {/* FOOTER */}
      {!loading && !creditsOffline && (
        <footer className="max-w-5xl mx-auto mt-8 mb-12 pt-8 border-t border-zinc-900 px-4 text-center animate-in fade-in duration-700">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-[10px] md:text-xs text-zinc-600 italic font-serif leading-relaxed">
              * Participants listed have successfully submitted Storage Proofs and met network stability thresholds.
            </p>
            <div className="pt-6 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-xs font-mono text-zinc-600">
              <span className="uppercase tracking-widest opacity-70">Data fetched directly from the Pod Credits API:</span>
              <div className="flex items-center gap-3">
                <a href="https://podcredits.xandeum.network/api/mainnet-pod-credits" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-400 font-bold transition-colors hover:underline underline-offset-4">Mainnet</a>
                <span className="text-zinc-800">|</span>
                <a href="https://podcredits.xandeum.network/api/pods-credits" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-400 font-bold transition-colors hover:underline underline-offset-4">Devnet</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* NEW: ANALYTICS MODAL */}
      {isAnalyticsOpen && (
          <LeaderboardAnalyticsModal 
              onClose={() => setIsAnalyticsOpen(false)} 
              currentStats={getCurrentStats()} 
          />
      )}
    </div>
  );
}
