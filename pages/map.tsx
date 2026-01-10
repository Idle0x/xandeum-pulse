import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';
import { 
  ArrowLeft, Globe, Plus, Minus, Activity, Database, Zap, ChevronUp, 
  MapPin, RotateCcw, Info, X, HelpCircle, Share2, Check, ArrowRight, 
  AlertOctagon, AlertCircle, EyeOff, BarChart3
} from 'lucide-react';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- INTERFACES ---

interface TopPerformerData {
    pk: string;
    val: number;
    subVal?: number; 
    network?: string;
    address?: string; 
    isUntracked?: boolean; 
}

interface LocationData {
  name: string; 
  country: string; 
  lat: number; 
  lon: number; 
  count: number;
  totalStorage: number; 
  totalCredits: number | null; 
  avgHealth: number;
  avgUptime: number;
  publicRatio: number;
  ips?: string[];
  countryCode?: string;
  topPerformers?: {
      STORAGE: TopPerformerData;
      CREDITS: TopPerformerData;
      HEALTH: TopPerformerData;
  };
}

interface MapStats {
  totalNodes: number; 
  countries: number; 
  topRegion: string; 
  topRegionMetric: number;
}

type ViewMode = 'STORAGE' | 'HEALTH' | 'CREDITS';

const MODE_COLORS = {
    STORAGE: { hex: '#6366f1', tailwind: 'text-indigo-500', bg: 'bg-indigo-600', border: 'border-indigo-500/50' },
    HEALTH:  { hex: '#10b981', tailwind: 'text-emerald-500', bg: 'bg-emerald-600', border: 'border-emerald-500/50' },
    CREDITS: { hex: '#f97316', tailwind: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500/50' }
};

const TIER_COLORS = [
    "#f59e0b", 
    "#ec4899", 
    "#00ced1", 
    "#00bfff", 
    "#d8b4fe"  
];

const TIER_LABELS = {
    STORAGE: ['Massive Hub', 'Major Zone', 'Standard', 'Entry Level', 'Micro Node'],
    CREDITS: ['Legendary', 'Elite', 'Proven', 'Active', 'New Entry'],
    HEALTH:  ['Flawless', 'Robust', 'Fair', 'Shaky', 'Critical']
};

const HEALTH_THRESHOLDS = [90, 75, 60, 40];

export default function MapPage() {
  const router = useRouter();

  // Data State
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalNodes: 0, countries: 0, topRegion: 'Scanning...', topRegionMetric: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('STORAGE');
  const [isSplitView, setIsSplitView] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // UI State
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' | 'private' } | null>(null);
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1.2 });
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Refs for Scroll Preservation
  const listRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const scrollTracker = useRef<number>(0);
  const modalScrollTracker = useRef<number>(0);

  const hasDeepLinked = useRef(false);

  const [dynamicThresholds, setDynamicThresholds] = useState<number[]>([0, 0, 0, 0]);

  const visibleNodes = useMemo(() => locations.reduce((sum, loc) => sum + loc.count, 0), [locations]);
  const privateNodes = Math.max(0, stats.totalNodes - visibleNodes);

  // --- SCROLL PRESERVATION LOGIC ---
  
  // Track scroll position of Split View List
  const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollTracker.current = e.currentTarget.scrollTop;
  };

  // Track scroll position of Country Modal
  const onModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    modalScrollTracker.current = e.currentTarget.scrollTop;
  };

  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = scrollTracker.current;
    if (modalScrollRef.current) modalScrollRef.current.scrollTop = modalScrollTracker.current;
  }, [locations]); // Whenever data updates, restore scroll anchors

  // --- AGGREGATION LOGIC (Country Breakdown) ---
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, {
      code: string;
      name: string;
      count: number;
      storage: number;
      credits: number;
      healthSum: number;
    }>();

    locations.forEach(loc => {
      const code = loc.countryCode || 'XX';
      const current = map.get(code) || { 
        code, 
        name: loc.country, 
        count: 0, 
        storage: 0, 
        credits: 0, 
        healthSum: 0 
      };

      current.count += loc.count;
      current.storage += loc.totalStorage;
      current.credits += (loc.totalCredits || 0);
      current.healthSum += (loc.avgHealth * loc.count); 

      map.set(code, current);
    });

    return Array.from(map.values()).map(c => ({
      ...c,
      avgHealth: c.healthSum / (c.count || 1)
    })).sort((a, b) => {
      if (viewMode === 'STORAGE') return b.storage - a.storage;
      if (viewMode === 'CREDITS') return b.credits - a.credits;
      return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const globalTotals = useMemo(() => {
    return {
      storage: countryBreakdown.reduce((sum, c) => sum + c.storage, 0),
      credits: countryBreakdown.reduce((sum, c) => sum + c.credits, 0),
      nodes: countryBreakdown.reduce((sum, c) => sum + c.count, 0)
    };
  }, [countryBreakdown]);

  const isGlobalCreditsOffline = useMemo(() => {
      if (locations.length === 0) return false; 
      return !locations.some(l => l.totalCredits !== null);
  }, [locations]);

  // Scroll to active marker effect (Only if not currently being manually scrolled)
  useEffect(() => {
      if (activeLocation && isSplitView) {
          const timer = setTimeout(() => {
              const item = document.getElementById(`list-item-${activeLocation}`);
              if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150); 
          return () => clearTimeout(timer);
      }
  }, [viewMode, activeLocation, isSplitView]);

  // --- FETCH LOOP (Optimized for Scroll Stability) ---
  useEffect(() => {
    const fetchGeo = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await axios.get('/api/geo');
        if (res.data) {
          setLocations(res.data.locations || []);
          setStats(res.data.stats || { totalNodes: 0, countries: 0, topRegion: 'Unknown', topRegionMetric: 0 });

          if (router.isReady && router.query.focus && !hasDeepLinked.current) {
              hasDeepLinked.current = true;
              const targetIP = router.query.focus as string;
              if (res.data.locations && res.data.locations.length > 0) {
                  const targetLoc = res.data.locations.find((l: LocationData) => l.ips && l.ips.includes(targetIP));
                  if (targetLoc) {
                      setTimeout(() => { lockTarget(targetLoc.name, targetLoc.lat, targetLoc.lon); }, 500);
                  } else {
                      setToast({ msg: `Node ${targetIP} uses a Masked IP (VPN/CGNAT). Geolocation unavailable.`, type: 'private' });
                      setTimeout(() => setToast(null), 6000);
                  }
              }
          }
        }
      } catch (err) { console.error(err); } finally { 
          setLoading(false); 
          setIsRefreshing(false);
      }
    };

    fetchGeo(true);
    const interval = setInterval(() => fetchGeo(false), 10000);
    return () => clearInterval(interval);
  }, [router.isReady, router.query.focus]); 

  // Threshold Calculation
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

  // --- HELPERS ---

  const getDeepLink = (data: TopPerformerData, destination: 'DASHBOARD' | 'LEADERBOARD') => {
    const params = new URLSearchParams();
    if (destination === 'DASHBOARD') params.set('open', data.pk);
    else params.set('highlight', data.pk); 
    if (data.network) params.set('network', data.network);
    if (data.address) params.set('focusAddr', data.address);
    return destination === 'DASHBOARD' ? `/?${params.toString()}` : `/leaderboard?${params.toString()}`;
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

  const formatStorage = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
    return `${Math.round(gb)} GB`;
  };

  const formatCredits = (cr: number | null) => {
      if (cr === null) return "N/A";
      if (cr >= 1000000) return `${(cr/1000000).toFixed(1)}M`;
      if (cr >= 1000) return `${(cr/1000).toFixed(0)}k`;
      return cr.toString();
  };

  const formatUptime = (seconds: number) => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      if(d > 0) return `${d}d ${h}h`;
      return `${h}h`;
  };

  const getPerformerStats = (pkData: TopPerformerData) => {
      if (viewMode === 'STORAGE') return <span className="text-indigo-400 font-bold">{formatStorage(pkData.val)} Committed</span>;
      if (viewMode === 'CREDITS') {
          if (pkData.isUntracked) return <span className="text-orange-400/80 font-bold italic">No Storage Credits</span>;
          return <span className="text-yellow-500 font-bold">{pkData.val.toLocaleString()} Cr Earned</span>;
      }
      if (viewMode === 'HEALTH') {
          const score = pkData.val;
          const uptime = pkData.subVal || 0;
          const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
          return (
            <span className={`font-bold flex items-center gap-2 ${color}`}>
                 {score}% <span className="text-zinc-600">|</span> <span className="text-blue-300">{formatUptime(uptime)} Up</span>
            </span>
          );
      }
  };

  const getLegendLabels = () => {
      if (viewMode === 'HEALTH') return ['> 90%', '75-90%', '60-75%', '40-60%', '< 40%'];
      const format = (v: number) => viewMode === 'STORAGE' ? formatStorage(v) : formatCredits(v);
      return [`> ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[1])} - ${format(dynamicThresholds[0])}`, `${format(dynamicThresholds[2])} - ${format(dynamicThresholds[1])}`, `${format(dynamicThresholds[3])} - ${format(dynamicThresholds[2])}`, `< ${format(dynamicThresholds[3])}`];
  };

  const lockTarget = (name: string, lat: number, lon: number) => {
    if (activeLocation !== name) {
        setActiveLocation(name);
        setExpandedLocation(name); 
        setPosition({ coordinates: [lon, lat], zoom: 3 });
        setIsSplitView(true);
    }
    if (listRef.current) {
         setTimeout(() => {
             const item = document.getElementById(`list-item-${name}`);
             if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }, 300);
    }
  };

  const toggleExpansion = (name: string, lat: number, lon: number) => {
      if (expandedLocation === name) resetView(); else lockTarget(name, lat, lon);
  };

  const resetView = () => {
    setActiveLocation(null);
    setExpandedLocation(null);
    setPosition({ coordinates: [10, 20], zoom: 1.2 });
  };

  const handleCloseDrawer = () => { setIsSplitView(false); resetView(); };
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

  const handleZoomIn = () => { if (position.zoom < 5) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 })); };
  const handleMoveEnd = (pos: any) => setPosition(pos);

  const sizeScale = useMemo(() => {
    const maxVal = Math.max(...locations.map(d => d.count), 0);
    return scaleSqrt().domain([0, maxVal]).range([5, 12]);
  }, [locations]);

  const getMetricText = (loc: LocationData) => {
    switch (viewMode) {
        case 'STORAGE': return formatStorage(loc.totalStorage);
        case 'HEALTH': return `${loc.avgHealth}% Health`;
        case 'CREDITS': 
            if (loc.totalCredits === null) return isGlobalCreditsOffline ? "API OFFLINE" : "UNTRACKED";
            return `${loc.totalCredits.toLocaleString()} Cr`;
    }
  };

  const getXRayStats = (loc: LocationData, index: number, tierColor: string) => {
      const globalShare = ((loc.count / stats.totalNodes) * 100).toFixed(1);
      const rawPercentile = ((locations.length - index) / locations.length) * 100;
      const topPercent = 100 - rawPercentile;
      let rankText = `Top < 0.01%`;
      if (topPercent >= 0.01) rankText = `Top ${topPercent.toFixed(2)}% Tier`;

      if (viewMode === 'STORAGE') {
          const avgPerNode = loc.totalStorage / loc.count;
          return {
              labelA: 'Avg Density',
              valA: <span className="text-indigo-400">{formatStorage(avgPerNode)} per Node</span>,
              descA: "Average committed storage per node in this region.",
              labelB: 'Global Share',
              valB: `${globalShare}% of Network`,
              descB: "Percentage of total network nodes located here.",
              labelC: 'Tier Rank',
              valC: <span style={{ color: tierColor }}>{rankText}</span>,
              descC: "Performance tier relative to other regions."
          };
      }
      if (viewMode === 'CREDITS') {
          if (loc.totalCredits === null) {
              const statusText = isGlobalCreditsOffline ? "API OFFLINE" : "UNTRACKED";
              const statusColor = isGlobalCreditsOffline ? "text-red-400" : "text-zinc-500";
              const statusIcon = isGlobalCreditsOffline ? <AlertOctagon size={12}/> : <EyeOff size={12}/>;
              return {
                  labelA: 'Avg Earnings',
                  valA: <span className={`${statusColor} flex items-center justify-center gap-1 font-bold`}>{statusIcon} No Rewards Active</span>,
                  descA: "Node has not completed a Storage Proof cycle required for rewards.",
                  labelB: 'Contribution',
                  valB: <span className="text-zinc-400 font-bold">Gossip Active</span>,
                  descB: "Node contributes to network topology but may be in a proving phase.",
                  labelC: 'Tier Rank',
                  valC: <span className="text-zinc-500 italic">Unknown</span>,
                  descC: "Cannot calculate rank without confirmed credits."
              };
          }
          const avgCred = Math.round(loc.totalCredits / loc.count);
          return {
              labelA: 'Avg Earnings',
              valA: <span className="text-yellow-500">{avgCred.toLocaleString()} Cr per Node</span>,
              descA: "Average reputation credits earned per node here.",
              labelB: 'Contribution',
              valB: `${globalShare}% of Economy`,
              descB: "Share of total network reputation credits.",
              labelC: 'Tier Rank',
              valC: <span style={{ color: tierColor }}>{rankText}</span>,
              descC: "Earning power tier relative to other regions."
          };
      }
      return {
          labelA: 'Reliability',
          valA: <span className="text-green-400">{formatUptime(loc.avgUptime)} Avg Uptime</span>,
          descA: "Average continuous uptime of nodes in this region.",
          labelB: 'Node Count',
          valB: `${globalShare}% of Network`,
          descB: "Share of active physical nodes.",
          labelC: 'Tier Rank',
          valC: <span style={{ color: tierColor }}>{rankText}</span>,
          descC: "Stability tier relative to other regions."
      };
  };

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        if (viewMode === 'STORAGE') return b.totalStorage - a.totalStorage;
        if (viewMode === 'CREDITS') return (b.totalCredits || 0) - (a.totalCredits || 0);
        return b.avgHealth - a.avgHealth;
    });
  }, [locations, viewMode]);

  const leadingRegion = sortedLocations[0];

  const getDynamicTitle = () => {
    if (loading) return "Calibrating Global Sensors...";
    if (!leadingRegion) return "Waiting for Node Telemetry...";
    const { country } = leadingRegion;
    const colorClass = MODE_COLORS[viewMode].tailwind; 
    switch (viewMode) {
        case 'STORAGE': return <><span className={colorClass}>{country}</span> Leads Storage Capacity</>;
        case 'CREDITS': return <><span className={colorClass}>{country}</span> Tops Network Earnings</>;
        case 'HEALTH': return <><span className={colorClass}>{country}</span> Sets Vitality Standard</>;
    }
  };

  const getDynamicSubtitle = () => {
     if (!leadingRegion) return "Analyzing network topology...";
     const { name, totalStorage, totalCredits, avgHealth, count } = leadingRegion;
     switch (viewMode) {
        case 'STORAGE': return `The largest hub, ${name}, is currently providing ${formatStorage(totalStorage)}.`;
        case 'CREDITS': 
            if (totalCredits === null) return "Network credits data is currently unavailable from the endpoint.";
            return `Operators in ${name} have generated a total of ${totalCredits.toLocaleString()} Cr.`;
        case 'HEALTH': return `${name} is performing optimally with an average health score of ${avgHealth}% across ${count} nodes.`;
     }
  };

  const getLegendContext = () => {
      switch(viewMode) {
          case 'STORAGE': return "Visualizing global committed disk space.";
          case 'HEALTH': return "Monitoring uptime, version consensus, and stability.";
          case 'CREDITS': return "Tracking accumulated node rewards and reputation.";
      }
  }

  const locationsForMap = useMemo(() => {
    if (!activeLocation) return locations;
    const others = locations.filter(l => l.name !== activeLocation);
    const active = locations.find(l => l.name === activeLocation);
    return active ? [...others, active] : others;
  }, [locations, activeLocation]);

  // --- SUB-COMPONENTS ---

  const ViewToggles = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700/50 rounded-xl ${className}`}>
        {(['STORAGE', 'HEALTH', 'CREDITS'] as ViewMode[]).map((mode) => {
            let Icon = Database;
            if (mode === 'HEALTH') Icon = Activity;
            if (mode === 'CREDITS') Icon = Zap;
            const active = viewMode === mode;
            const activeColorBg = MODE_COLORS[mode].bg;
            return (
                <button key={mode} onClick={(e) => { e.stopPropagation(); setViewMode(mode); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${active ? `${activeColorBg} text-white shadow-md` : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                    <Icon size={14} className={active ? "text-white" : "text-zinc-500"} />
                    <span className="text-[10px] md:text-xs font-bold tracking-wide">{mode}</span>
                </button>
            )
        })}
    </div>
  );

  const RegionTrigger = ({ className = "" }: { className?: string }) => {
    const topFlags = countryBreakdown.slice(0, 3).map(c => c.code.toLowerCase());
    const count = Math.max(0, countryBreakdown.length - 3);

    return (
      <button 
        onClick={() => setIsCountryModalOpen(true)}
        className={`relative overflow-hidden bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500/50 rounded-xl px-3 py-2 transition-all cursor-pointer group items-center gap-3 backdrop-blur-md shadow-lg ${className}`}
      >
        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scanner pointer-events-none" />
        <div className="flex -space-x-2 relative z-10">
          {topFlags.map(code => (
            <div key={code} className="w-5 h-5 rounded-full border border-zinc-900 overflow-hidden relative z-0 group-hover:z-10 transition-all shadow-sm">
              <img src={`https://flagcdn.com/w40/${code}.png`} className="w-full h-full object-cover" alt="flag" />
            </div>
          ))}
        </div>
        <div className="text-xs font-bold text-zinc-300 group-hover:text-white flex items-center gap-1 relative z-10">
          <span>+{count} Regions Active</span>
          <BarChart3 size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </button>
    );
  };

  const CountryBreakdownModal = () => {
    if (!isCountryModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsCountryModalOpen(false)}>
        <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

          <div className="p-5 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> Global Breakdown
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Ranking {countryBreakdown.length} active regions.</p>
              </div>
              <button onClick={() => setIsCountryModalOpen(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="w-full">
               <ViewToggles className="w-full justify-between bg-black/40 border-zinc-800" />
            </div>
          </div>

          {/* LIST WITH SCROLL TRACKING */}
          <div 
            ref={modalScrollRef}
            onScroll={onModalScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
          >
            {countryBreakdown.map((c, i) => {
              let primaryShare = 0; let metricLabel = ''; let metricValue = '';
              if (viewMode === 'STORAGE') {
                primaryShare = (c.storage / (globalTotals.storage || 1)) * 100;
                metricLabel = 'Capacity'; metricValue = formatStorage(c.storage);
              } else if (viewMode === 'CREDITS') {
                primaryShare = (c.credits / (globalTotals.credits || 1)) * 100;
                metricLabel = 'Earnings'; metricValue = formatCredits(c.credits);
              } else {
                primaryShare = c.avgHealth; metricLabel = 'Health'; metricValue = c.avgHealth.toFixed(2) + '%';
              }
              const nodeShare = (c.count / (globalTotals.nodes || 1)) * 100;
              return (
                <div key={`${c.code}-${c.name}`} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-4">#{i + 1}</span>
                      <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.code} className="w-5 rounded-[2px]" />
                      <span className="text-sm font-bold text-zinc-200">{c.name}</span>
                    </div>
                    <div className={`text-sm font-mono font-bold ${MODE_COLORS[viewMode].tailwind}`}>{metricValue}</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className={`h-full ${MODE_COLORS[viewMode].bg} shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.max(2, primaryShare)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wide text-zinc-500">
                      <span><span className={MODE_COLORS[viewMode].tailwind}>{primaryShare.toFixed(2)}%</span> of {metricLabel}</span>
                      <span>Hosts <span className="text-zinc-300">{nodeShare.toFixed(2)}%</span> of Total Nodes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col">
      <Head>
        <title>Xandeum Command Center</title>
        <style>{`
          @keyframes scanner { 0% { transform: translateX(-100%) skewX(-15deg); } 50%, 100% { transform: translateX(200%) skewX(-15deg); } }
          .animate-scanner { animation: scanner 3s ease-in-out infinite; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
          @supports (padding: max(0px)) { .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); } }
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

      <CountryBreakdownModal />

      {/* HEADER */}
      <div className="shrink-0 w-full z-50 flex flex-col gap-3 px-4 md:px-6 py-3 bg-[#09090b] border-b border-zinc-800/30">
        <div className="flex items-center justify-between w-full">
            <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all cursor-pointer">
                <ArrowLeft size={12} className="text-zinc-400 group-hover:text-white" />
                <span className="text-zinc-500 group-hover:text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
            </Link>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    {isRefreshing && <div className="flex items-center gap-1.5 animate-pulse"><RotateCcw size={10} className="animate-spin text-blue-500" /><span className="text-[8px] text-blue-400 font-bold uppercase">Syncing...</span></div>}
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: MODE_COLORS[viewMode].hex }}></div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{viewMode} Mode</span>
                </div>
                {!loading && (
                    <button onClick={() => { setToast({ msg: `${privateNodes} nodes are running on Private Networks/VPNs. Map pin is hidden.`, type: 'private' }); setTimeout(() => setToast(null), 6000); }} className="flex md:items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-help group text-right">
                        <div className="hidden md:flex items-center gap-1.5"><HelpCircle size={12} className="text-zinc-500" /><span className="text-xs md:text-sm font-bold tracking-tight">Tracking {visibleNodes} <span className="text-zinc-600">/ {stats.totalNodes} Nodes</span></span></div>
                        <div className="md:hidden flex flex-col items-end leading-none mt-0.5"><span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Tracking</span><span className="text-[9px] font-mono font-bold text-zinc-300">{visibleNodes} <span className="text-zinc-600">/</span> {stats.totalNodes} Nodes</span></div>
                    </button>
                )}
            </div>
        </div>
        <div className="flex justify-between items-end">
            <div><h1 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">{getDynamicTitle()}</h1><p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">{getDynamicSubtitle()}</p></div>
            {!loading && <RegionTrigger className="hidden md:flex" />}
        </div>
        {!loading && <RegionTrigger className="flex md:hidden w-full justify-center bg-zinc-900/50" />}
      </div>

      {/* MAP VIEWPORT */}
      <div className={`relative w-full bg-[#080808] ${isSplitView ? 'h-[40vh] shrink-0' : 'flex-1 basis-0 min-h-0'}`}>
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center z-20"><Globe className="animate-pulse text-blue-500" /></div>
            ) : (
                <ComposableMap projectionConfig={{ scale: 170 }} className="w-full h-full">
                <ZoomableGroup zoom={position.zoom} center={position.coordinates as [number, number]} onMoveEnd={handleMoveEnd} maxZoom={5}>
                    <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any }) => geographies.map((geo: any) => (<Geography key={geo.rsmKey} geography={geo} fill="#1f1f1f" stroke="#333" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#333", outline: "none" }}} />))}
                    </Geographies>
                    {locationsForMap.map((loc) => {
                    const tier = getTierIndex(loc); const size = sizeScale(loc.count); const isActive = activeLocation === loc.name;
                    const tierColor = viewMode === 'CREDITS' && loc.totalCredits === null ? '#52525b' : TIER_COLORS[tier];
                    const pingColor = isActive ? '#22c55e' : tierColor;
                    return (
                        <Marker key={loc.name} coordinates={[loc.lon, loc.lat]} onClick={() => lockTarget(loc.name, loc.lat, loc.lon)}>
                        <g className="group cursor-pointer transition-all duration-500" style={{ opacity: activeLocation && !isActive ? 0.3 : 1 }}>
                            <circle r={size * 2.5} fill={pingColor} className="animate-ping opacity-20" />
                            {isActive ? (<polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,5 -7,9 -5,1 -11,-4 -3,-4" transform={`scale(${size/6})`} fill="#52525b" stroke="#22c55e" strokeWidth={1.5} />) : (<>{viewMode === 'STORAGE' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" />}{viewMode === 'CREDITS' && <circle r={size} fill={tierColor} stroke="#fff" />}{viewMode === 'HEALTH' && <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={tierColor} stroke="#fff" className="rotate-45" />}</>)}
                        </g>
                        </Marker>
                    );
                    })}
                </ZoomableGroup>
                </ComposableMap>
            )}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <button onClick={handleZoomIn} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Plus size={16} /></button>
                <button onClick={handleZoomOut} className="p-2 md:p-3 bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white"><Minus size={16} /></button>
                {(position.zoom > 1.2 || activeLocation) && <button onClick={resetView} className="p-2 md:p-3 bg-red-900/80 border border-red-500/50 text-red-200 rounded-xl"><RotateCcw size={16} /></button>}
            </div>
      </div>

      {/* FOOTER LIST */}
      <div className={`shrink-0 bg-[#09090b] relative z-50 flex flex-col ${isSplitView ? 'h-[50vh]' : 'h-auto'}`}>
            {!isSplitView && (
                <div className="shrink-0 p-3 md:px-6 md:py-4 bg-[#09090b] border-t border-zinc-800/30 z-50">
                    <button onClick={() => setIsSplitView(true)} className="w-full max-w-2xl mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 border border-blue-500/30 rounded-xl hover:bg-zinc-800 transition-all group shadow-[0_0_20px_rgba(59,130,246,0.15)]"><Activity size={16} className="text-blue-400" /><span className="text-xs md:text-sm font-bold uppercase tracking-widest text-blue-100">Open Live Stats</span><ChevronUp size={16} className="text-blue-500/50" /></button>
                </div>
            )}

            {isSplitView && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-800/30 bg-[#09090b]">
                        <div className="flex items-center gap-3"><h2 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={14} className="text-green-500" /> Live Data</h2><ViewToggles className="hidden md:flex scale-90 origin-left" /></div>
                        <button onClick={handleCloseDrawer} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 transition-all shadow-lg"><X size={20} /></button>
                    </div>

                    <div 
                        ref={listRef} 
                        onScroll={onListScroll}
                        className="flex-grow overflow-y-auto p-4 space-y-2 pb-safe custom-scrollbar bg-[#09090b]"
                    >
                        {sortedLocations.map((loc, i) => {
                            const tier = getTierIndex(loc); const isExp = expandedLocation === loc.name; 
                            const tColor = viewMode === 'CREDITS' && loc.totalCredits === null ? '#71717a' : TIER_COLORS[tier];
                            const xray = getXRayStats(loc, i, tColor); const topData = loc.topPerformers?.[viewMode];
                            return (
                                <div id={`list-item-${loc.name}`} key={`${loc.countryCode}-${loc.name}`} onClick={() => toggleExpansion(loc.name, loc.lat, loc.lon)} className={`group rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeLocation === loc.name ? 'bg-zinc-800 border-green-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800'}`}>
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold ${activeLocation === loc.name ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-200 flex items-center gap-2">{loc.countryCode && <img src={`https://flagcdn.com/w20/${loc.countryCode.toLowerCase()}.png`} className="w-4" />}{loc.name}, {loc.country}</span>
                                                <span onClick={(e)=>{e.stopPropagation(); handleCopyCoords(loc.lat, loc.lon, loc.name);}} className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-blue-400"><MapPin size={10} /> {copiedCoords === loc.name ? 'Copied!' : `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}</span>
                                            </div>
                                        </div>
                                        <div className="text-right"><div className="text-sm font-mono font-bold" style={{ color: tColor }}>{getMetricText(loc)}</div><div className="text-[10px] text-zinc-500">{loc.count} Nodes</div></div>
                                    </div>
                                    {isExp && (
                                        <div className="bg-black/30 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                                <div className="flex flex-col items-center"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelA}</div><div className="font-mono font-bold">{xray.valA}</div></div>
                                                <div className="flex flex-col items-center border-l border-zinc-800/50"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelB}</div><div className="font-mono font-bold">{xray.valB}</div></div>
                                                <div className="flex flex-col items-center border-l border-zinc-800/50"><div className="text-zinc-500 text-[9px] uppercase mb-1">{xray.labelC}</div><div className="font-mono font-bold">{xray.valC}</div></div>
                                            </div>
                                            {topData && (
                                                <Link href={viewMode === 'CREDITS' ? getDeepLink(topData, 'LEADERBOARD') : getDeepLink(topData, 'DASHBOARD')}>
                                                    <div className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between transition-all">
                                                        <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${MODE_COLORS[viewMode].bg} text-white`}><Activity size={14} /></div><div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-400 uppercase">Top Performer</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-white truncate w-32">{topData.pk.slice(0, 16)}...</span>{getPerformerStats(topData)}</div></div></div>
                                                        <ArrowRight size={14} className="text-blue-400" />
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
      </div>
    </div>
  );
}
