import { useState, useEffect } from 'react';
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
    globalTotals, isGlobalCreditsOffline, sortedLocations, targetNodeStatus 
  } = useMapData(viewMode, selectedNetwork, router.query.focus);

  const visibleNodes = locations.reduce((sum, loc) => sum + loc.count, 0);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- EFFECT: Toast for Deep Linking (from Hook Status) ---
  useEffect(() => {
      if (targetNodeStatus && !targetNodeStatus.found) {
          setToast({ 
              msg: `Node ${targetNodeStatus.ip} uses a Masked IP (VPN/CGNAT). Geolocation unavailable.`, 
              type: 'private' 
          });
          setTimeout(() => setToast(null), 6000);
      }
  }, [targetNodeStatus]);

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
    setTimeout(() => {
        const item = document.getElementById(`list-item-${name}`);
        if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
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
        setSelectedNetwork={setSelectedNetwork}
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
