import Link from 'next/link';
import { Twitter, ExternalLink, BookOpen } from 'lucide-react';

interface FooterProps {
  zenMode: boolean;
  totalNodes: number;    // Total in database
  filteredCount: number; // Currently matching filters
}

export const Footer = ({ zenMode, totalNodes, filteredCount }: FooterProps) => {
  if (zenMode) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-2 px-6 flex justify-between items-center text-[9px] text-zinc-600 font-mono z-40">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>ZEN MODE ACTIVE</span>
         </div>
         <div className="flex items-center gap-2">
           <span>{filteredCount} / {totalNodes} NODES</span>
         </div>
      </footer>
    );
  }

  // STANDARD MODE
  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-900/50 py-4 px-4 mt-auto text-center overflow-hidden">
      
      {/* 1. RESTORED: Main Center Content (Title + Description) */}
      <h3 className="text-white font-bold mb-1 text-[10px] uppercase tracking-widest">Xandeum Pulse</h3>
      <p className="text-zinc-500 text-[8px] mb-3 max-w-lg mx-auto leading-relaxed">
        Real-time dashboard for the Xandeum Gossip Protocol. Monitoring pNode health, storage capacity, and network consensus metrics directly from the blockchain.
      </p>

      {/* 2. RESTORED: Links Row (pRPC | Built by | Open Source) */}
      <div className="flex items-center justify-center gap-3 text-[7px] font-mono text-zinc-600 mb-3">
        <span className="opacity-50">pRPC Powered</span><span className="text-zinc-800">|</span>
        <div className="flex items-center gap-1"><span>Built by</span><a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition font-bold flex items-center gap-1">riot' <Twitter size={8} /></a></div>
        <span className="text-zinc-800">|</span><a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition flex items-center gap-1">Open Source <ExternalLink size={8} /></a>
      </div>

      {/* 3. RESTORED: Docs Link */}
      <Link href="/docs" className="text-[7px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 decoration-zinc-700 flex items-center justify-center gap-1 mb-4">
        <BookOpen size={8} /> System Architecture & Docs
      </Link>

      {/* 4. NEW: Active Pods Indicator (Positioned absolutely at bottom-left) */}
      <div className="absolute bottom-2 left-4">
           <div className="flex items-center gap-2 text-[8px] font-mono font-bold uppercase text-zinc-600 bg-black/20 px-2 py-1 rounded border border-zinc-800/50">
              <div className="relative flex h-1.5 w-1.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 duration-1000"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </div>
              <span className="hidden sm:inline">Active Pods:</span>
              <span className="text-zinc-400">{filteredCount}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-500">{totalNodes}</span>
           </div>
      </div>

    </footer>
  );
};
