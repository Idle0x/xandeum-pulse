import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { ViewMode, NetworkType, LocationData, CountryAggregated, MapStats } from '../../types/map';
import { MODE_COLORS } from '../../utils/mapConstants';
import { RegionTrigger } from './RegionTrigger';
import { NetworkSwitcher } from './NetworkSwitcher';

interface MapHeaderProps {
  loading: boolean;
  viewMode: ViewMode;
  stats: MapStats;
  visibleNodes: number;
  privateNodes: number;
  leadingRegion?: LocationData;
  countryBreakdown: CountryAggregated[];
  selectedNetwork: NetworkType;
  setSelectedNetwork: (net: NetworkType) => void;
  onRegionClick: () => void;
  onPrivateHelpClick: () => void;
}

export const MapHeader: React.FC<MapHeaderProps> = ({
  loading, viewMode, stats, visibleNodes, privateNodes, leadingRegion, 
  countryBreakdown, selectedNetwork, setSelectedNetwork, onRegionClick, onPrivateHelpClick
}) => {

  const formatStorage = (gb: number) => gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;

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

  return (
    <div className="shrink-0 w-full z-50 flex flex-col gap-3 px-4 md:px-6 py-3 bg-[#09090b] border-b border-zinc-800/30">
        <div className="flex items-center justify-between w-full">
            <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 transition-all cursor-pointer">
                <ArrowLeft size={12} className="text-zinc-400 group-hover:text-white" />
                <span className="text-zinc-500 group-hover:text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
            </Link>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: MODE_COLORS[viewMode].hex }}></div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{viewMode} Mode</span>
                </div>
                {!loading && (
                    <button 
                        onClick={onPrivateHelpClick}
                        className="flex md:items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-help group text-right"
                    >
                        <div className="hidden md:flex items-center gap-1.5">
                            <HelpCircle size={12} className="text-zinc-500" />
                            <span className="text-xs md:text-sm font-bold tracking-tight">
                                Tracking {visibleNodes} <span className="text-zinc-600">/ {stats.totalNodes} Nodes</span>
                            </span>
                        </div>

                        <div className="md:hidden flex flex-col items-end leading-none mt-0.5">
                            <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">
                                Tracking
                            </span>
                            <span className="text-[9px] font-mono font-bold text-zinc-300">
                                {visibleNodes} <span className="text-zinc-600">/</span> {stats.totalNodes} Nodes
                            </span>
                        </div>
                    </button>
                )}
            </div>
        </div>

        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">{getDynamicTitle()}</h1>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">{getDynamicSubtitle()}</p>
            </div>

            {/* Desktop: Region + Network Switcher Grouped Right */}
            {!loading && (
                <div className="hidden md:flex items-center gap-3">
                    <RegionTrigger countryBreakdown={countryBreakdown} onClick={onRegionClick} />
                    <NetworkSwitcher selectedNetwork={selectedNetwork} setSelectedNetwork={setSelectedNetwork} />
                </div>
            )}
        </div>

        {/* Mobile Bottom Bar: Split Space Between Regions and Network */}
        {!loading && (
            <div className="flex md:hidden w-full items-center justify-between gap-2 px-0 pt-1">
                <div className="flex-1 min-w-0">
                    <RegionTrigger countryBreakdown={countryBreakdown} onClick={onRegionClick} className="w-full justify-start text-[9px] px-2 py-2" />
                </div>
                <div className="shrink-0">
                    <NetworkSwitcher selectedNetwork={selectedNetwork} setSelectedNetwork={setSelectedNetwork} />
                </div>
            </div>
        )}
      </div>
  );
};
