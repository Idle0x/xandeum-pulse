import { X, Server } from 'lucide-react';
import { Node } from '../../../types';

interface ConsensusModalProps {
  onClose: () => void;
  nodes: Node[];
  mostCommonVersion: string;
}

export const ConsensusModal = ({ onClose, nodes, mostCommonVersion }: ConsensusModalProps) => {
  const versionGroups = nodes.reduce((acc, node) => {
    const ver = node.version || 'Unknown';
    acc[ver] = (acc[ver] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedVersions = Object.entries(versionGroups).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6 sticky top-0 bg-[#09090b] pb-4 border-b border-zinc-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Server size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Version Consensus</h3>
              <p className="text-xs text-zinc-500">Distribution across network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {sortedVersions.map(([version, count], idx) => {
            const percentage = ((count / nodes.length) * 100).toFixed(2);
            const isConsensus = version === mostCommonVersion;

            return (
              <div 
                key={version} 
                className={`bg-zinc-900/50 border rounded-xl p-4 transition-all hover:scale-[1.01] ${
                  isConsensus ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-black ${isConsensus ? 'text-blue-400' : 'text-zinc-500'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className={`font-mono font-bold flex items-center gap-2 ${isConsensus ? 'text-white' : 'text-zinc-300'}`}>
                        {version}
                        {isConsensus && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 uppercase font-bold">
                            Consensus
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{count} nodes • {percentage}% of network</div>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isConsensus ? 'bg-blue-500' : 'bg-zinc-600'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
