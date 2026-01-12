import { useState, useRef } from 'react';
import { 
  ArrowLeft, Check, ClipboardCopy, Share2, FileJson, Link as LinkIcon, ImageIcon, 
  Activity, Database, Zap 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Node } from '../../types';
import { getSafeIp, getSafeVersion } from '../../utils/nodeHelpers';
import { formatBytes } from '../../utils/formatters';

interface ShareProofProps {
  node: Node;
  onBack: () => void;
}

export const ShareProof = ({ node, onBack }: ShareProofProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const proofRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadProof = async () => {
    if (proofRef.current === null) return;
    try {
      const dataUrl = await toPng(proofRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b',
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `xandeum-proof-${node?.pubkey?.slice(0,6) || 'node'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate proof", err);
    }
  };

  const copyStatusReport = () => {
    const health = node.health || 0;
    const report = `[XANDEUM PULSE REPORT]\nNode: ${node.address || 'Unknown'}\nStatus: ${(node.uptime || 0) > 86400 ? 'STABLE' : 'BOOTING'}\nHealth: ${health}/100\nMonitor at: https://xandeum-pulse.vercel.app`;
    copyToClipboard(report, 'report');
  };

  const shareToTwitter = () => {
    const health = node.health || 0;
    const creditsDisplay = node.credits !== null ? node.credits.toLocaleString() : 'N/A';
    const text = `Just checked my pNode status on Xandeum Pulse! ⚡\n\n🟢 Status: ${(node.uptime || 0) > 86400 ? 'Stable' : 'Booting'}\n❤️ Health: ${health}/100\n💰 Credits: ${creditsDisplay}\n\nMonitor here:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://xandeum-pulse.vercel.app")}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300 py-10">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
        {/* THE PROOF CARD */}
        <div
          ref={proofRef}
          className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl shadow-2xl w-full max-w-[300px] h-fit relative overflow-hidden group flex flex-col"
        >
          <div className="absolute top-0 right-0 p-24 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 mb-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Activity size={12} className="text-blue-500" />
              <h2 className="text-xs font-black text-white tracking-tighter uppercase">PROOF OF PULSE</h2>
            </div>
            <div className="flex items-center justify-center gap-1.5 opacity-90">
              <span className="font-mono text-[10px] text-zinc-300 font-bold tracking-wide">{getSafeIp(node)}</span>
              {node?.location?.countryCode && (
                <img
                  src={`https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png`}
                  alt="flag"
                  className="w-3 h-auto rounded-[1px]"
                />
              )}
            </div>
            <div className="h-px bg-zinc-800/50 w-full mt-3"></div>
          </div>

          <div className="relative z-10 flex flex-col gap-2">
            <div className="bg-gradient-to-r from-green-900/10 to-transparent border border-green-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Health Score</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{node?.health || 0}</span>
            </div>
            <div className="bg-gradient-to-r from-purple-900/10 to-transparent border border-purple-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database size={8} className="text-purple-500" />
                <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Storage</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{formatBytes(node?.storage_committed)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-lg p-2 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-sm text-yellow-400 leading-none mb-1">
                  {node?.credits !== null ? (node?.credits >= 1000000 ? (node.credits / 1000000).toFixed(1) + 'M' : node.credits.toLocaleString()) : '-'}
                </span>
                <span className="text-[7px] font-bold text-yellow-600 uppercase tracking-wider">Credits</span>
              </div>
              <div className="bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 rounded-lg p-2 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-sm text-blue-200 leading-none mb-1">{getSafeVersion(node)}</span>
                <span className="text-[7px] font-bold text-blue-500 uppercase tracking-wider">Version</span>
              </div>
            </div>
          </div>

          <div className="mt-4 relative z-10 text-center pt-3 border-t border-zinc-900">
            <div className="text-[8px] text-zinc-600 font-mono flex items-center justify-center gap-1.5 uppercase tracking-widest">
              <Zap size={8} className="text-blue-600 fill-blue-600" /> Verified by Pulse
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button onClick={onBack} className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition border border-zinc-800 mb-6 flex items-center justify-center gap-2 group">
            <ArrowLeft size={16} className="text-red-500 group-hover:-translate-x-1 transition-transform" />
            Back to Details
          </button>
          
          <button onClick={copyStatusReport} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold transition duration-300 border ${copiedField === 'report' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'}`}>
             {copiedField === 'report' ? <Check size={14} /> : <ClipboardCopy size={14} />} {copiedField === 'report' ? 'REPORT COPIED' : 'Copy Diagnostic Report'}
          </button>
          
          <button onClick={shareToTwitter} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-xs font-bold text-blue-400 border border-blue-800">
             <Share2 size={14} /> Share Proof on X
          </button>

          <button onClick={() => copyToClipboard(JSON.stringify(node, null, 2), 'json')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold transition duration-300 border ${copiedField === 'json' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'}`}>
             {copiedField === 'json' ? <Check size={14} /> : <FileJson size={14} />} {copiedField === 'json' ? 'JSON COPIED' : 'Copy JSON Data (Dev)'}
          </button>

           <button onClick={() => copyToClipboard(`${window.location.origin}/?open=${node.pubkey}`, 'url')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold transition duration-300 border ${copiedField === 'url' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'}`}>
             {copiedField === 'url' ? <Check size={14} /> : <LinkIcon size={14} />} {copiedField === 'url' ? 'URL COPIED' : 'Copy Public Node URL'}
          </button>

          <button onClick={handleDownloadProof} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold text-white border border-green-700 mt-2 shadow-lg shadow-green-900/20">
             <ImageIcon size={14} /> DOWNLOAD PROOF
          </button>
        </div>
      </div>
    </div>
  );
};
