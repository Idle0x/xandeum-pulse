import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  X, Activity, LayoutDashboard, Map as MapIcon, Trophy, Swords, BookOpen, Download 
} from 'lucide-react';
import { NetworkSwitcher } from '../common/NetworkSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  zenMode: boolean;
  networkFilter: 'ALL' | 'MAINNET' | 'DEVNET';
  onNetworkChange: (val: 'ALL' | 'MAINNET' | 'DEVNET') => void;
  filteredCount: number;
  onExport: () => void;
}

export const Sidebar = ({ 
  isOpen, onClose, zenMode, networkFilter, onNetworkChange, filteredCount, onExport 
}: SidebarProps) => {
  const router = useRouter();

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-72 bg-black border-r border-zinc-800 z-[200] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 shrink-0 relative z-10">
            <h2 className="font-bold text-white tracking-widest uppercase flex items-center gap-2">
              <Activity className={zenMode ? 'text-zinc-500' : 'text-blue-500'} size={18} /> Menu
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>

          <div className="mb-8 shrink-0 relative z-10">
            <div className={`border p-4 rounded-2xl relative overflow-hidden group ${zenMode ? 'bg-black border-zinc-700' : 'bg-zinc-900/80 border-white/5'}`}>
              {!zenMode && <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-xl rounded-full group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none z-0"></div>}
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className={`w-1.5 h-1.5 rounded-full ${zenMode ? 'bg-white' : 'bg-blue-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Protocol Context</span>
              </div>
              <div className="relative z-20">
                <NetworkSwitcher current={networkFilter} onChange={onNetworkChange} />
              </div>
              <div className="mt-4 flex items-center justify-between relative z-10">
                <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-tight">Active Stream</span>
                <span className={`text-[9px] font-mono font-bold ${zenMode ? 'text-white' : (networkFilter === 'MAINNET' ? 'text-green-500' : networkFilter === 'DEVNET' ? 'text-blue-500' : 'text-zinc-400')}`}>
                  {networkFilter === 'ALL' ? 'GLOBAL_SYNC' : `${networkFilter}_READY`}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-grow space-y-2 relative z-10 overflow-y-auto scrollbar-hide">
            <Link href="/" onClick={onClose}><div className="flex items-center gap-3 p-3 bg-zinc-900/50 text-white rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors"><LayoutDashboard size={18} /><span className="text-sm font-bold">Dashboard</span></div></Link>
            <Link href="/map" onClick={onClose}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><MapIcon size={18} /><span className="text-sm font-bold">Global Map</span></div></Link>
            <Link href="/leaderboard" onClick={onClose}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><Trophy size={18} /><span className="text-sm font-bold">Leaderboard</span></div></Link>
            <button onClick={() => { router.push('/compare'); onClose(); }} className="w-full text-left flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><Swords size={18} /><span className="text-sm font-bold">Compare Nodes</span></button>
            <Link href="/docs" onClick={onClose}><div className="flex items-center gap-3 p-3 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-800"><BookOpen size={18} /><span className="text-sm font-bold">Documentation</span></div></Link>
          </nav>

          <div className="mt-auto mb-6 pt-4 border-t border-zinc-800/50">
              <button 
                onClick={onExport} 
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-4 text-left transition-all hover:border-zinc-700 active:scale-[0.98] shadow-lg"
              >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-white tracking-tight">Export Network Data</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">CSV Format • {filteredCount} Rows</div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:bg-zinc-800 transition-colors">
                        <Download size={16} className="text-zinc-400 group-hover:text-white"/>
                    </div>
                  </div>
              </button>
          </div>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[190] backdrop-blur-sm" onClick={onClose}></div>}
    </>
  );
};
