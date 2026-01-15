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
  zenMode: boolean; // Added zenMode prop
}

export const ShareProof = ({ node, onBack, zenMode }: ShareProofProps) => {
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

  // --- BUTTON STYLES (Subtle/Minimal vs Zen) ---
  
  const twitterStyle = !zenMode 
    ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-500" 
    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white";

  const downloadStyle = !zenMode 
    ? "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-500" 
    : "bg-black hover:bg-zinc-900 border-zinc-700 text-white";

  const backStyle = !zenMode 
    ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500" 
    : "bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-500";

  // Helper for small copy buttons to handle "Copied" state + Zen state + Color state
  const getSmallButtonStyle = (id: string, colorClass: string) => {
    if (copiedField === id) return "bg-white text-black border-white"; // Copied state (High contrast)
    if (zenMode) return "bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-400"; // Zen state
    return colorClass; // Color state
  };

  return (
    <div className="h-full flex flex-col md:justify-center animate-in zoom-in-95 duration-300">
      <div className="flex flex-col md:grid md:grid-cols-2 md:items-center gap-6 md:gap-12 w-full max-w-6xl mx-auto p-4 md:p-8">

        {/* LEFT COLUMN: THE PROOF CARD (HERO) - KEEPS COLORS */}
        <div className="flex justify-center md:justify-end w-full">
          <div
            ref={proofRef}
            className="bg-zinc-950 border border-zinc-800 p-5 md:p-8 rounded-xl shadow-2xl w-full max-w-[320px] md:max-w-[420px] h-fit relative overflow-hidden group flex flex-col"
          >
            <div className="absolute top-0 right-0 p-24 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 mb-6 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Activity size={14} className="text-blue-500" />
                <h2 className="text-sm md:text-base font-black text-white tracking-tighter uppercase">PROOF OF PULSE</h2>
              </div>
              <div className="flex items-center justify-center gap-2 opacity-90">
                <span className="font-mono text-xs text-zinc-300 font-bold tracking-wide">{getSafeIp(node)}</span>
                {node?.location?.countryCode && (
                  <img
                    src={`https://flagcdn.com/w20/${node.location.countryCode.toLowerCase()}.png`}
                    alt="flag"
                    className="w-4 h-auto rounded-[1px]"
                  />
                )}
              </div>
              <div className="h-px bg-zinc-800/50 w-full mt-4"></div>
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <div className="bg-gradient-to-r from-green-900/10 to-transparent border border-green-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Health Score</span>
                </div>
                <span className="font-mono font-bold text-base md:text-lg text-white">{node?.health || 0}</span>
              </div>

              <div className="bg-gradient-to-r from-purple-900/10 to-transparent border border-purple-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-purple-500" />
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Storage</span>
                </div>
                <span className="font-mono font-bold text-base md:text-lg text-white">{formatBytes(node?.storage_committed)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-lg p-3 flex flex-col items-center justify-center">
                  <span className="font-mono font-bold text-lg text-yellow-400 leading-none mb-1.5">
                    {node?.credits !== null ? (node?.credits >= 1000000 ? (node.credits / 1000000).toFixed(1) + 'M' : node.credits.toLocaleString()) : '-'}
                  </span>
                  <span className="text-[8px] font-bold text-yellow-600 uppercase tracking-wider">Credits</span>
                </div>
                <div className="bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 rounded-lg p-3 flex flex-col items-center justify-center">
                  <span className="font-mono font-bold text-lg text-blue-200 leading-none mb-1.5">{getSafeVersion(node)}</span>
                  <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Version</span>
                </div>
              </div>
            </div>

             <div className="mt-6 relative z-10 text-center pt-4 border-t border-zinc-900">
              <div className="text-[9px] text-zinc-600 font-mono flex items-center justify-center gap-1.5 uppercase tracking-widest">
                <Zap size={10} className="text-blue-600 fill-blue-600" /> Verified by Pulse
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL */}
        <div className="flex flex-col gap-4 w-full md:max-w-md mx-auto md:mx-0">

          {/* PRIMARY ACTIONS - Share (Blue) & Download (Green) */}
          <button 
            onClick={shareToTwitter} 
            className={`flex items-center justify-center gap-2 px-6 py-4 border rounded-xl text-sm font-bold transition-all ${twitterStyle}`}
          >
             <Share2 size={16} /> Share Proof on X
          </button>

          <button 
            onClick={handleDownloadProof} 
            className={`flex items-center justify-center gap-2 px-6 py-4 border rounded-xl text-sm font-bold transition-all ${downloadStyle}`}
          >
             <ImageIcon size={16} /> Download Image
          </button>

          <div className="h-px bg-zinc-800 w-full my-2"></div>

          {/* SECONDARY ACTIONS - Flat Design */}
          <div className="grid grid-cols-2 gap-3">
             {/* Default Gray/Zinc Buttons */}
             <button 
                onClick={copyStatusReport} 
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-[10px] font-bold transition duration-300 border ${getSmallButtonStyle('report', 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700')}`}
             >
                {copiedField === 'report' ? <Check size={12} /> : <ClipboardCopy size={12} />} {copiedField === 'report' ? 'COPIED' : 'Copy Report'}
             </button>

             <button 
                onClick={() => copyToClipboard(JSON.stringify(node, null, 2), 'json')} 
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-[10px] font-bold transition duration-300 border ${getSmallButtonStyle('json', 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700')}`}
             >
                {copiedField === 'json' ? <Check size={12} /> : <FileJson size={12} />} {copiedField === 'json' ? 'COPIED' : 'Copy JSON'}
             </button>

             {/* Copy URL - Indigo Touch */}
              <button 
                onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/?open=${node.pubkey}`, 'url')} 
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-[10px] font-bold transition duration-300 border ${getSmallButtonStyle('url', 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20')}`}
              >
                {copiedField === 'url' ? <Check size={12} /> : <LinkIcon size={12} />} {copiedField === 'url' ? 'COPIED' : 'Copy Link'}
             </button>

             {/* Back Button - Red */}
             <button 
                onClick={onBack} 
                className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-lg text-[10px] font-bold transition ${backStyle}`}
             >
               <ArrowLeft size={12} /> Back
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};
