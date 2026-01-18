import { Plus } from 'lucide-react';

export const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[100px] md:min-w-[140px] h-full bg-white/[0.01] group cursor-pointer hover:bg-white/[0.03] transition relative last:rounded-tr-xl last:rounded-br-xl print-exclude" onClick={onClick}>
    <div className="h-24 md:h-32 p-2 flex flex-col items-center justify-center border-b border-white/5 bg-black/40 first:rounded-tr-xl">
      <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-500 transition-all">
        <Plus size={14} />
      </div>
      {/* NEW LABEL */}
      <span className="text-[9px] mt-2 font-mono uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">Add Node</span>
    </div>
    <div className="flex-1"></div>
  </div>
);
