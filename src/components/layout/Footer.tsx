import Link from 'next/link';
import { Twitter, ExternalLink, BookOpen, Activity } from 'lucide-react';

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
    <footer className="relative border-t border-zinc-800 bg-zinc-900/50 py-3 px-4 mt-auto overflow-hidden">
      
      {/* 3-Column Grid for precise placement */}
      <div className="grid grid-cols-3 items-end gap-2">

        {/* LEFT: Active Pods (Tiny Fonts) */}
        <div className="flex justify-start">
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

        {/* CENTER: Copyright & Info */}
        <div className="flex flex-col items-center text-center">
            <h3 className="text-zinc-400 font-bold mb-0.5 text-[9px] uppercase tracking-widest opacity-80">Xandeum Pulse</h3>
            <div className="flex items-center justify-center gap-2 text-[7px] font-mono text-zinc-600">
                <span className="opacity-50">pRPC</span>
                <span className="text-zinc-800">|</span>
                <a href="https://twitter.com/33xp_" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-blue-400 transition flex items-center gap-1">riot' <Twitter size={6} /></a>
                <span className="text-zinc-800">|</span>
                <a href="https://github.com/Idle0x/xandeum-pulse" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition flex items-center gap-1">GitHub <ExternalLink size={6} /></a>
            </div>
        </div>

        {/* RIGHT: Docs Link */}
        <div className="flex justify-end">
            <Link href="/docs" className="text-[7px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors">
                <BookOpen size={8} /> <span className="hidden sm:inline">System Docs</span>
            </Link>
        </div>

      </div>
    </footer>
  );
};
