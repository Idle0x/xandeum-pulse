import { Plus } from 'lucide-react';

export const EmptySlot = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col min-w-[100px] md:min-w-[140px] h-full bg-white/[0.01] group cursor-pointer hover:bg-white/[0.03] transition relative last:rounded-tr-xl last:rounded-br-xl print-exclude" onClick={onClick}>
    <div className="h-24 md:h-32 p-2 flex flex-col items-center justify-center border-b border-white/5 bg-black/40 first:rounded-tr-xl">
      <Plus size={12} className="md:w-4 md:h-4 text-zinc-700 group-hover:text-zinc-400 transition" />
    </div>
    <div className="flex-1"></div>
  </div>
);
