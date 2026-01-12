import { X, Database, Trophy } from 'lucide-react';
import { Node } from '../../../types';
import { formatBytes } from '../../../utils/formatters';

interface CapacityModalProps {
  onClose: () => void;
  totalCommitted: number;
  totalUsed: number;
  nodes: Node[];
  medianCommitted: number;
}

export const CapacityModal = ({ onClose, totalCommitted, totalUsed, nodes, medianCommitted }: CapacityModalProps) => {
  const avgCommitted = totalCommitted / (nodes.length || 1);
  const top10Storage = [...nodes]
    .sort((a, b) => (b.storage_committed || 0) - (a.storage_committed || 0))
    .slice(0, 10);
  const top10Total = top10Storage.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
  const top10Dominance = ((top10Total / totalCommitted) * 100).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Database size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Network Capacity</h3>
              <p className="text-xs text-zinc-500">Storage distribution across network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Total Committed</div>
              <div className="text-2xl font-bold text-purple-400">{formatBytes(totalCommitted)}</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Total Used</div>
              <div className="text-2xl font-bold text-blue-400">{formatBytes(totalUsed)}</div>
              <div className="text-xs text-zinc-600 mt-1">
                {((totalUsed / totalCommitted) * 100).toFixed(2)}% utilized
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Network Benchmarks</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Median Storage</span>
                <span className="text-sm font-mono text-white">{formatBytes(medianCommitted)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Average Storage</span>
                <span className="text-sm font-mono text-white">{formatBytes(avgCommitted)}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-yellow-500" />
              <div className="text-[10px] text-yellow-500 uppercase font-bold">Top 10 Dominance</div>
            </div>
            <div className="text-2xl font-bold text-white">{top10Dominance}%</div>
            <div className="text-xs text-zinc-500 mt-1">of total network capacity</div>
            <div className="mt-3 text-xs text-zinc-600">
              Top 10 nodes control {formatBytes(top10Total)} combined
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
