import { useState } from 'react';
import { Shield, ArrowLeft, Check, Copy, CheckCircle, AlertTriangle, Server, Network, Boxes } from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, getSafeVersion, compareVersions } from '../../../utils/nodeHelpers';
import { formatUptime } from '../../../utils/formatters';

interface IdentityViewProps {
  node: Node;
  nodes: Node[]; // Added for Fleet Topology
  zenMode: boolean;
  onBack: () => void;
  mostCommonVersion: string;
}

export const IdentityView = ({ node, nodes, zenMode, onBack, mostCommonVersion }: IdentityViewProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  // --- FLEET TOPOLOGY CALCULATION ---
  // Filter all nodes that belong to the same owner address
  const ownerNodes = nodes.filter(n => n.address === node.address);
  const totalOwned = ownerNodes.length;
  const mainnetCount = ownerNodes.filter(n => n.network === 'MAINNET').length;
  const devnetCount = ownerNodes.filter(n => n.network !== 'MAINNET').length; // Assuming non-mainnet is dev/test

  const details = [
    { label: 'Public Key', val: node?.pubkey || 'Unknown', id: 'pubkey' },
    { label: 'RPC Endpoint', val: `http://${getSafeIp(node)}:6000`, id: 'rpc' },
    { label: 'IP Address', val: getSafeIp(node), id: 'ip' },
    { label: 'Node Version', val: getSafeVersion(node), id: 'version' },
    { label: 'Current Uptime', val: formatUptime(node?.uptime), color: 'text-orange-400', id: 'uptime' },
  ];

  const FieldCard = ({ label, val, id, color }: { label: string, val: string, id: string, color?: string }) => (
    <div className={`relative group p-3 rounded-xl border transition-all duration-300 ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/60'}`}>
        <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">{label}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
             <div className={`font-mono text-xs md:text-sm font-bold truncate ${color || 'text-zinc-200'}`}>
                {val}
             </div>
             {/* Integrated Copy Button */}
             <button 
                onClick={() => copyToClipboard(val, id)} 
                className={`p-1.5 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                    copiedField === id 
                    ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                    : 'bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
             >
                {copiedField === id ? <Check size={12} /> : <Copy size={12} />}
             </button>
        </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
        <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${zenMode ? 'text-zinc-200' : 'text-zinc-500'}`}>
          <Shield size={14} /> IDENTITY & STATUS
        </h3>
        <button onClick={onBack} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 transition hover:bg-zinc-800">
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
        
        {/* --- MOBILE LAYOUT: HUD HEADER & FLEET STACK --- */}
        <div className="md:hidden flex gap-3">
            {/* Left: Shield & Current Network */}
            <div className={`flex-1 rounded-2xl p-3 border flex flex-col justify-between relative overflow-hidden ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/60 border-zinc-800'}`}>
                <div className="absolute top-0 right-0 p-8 bg-blue-500/10 blur-xl rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                    <Shield size={32} className="text-blue-500 mb-2" />
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Current Network</div>
                    <div className={`text-sm font-black tracking-tight ${node.network === 'MAINNET' ? 'text-green-400' : 'text-blue-400'}`}>
                        {node.network || 'UNKNOWN'}
                    </div>
                </div>
            </div>

            {/* Right: Fleet Stack (Total, Dev, Main) */}
            <div className="w-1/2 flex flex-col gap-2">
                <div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 flex flex-col justify-center">
                    <div className="text-[8px] text-zinc-500 uppercase font-bold flex items-center gap-1"><Boxes size={8}/> Fleet Size</div>
                    <div className="text-lg font-mono font-bold text-white leading-none">{totalOwned}</div>
                </div>
                <div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 flex flex-col justify-center">
                   <div className="flex justify-between items-center">
                       <span className="text-[8px] text-zinc-500 uppercase font-bold">Mainnet</span>
                       <span className="text-xs font-mono font-bold text-green-500">{mainnetCount}</span>
                   </div>
                </div>
                <div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 flex flex-col justify-center">
                   <div className="flex justify-between items-center">
                       <span className="text-[8px] text-zinc-500 uppercase font-bold">Devnet</span>
                       <span className="text-xs font-mono font-bold text-blue-500">{devnetCount}</span>
                   </div>
                </div>
            </div>
        </div>

        {/* --- DESKTOP LAYOUT: FLEET GRID --- */}
        <div className="hidden md:grid grid-cols-2 gap-4">
             {/* Total Nodes (Span 2) */}
             <div className={`col-span-2 p-4 rounded-xl border flex items-center justify-between ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800'}`}>
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><Boxes size={18}/></div>
                     <div>
                         <div className="text-[10px] font-bold text-zinc-500 uppercase">Total Fleet Size</div>
                         <div className="text-xl font-bold text-white">{totalOwned} <span className="text-xs text-zinc-600 font-normal">Nodes</span></div>
                     </div>
                 </div>
                 <div className="text-right">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase bg-zinc-800 px-2 py-0.5 rounded">Owner Address</div>
                 </div>
             </div>
             {/* Network Split */}
             <div className="p-3 rounded-xl border border-zinc-800 bg-black/20 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Mainnet Nodes</span>
                  <span className="text-lg font-mono font-bold text-green-500">{mainnetCount}</span>
             </div>
             <div className="p-3 rounded-xl border border-zinc-800 bg-black/20 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Devnet Nodes</span>
                  <span className="text-lg font-mono font-bold text-blue-500">{devnetCount}</span>
             </div>
        </div>

        {/* --- DATA GRID (Field Cards) --- */}
        <div className="flex flex-col gap-2 md:grid md:grid-cols-1 md:gap-3">
             {details.map((d) => (
                 <FieldCard key={d.id} {...d} />
             ))}
        </div>

        {/* --- STATUS FOOTER --- */}
        <div className={`mt-auto p-4 rounded-xl border flex items-center gap-4 relative overflow-hidden ${isLatest ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
          <div className={`absolute inset-0 opacity-10 ${isLatest ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500 to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 to-transparent'}`}></div>
          <div className={`p-2 rounded-full ${isLatest ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
              {isLatest ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="relative z-10">
            <div className={`text-xs font-black uppercase tracking-wide ${isLatest ? 'text-green-400' : 'text-orange-400'}`}>{isLatest ? 'System Up to Date' : 'Update Recommended'}</div>
            <div className="text-[10px] text-zinc-500 font-medium">Network Consensus: <span className="font-mono text-zinc-300 bg-black/30 px-1.5 rounded">{mostCommonVersion}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};
