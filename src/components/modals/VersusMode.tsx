import { useState } from 'react';
import { ArrowLeftRight, Swords, X, Plus, Search, CheckCircle, Globe } from 'lucide-react';
import { ModalAvatar } from '../common/ModalAvatar';
import { Node } from '../../types';
import { getSafeIp } from '../../utils/nodeHelpers';
import { formatBytes } from '../../utils/formatters';

interface VersusModeProps {
  selectedNode: Node;
  nodes: Node[];
  onBack: () => void;
}

export const VersusMode = ({ selectedNode, nodes, onBack }: VersusModeProps) => {
  const [compareTarget, setCompareTarget] = useState<Node | null>(null);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');

  const renderComparisonRow = (label: string, valA: any, valB: any, format: (v: any) => string, better: 'HIGH' | 'LOW' | 'NONE') => {
    const isABetter = better === 'NONE' ? false : better === 'HIGH' ? valA > valB : valA < valB;
    const isBBetter = better === 'NONE' ? false : better === 'HIGH' ? valB > valA : valB < valA;

    return (
      <div className="flex justify-between items-center py-3 border-b border-zinc-800/50 text-xs hover:bg-white/5 px-2 rounded">
        <div className={`flex-1 text-right font-mono flex items-center justify-end gap-2 ${isABetter ? 'text-green-400 font-bold' : 'text-zinc-400'}`}>
          {format(valA)} {isABetter && <CheckCircle size={12} />}
        </div>
        <div className="px-4 text-[10px] text-zinc-600 uppercase font-bold w-32 text-center">{label}</div>
        <div className={`flex-1 text-left font-mono flex items-center justify-start gap-2 ${isBBetter ? 'text-green-400 font-bold' : 'text-zinc-400'}`}>
          {isBBetter && <CheckCircle size={12} />} {format(valB)}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <button onClick={onBack} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition">
          <ArrowLeftRight size={14} /> BACK TO DETAILS
        </button>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Swords className="text-red-500" /> VERSUS MODE
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[400px]">
        {/* LEFT: CURRENT NODE */}
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center">
            <div className="mb-4"><ModalAvatar node={selectedNode} /></div>
            <div className="text-2xl font-black text-white mb-1">{getSafeIp(selectedNode)}</div>
            <div className="text-blue-400 font-mono text-xs">{selectedNode.pubkey?.slice(0, 12)}...</div>

            {compareTarget && (
              <div className="mt-8 w-full space-y-2 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-bold text-zinc-500 border-b border-white/5 pb-1 mb-2">
                  <span>STAT</span><span>VALUE</span>
                </div>
                {renderComparisonRow('Health', selectedNode.health || 0, compareTarget.health || 0, (v) => v.toString(), 'HIGH')}
                {renderComparisonRow('Storage', selectedNode.storage_committed, compareTarget.storage_committed, formatBytes, 'HIGH')}
                {renderComparisonRow('Credits', selectedNode.credits || 0, compareTarget.credits || 0, (v) => v.toLocaleString(), 'HIGH')}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: OPPONENT */}
        <div
          className={`border rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300 ${compareTarget ? 'border-red-500/30 bg-red-900/10 p-6' : 'border-zinc-800 bg-zinc-900/20 border-dashed hover:border-zinc-600 cursor-pointer items-center justify-center group'}`}
          onClick={() => !compareTarget && setShowOpponentSelector(true)}
        >
          {compareTarget ? (
            <>
              <div className="absolute top-0 right-0 p-20 bg-red-500/20 blur-3xl rounded-full pointer-events-none"></div>
              <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center">
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={(e) => { e.stopPropagation(); setCompareTarget(null); }} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition"><X size={16} /></button>
                </div>
                <div className="mb-4"><ModalAvatar node={compareTarget} /></div>
                <div className="text-2xl font-black text-white mb-1">{getSafeIp(compareTarget)}</div>
                <div className="text-red-400 font-mono text-xs">{compareTarget.pubkey?.slice(0, 12)}...</div>
                <div className="mt-8 w-full space-y-2 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs font-bold text-zinc-500 border-b border-white/5 pb-1 mb-2">
                    <span>STAT</span><span>VALUE</span>
                  </div>
                  <div className="opacity-50 text-center text-xs italic py-2">Stats compared on left panel</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center group-hover:scale-105 transition-transform">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 border border-zinc-700 group-hover:border-zinc-500 group-hover:bg-zinc-700 transition">
                <Plus size={40} className="text-zinc-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-400 group-hover:text-white">SELECT OPPONENT</h3>
              <p className="text-zinc-600 text-sm mt-2">Click to open node selector</p>
            </div>
          )}
        </div>
      </div>

      {showOpponentSelector && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-4 bg-zinc-900/50">
            <Search className="text-zinc-500" />
            <input autoFocus type="text" placeholder="Search Opponent by IP, Key, or Country..." className="bg-transparent text-lg text-white w-full outline-none" value={compareSearch} onChange={(e) => setCompareSearch(e.target.value)} />
            <button onClick={() => setShowOpponentSelector(false)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {nodes.filter((n) => n.pubkey !== selectedNode.pubkey && ((n.pubkey || '').toLowerCase().includes(compareSearch.toLowerCase()) || getSafeIp(n).toLowerCase().includes(compareSearch.toLowerCase()) || (n.location?.countryName || '').toLowerCase().includes(compareSearch.toLowerCase()))).map((n) => (
                <button key={n.pubkey} onClick={() => { setCompareTarget(n); setShowOpponentSelector(false); }} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 hover:scale-[1.02] transition text-left group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{n.location?.countryCode ? <img src={`https://flagcdn.com/w40/${n.location.countryCode.toLowerCase()}.png`} className="w-6 rounded-sm" /> : <Globe />}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded">SELECT</div>
                  </div>
                  <div className="font-mono font-bold text-zinc-300 group-hover:text-white">{getSafeIp(n)}</div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">{n.pubkey}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
