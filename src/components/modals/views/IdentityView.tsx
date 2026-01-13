import { useState } from 'react';
import { Shield, ArrowLeft, Check, Copy, CheckCircle, AlertTriangle, Server, Clock } from 'lucide-react';
import { Node } from '../../../types';
import { getSafeIp, getSafeVersion, compareVersions } from '../../../utils/nodeHelpers';
import { formatUptime } from '../../../utils/formatters';

interface IdentityViewProps {
  node: Node;
  zenMode: boolean;
  onBack: () => void;
  mostCommonVersion: string;
}

export const IdentityView = ({ node, zenMode, onBack, mostCommonVersion }: IdentityViewProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanVer = (node.version || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = mostCommonVersion.replace(/[^0-9.]/g, '');
  const isLatest = cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;

  const details = [
    { label: 'Public Key', val: node?.pubkey || 'Unknown' },
    { label: 'RPC Endpoint', val: `http://${getSafeIp(node)}:6000` },
    { label: 'IP Address', val: getSafeIp(node) },
    { label: 'Node Version', val: getSafeVersion(node) },
    { label: 'Current Uptime', val: formatUptime(node?.uptime), color: 'text-orange-400' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${zenMode ? 'text-zinc-200' : 'text-zinc-500'}`}>
          <Shield size={14} /> IDENTITY & STATUS
        </h3>
        <button onClick={onBack} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition">
          <ArrowLeft size={10} /> BACK
        </button>
      </div>

      <div className="space-y-4 flex-grow">
        {/* --- MOBILE LAYOUT: DIGITAL ID CARD --- */}
        <div className="md:hidden bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Server size={20}/></div>
                  <div>
                     <div className="text-white font-bold font-mono text-lg tracking-tight">{getSafeIp(node)}</div>
                     <div className="text-[10px] text-zinc-500 font-bold uppercase">Node Address</div>
                  </div>
               </div>
               <div className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${node.network === 'MAINNET' ? 'text-green-500 border-green-500/30' : 'text-blue-500 border-blue-500/30'}`}>{node.network}</div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
               <div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase mb-1">Public Key <span className="text-zinc-600 cursor-pointer" onClick={() => copyToClipboard(node.pubkey || '', 'pubkey')}>{copiedField === 'pubkey' ? 'COPIED' : 'COPY'}</span></div>
                  <div className="font-mono text-xs text-zinc-300 break-all">{node.pubkey}</div>
               </div>
               <div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase mb-1">RPC Endpoint</div>
                  <div className="font-mono text-xs text-zinc-300 break-all">http://{getSafeIp(node)}:6000</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-zinc-800/50 p-2 rounded-lg text-center">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Version</div>
                  <div className="text-white font-mono font-bold">{getSafeVersion(node)}</div>
               </div>
               <div className="bg-zinc-800/50 p-2 rounded-lg text-center">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Uptime</div>
                  <div className="text-orange-400 font-mono font-bold">{formatUptime(node?.uptime)}</div>
               </div>
            </div>
        </div>

        {/* --- DESKTOP LAYOUT: LIST VIEW (Preserved) --- */}
        <div className="hidden md:flex flex-col gap-4">
            {details.map((d) => (
            <div key={d.label} className={`p-4 rounded-xl border ${zenMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800'}`}>
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{d.label}</div>
                <div className="flex items-center justify-between">
                <code className={`text-sm font-mono truncate ${d.color || (zenMode ? 'text-zinc-300' : 'text-zinc-200')}`}>{d.val}</code>
                <button onClick={() => copyToClipboard(d.val, d.label)} className={`p-1.5 rounded transition ${copiedField === d.label ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                    {copiedField === d.label ? <Check size={12} className="animate-in zoom-in duration-200" /> : <Copy size={12} />}
                </button>
                </div>
            </div>
            ))}
        </div>

        <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${isLatest ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
          {isLatest ? <CheckCircle size={20} className="text-green-500" /> : <AlertTriangle size={20} className="text-orange-500" />}
          <div>
            <div className={`text-xs font-bold ${isLatest ? 'text-green-400' : 'text-orange-400'}`}>{isLatest ? 'Node is Up to Date' : 'Update Recommended'}</div>
            <div className="text-[10px] text-zinc-500">Current consensus version is <span className="font-mono text-zinc-300">{mostCommonVersion}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
