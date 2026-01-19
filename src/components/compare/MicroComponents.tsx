import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

// --- THEME ENGINE ---
export const PLAYER_THEMES = [
  { name: 'cyan', hex: '#22d3ee', headerBg: 'bg-cyan-900/40', bodyBg: 'bg-cyan-900/5', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { name: 'violet', hex: '#a78bfa', headerBg: 'bg-violet-900/40', bodyBg: 'bg-violet-900/5', text: 'text-violet-400', border: 'border-violet-500/20' },
  { name: 'emerald', hex: '#34d399', headerBg: 'bg-emerald-900/40', bodyBg: 'bg-emerald-900/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { name: 'amber', hex: '#fbbf24', headerBg: 'bg-amber-900/40', bodyBg: 'bg-amber-900/5', text: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'rose', hex: '#fb7185', headerBg: 'bg-rose-900/40', bodyBg: 'bg-rose-900/5', text: 'text-rose-400', border: 'border-rose-500/20' },
  { name: 'lime', hex: '#a3e635', headerBg: 'bg-lime-900/40', bodyBg: 'bg-lime-900/5', text: 'text-lime-400', border: 'border-lime-500/20' },
  { name: 'fuchsia', hex: '#e879f9', headerBg: 'bg-fuchsia-900/40', bodyBg: 'bg-fuchsia-900/5', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  { name: 'sky', hex: '#38bdf8', headerBg: 'bg-sky-900/40', bodyBg: 'bg-sky-900/5', text: 'text-sky-400', border: 'border-sky-500/20' },
  { name: 'orange', hex: '#fb923c', headerBg: 'bg-orange-900/40', bodyBg: 'bg-orange-900/5', text: 'text-orange-400', border: 'border-orange-500/20' },
  { name: 'indigo', hex: '#818cf8', headerBg: 'bg-indigo-900/40', bodyBg: 'bg-indigo-900/5', text: 'text-indigo-400', border: 'border-indigo-500/20' }
];

export const formatUptimePrecise = (seconds: number) => {
  if (!seconds) return '0m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const MetricDelta = ({ val, base, type = 'number', reverse = false }: { val: number, base: number, type?: 'number' | 'bytes', reverse?: boolean }) => {
  if (base === undefined || base === null || val === base) return null;

  const diff = val - base;
  const isGood = reverse ? diff < 0 : diff > 0;

  const color = isGood ? 'text-green-400' : 'text-red-400';
  const Icon = diff > 0 ? TrendingUp : TrendingDown;

  let display = '';
  if (type === 'bytes') display = formatBytes(Math.abs(diff));
  else display = Math.abs(diff).toLocaleString();

  return (
    // UPDATED: text-[6px] on mobile, text-[8px] on desktop
    <div className={`flex items-center gap-0.5 text-[6px] md:text-[8px] font-bold ${color} bg-black/40 px-1.5 py-0.5 rounded border border-white/5 ml-2 shadow-sm whitespace-nowrap`}>
      <Icon size={8} /> {display}
    </div>
  );
};

export const MicroBar = ({ val, max, color }: { val: number, max: number, color: string }) => (
  <div className="w-10 md:w-16 h-0.5 md:h-1 bg-zinc-800 rounded-full overflow-hidden ml-auto">
    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((val/max)*100, 100)}%`, backgroundColor: color }}></div>
  </div>
);

export const SectionHeader = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="h-5 md:h-8 bg-black/90 backdrop-blur-md border-y border-white/5 flex items-center px-2 md:px-3 gap-1 md:gap-2 sticky left-0 z-10 w-full mt-1">
    <Icon size={8} className="text-zinc-500 md:w-3 md:h-3" />
    <span className="text-[6px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">{label}</span>
  </div>
);
