import { X, HeartPulse, Info } from 'lucide-react';
import { Node } from '../../../types';

interface VitalsModalProps {
  onClose: () => void;
  nodes: Node[];
  avgHealth: number;
  consensusPercent: number;
  consensusVersion: string;
}

export const VitalsModal = ({ onClose, nodes, avgHealth, consensusPercent, consensusVersion }: VitalsModalProps) => {
  const stableNodes = nodes.filter(n => (n.uptime || 0) > 86400).length;
  const stabilityPercent = ((stableNodes / nodes.length) * 100).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <HeartPulse size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Vitals</h3>
              <p className="text-xs text-zinc-500">Real-time health metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-green-400">{stabilityPercent}%</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mt-2">Stability</div>
              <div className="text-xs text-zinc-600 mt-1">{stableNodes} stable nodes</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-blue-400">{avgHealth}</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mt-2">Avg Health</div>
              <div className="text-xs text-zinc-600 mt-1">out of 100</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-purple-400">{consensusPercent.toFixed(1)}%</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mt-2">Consensus</div>
              <div className="text-xs text-zinc-600 mt-1">on v{consensusVersion}</div>
            </div>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-3 flex items-center gap-2">
              <Info size={12} /> How It's Calculated
            </div>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div><span className="text-white font-bold">Stability:</span> Percentage of nodes with uptime &gt; 24 hours</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                <div><span className="text-white font-bold">Avg Health:</span> Mean health score across all active nodes</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                <div><span className="text-white font-bold">Consensus:</span> Percentage running the most common version</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
