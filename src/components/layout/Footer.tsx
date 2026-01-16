import Link from 'next/link';
import { Twitter, ExternalLink, BookOpen } from 'lucide-react';

interface FooterProps {
  zenMode: boolean;
  nodeCount: number;
}

export const Footer = ({ zenMode, nodeCount }: FooterProps) => {
  if (zenMode) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-2 px-6 flex justify-between items-center text-[9px] text-zinc-600 font-mono z-40">
         <div>ZEN MODE ACTIVE</div>
         <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
           <span>{nodeCount} NODES SYNCED</span>
         </div>
      </footer>
    );
  }

  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-900/50 p-6 mt-auto text-center overflow-hidden">
      <h3 className="text-white font-bold mb-2">XANDEUM PULSE MONITOR</h3>
      <p className="text-zinc-500 text-sm mb-4 max-w-lg mx-auto">Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.</p>
      <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-600 mb-4">
        <span className="opacity-50">pRPC Powered</span><span className="text-zinc-800">|</span>
        <div className="flex items-center gap-1"><span>Built by</span><a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">riot' <Twitter size={10} /></a></div>
        <span className="text-zinc-800">|</span><a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">Open Source <ExternalLink size={10} /></a>
      </div>
      <Link href="/docs" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 flex items-center justify-center gap-1 mt-4"><BookOpen size={10} /> System Architecture & Docs</Link>
    </footer>
  );
};
