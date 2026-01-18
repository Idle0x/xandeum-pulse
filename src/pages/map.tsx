import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AlertCircle, Info, EyeOff } from 'lucide-react';
import { ViewMode, NetworkType, LocationData } from '../types/map';
import { HEALTH_THRESHOLDS } from '../utils/mapConstants';
import { formatStorage, formatCredits } from '../utils/mapHelpers';
import { useMapData } from '../hooks/useMapData';

// Components
import { MapHeader } from '../components/map/MapHeader';
import { MapVisuals } from '../components/map/MapVisuals';
import { LocationDrawer } from '../components/map/LocationDrawer';
import { CountryBreakdownModal } from '../components/map/CountryBreakdownModal';

export default function MapPage() {
  const router = useRouter();

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('ALL');
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const [dynamicThresholds, setDynamicThresholds] = useState<number[]>([0, 0, 0, 0]);

  // UI Helper State
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' | 'private' } | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Hook for Data
  const { 
    locations, stats, loading, countryBreakdown, 
    globalTotals, isGlobalCreditsOffline, sortedLocations 
  } = useMapData(viewMode, selectedNetwork);

  // DEEP LINK LOGIC REFS
  const hasDeepLinkRun = useRef<string | null>(null);

  // --- HELPER: HANDLE NETWORK CHANGE WITH URL SYNC ---
  const handleNetworkChange = (net: NetworkType) => {
    setSelectedNetwork(net);
    // Update URL without reloading page (Shallow Routing)
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, network: net }
      },
      undefined,
      { shallow: true }
    );
  };

  // --- EFFECT 1: SYNC STATE FROM URL (Initial Load + History) ---
  useEffect(() => {
    if (!router.isReady) return;

    const { focus, network } = router.query;
    
    // Priority 1: Explicit Network Param
    if (network) {
        const netParam = (network as string).toUpperCase() as NetworkType;
        if (['ALL', 'MAINNET', 'DEVNET'].includes(netParam) && netParam !== selectedNetwork) {
            setSelectedNetwork(netParam);
        }
    } 
    // Priority 2: Deep Link Focus (Default to ALL if no network specified)
    // Note: This runs on initial load if network param is missing.
    else if (focus) {
       if (selectedNetwork !== 'ALL') setSelectedNetwork('ALL');
    }
  }, [router.isReady, router.query.network, router.query.focus]);

  // --- EFFECT 2: FIND TARGET AND LOCK ---
  useEffect(() => {
    if (!router.isReady || !router.query.focus || loading) return;

    const targetIP = router.query.focus as string;

    // Prevent re-running logic if we already handled this specific IP
    if (hasDeepLinkRun.current === targetIP) return;

    // Check if the locations data is actually populated (safety check)
    if (locations.length === 0) return;

    // Search for the node in the CURRENTLY LOADED locations
    const targetLoc = locations.find((l) => l.ips && l.ips.includes(targetIP));
    
    // Mark as run so we don't spam logic
    hasDeepLinkRun.current = targetIP;

    if (targetLoc) {
        // SUCCESS: Lock target, open drawer, scroll to it
        lockTarget(targetLoc.name, targetLoc.lat, targetLoc.lon);
    } else {
        // FAILURE to find node in current list.
        
        // Scenario: We might be on MAINNET, but the node is on DEVNET.
        // If we are NOT on ALL, we should force switch to ALL to try and find it.
        if (selectedNetwork !== 'ALL') {
             // *** THE FIX: Update State AND URL to 'ALL' ***
             // This ensures the visual dropdown updates AND persistence is respected
             handleNetworkChange('ALL');
             
             // Reset the ref so the effect runs again after the network switch loads new data
             hasDeepLinkRun.current = null; 
             return;
        }

        // If we are ALREADY on 'ALL' and still can't find it, it's truly masked/offline.
        if (selectedNetwork === 'ALL') {
            setToast({ 
                msg: `Node ${targetIP} uses a Masked IP (VPN/CGNAT). Geolocation unavailable.`, 
                type: 'private' 
            });
            setTimeout(() => setToast(null), 6000);
        }
    }
  }, [router.isReady, router.query.focus, loading, locations, selectedNetwork]);


  const visibleNodes = locations.reduce((sum, loc) => sum + loc.count, 0);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- EFFECT: Threshold Calculation ---
  useEffect(() => {
      if (locations.length === 0) return;
      if (viewMode === 'HEALTH') {
          setDynamicThresholds(HEALTH_THRESHOLDS);
          return;
      }
      const values = locations
        .map(l => viewMode === 'STORAGE' ? l.totalStorage : (l.totalCredits || 0))
        .sort((a, b) => a - b);

      const getQuantile = (q: number) => {
          const pos = (values.length - 1) * q;
          const base = Math.floor(pos);
          const rest = pos - base;
          if ((values[base + 1] !== undefined)) {
              return values[base] + rest * (values[base + 1] - values[base]);
          } else {
              return values[base];
          }
      };
      setDynamicThresholds([getQuantile(0.90), getQuantile(0.75), getQuantile(0.50), getQuantile(0.25)]);
  }, [locations, viewMode]);

  // --- Helper Wrappers ---
  const lockTarget = (name: string, lat: number, lon: number) => {
    if (activeLocation !== name) {
        setActiveLocation(name);
        setExpandedLocation(name); 
        setPosition({ coordinates: [lon, lat], zoom: 3 });
        setIsSplitView(true);
    }
    // Scroll Logic
    setTimeout(() => {
        const item = document.getElementById(`list-item-${name}`);
        if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400); 
  };

  const toggleExpansion = (name: string, lat: number, lon: number) => {
      if (expandedLocation === name) resetView(); else lockTarget(name, lat, lon);
  };

  const resetView = () => {
    setActiveLocation(null);
    setExpandedLocation(null);
    setPosition({ coordinates: [10, 20], zoom: 1.2 });
  };

  const handleCopyCoords = (lat: number, lon: number, name: string) => {
    const text = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(name);
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  const handleShareLink = (e: React.MouseEvent, ip: string, name: string) => {
      e.stopPropagation();
      const url = `${window.location.origin}/map?focus=${ip}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(name);
      setTimeout(() => setCopiedLink(null), 2000);
  };

  const getTierIndex = (loc: LocationData): number => {
    let val = 0;
    if (viewMode === 'STORAGE') val = loc.totalStorage;
    else if (viewMode === 'CREDITS') {
        if (loc.totalCredits === null) return -1;
        val = loc.totalCredits;
    }
    else val = loc.avgHealth;

    if (val >= dynamicThresholds[0]) return 0;
    if (val >= dynamicThresholds[1]) return 1;
    if (val >= dynamicThresholds[2]) return 2;
    if (val >= dynamicThresholds[3]) return 3;
    return 4;
  };

  const getLegendLabels = () => {
      if (viewMode === 'HEALTH') return ['> 90%', '75-90%', '60-75%', '40-60%', '< 40%'];
      const format = (v: number) => viewMode === 'STORAGE' ? formatStorage(v) : formatCredits(v);
      return [`> ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[1])} - ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[2])} - ${format(dynamicThresholds[1])}`, `${format(dynamicThresholds[3])} - ${format(dynamicThresholds[2])}`, `< ${format(dynamicThresholds[3])}`];
  };

  const getLegendContext = () => {
      switch(viewMode) {
          case 'STORAGE': return "Visualizing global committed disk space.";
          case 'HEALTH': return "Monitoring uptime, version consensus, and stability.";
          case 'CREDITS': return "Tracking accumulated node rewards and reputation.";
      }
  }

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col">
      <Head>
        <title>Xandeum Command Center</title>
        <style>{`
          @keyframes scanner {
            0% { transform: translateX(-100%) skewX(-15deg); }
            50%, 100% { transform: translateX(200%) skewX(-15deg); }
          }
          .animate-scanner {
            animation: scanner 3s ease-in-out infinite;
          }
          @supports (padding: max(0px)) { 
            .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); } 
          }
        `}</style>
      </Head>

      {toast && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-95 duration-300 w-[90%] max-w-sm pointer-events-none">
              <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : toast.type === 'private' ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200' : 'bg-zinc-800 border-zinc-700 text-white'}`}>
                  {toast.type === 'error' ? <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" /> : toast.type === 'private' ? <EyeOff size={20} className="text-zinc-400 mt-0.5 shrink-0" /> : <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1"><p className="text-sm font-bold leading-tight">{toast.msg}</p></div>
              </div>
          </div>
      )}

      <CountryBreakdownModal 
        isOpen={isCountryModalOpen} 
        onClose={() => setIsCountryModalOpen(false)}
        countryBreakdown={countryBreakdown}
        viewMode={viewMode}
        setViewMode={setViewMode}
        globalTotals={globalTotals}
      />

      <MapHeader 
        loading={loading}
        viewMode={viewMode}
        stats={stats}
        visibleNodes={visibleNodes}
        privateNodes={privateNodes}
        leadingRegion={sortedLocations[0]}
        countryBreakdown={countryBreakdown}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={handleNetworkChange}
        onRegionClick={() => setIsCountryModalOpen(true)}
        onPrivateHelpClick={() => {
            setToast({ 
                msg: `${privateNodes} nodes are running on Private Networks/VPNs, preventing public geolocation. Their data is tracked, but their map pin is hidden.`, 
                type: 'private' 
            }); 
            setTimeout(() => setToast(null), 6000); 
        }}
      />

      <div className={`relative w-full bg-[#080808] ${isSplitView ? 'h-[40vh] shrink-0' : 'flex-1 basis-0 min-h-0'}`}>
         <MapVisuals 
            loading={loading}
            locations={locations}
            activeLocation={activeLocation}
            viewMode={viewMode}
            position={position}
            setPosition={setPosition}
            lockTarget={lockTarget}
            resetView={resetView}
            getTierIndex={getTierIndex}
         />
      </div>

      <LocationDrawer 
         isSplitView={isSplitView}
         setIsSplitView={setIsSplitView}
         viewMode={viewMode}
         setViewMode={setViewMode}
         sortedLocations={sortedLocations}
         activeLocation={activeLocation}
         expandedLocation={expandedLocation}
         toggleExpansion={toggleExpansion}
         handleCloseDrawer={() => { setIsSplitView(false); resetView(); }}
         handleCopyCoords={handleCopyCoords}
         copiedCoords={copiedCoords}
         handleShareLink={handleShareLink}
         copiedLink={copiedLink}
         setToast={setToast}
         getTierIndex={getTierIndex}
         stats={stats}
         isGlobalCreditsOffline={isGlobalCreditsOffline}
         getLegendLabels={getLegendLabels}
         getLegendContext={getLegendContext}
      />
    </div>
  );
}
