import React from 'react';

export const NetworkSwitcher = ({ 
  current, 
  onChange, 
  size = 'md' 
}: { 
  current: string; 
  onChange: (val: 'ALL' | 'MAINNET' | 'DEVNET') => void; 
  size?: 'sm' | 'md' 
}) => {
  const options = [
    { id: 'ALL', label: 'ALL' },
    { id: 'MAINNET', label: 'MAIN' },
    { id: 'DEVNET', label: 'DEV' },
  ];

  const activeIdx = options.findIndex(o => o.id === current);
  const activeStyles: Record<string, string> = {
    ALL: 'bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.2)]',
    MAINNET: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
    DEVNET: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
  };

  const handleSwitch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // STOP PROPAGATION HERE
    onChange(id as 'ALL' | 'MAINNET' | 'DEVNET');
  };

  return (
    <div className={`relative bg-black/60 border border-white/5 rounded-full p-0.5 flex items-center transition-all ${size === 'sm' ? 'w-24' : 'w-full'}`}>
      <div 
        className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeStyles[current] || activeStyles.ALL}`}
        style={{ 
          width: `calc(33.33% - 1px)`, 
          transform: `translateX(${activeIdx * 100}%)` 
        }}
      />
      {options.map((opt) => (
        <div
          key={opt.id}
          onClick={(e) => handleSwitch(e, opt.id)}
          className={`relative z-10 flex-1 text-[7px] md:text-[8px] font-black tracking-tighter py-0.5 text-center transition-colors duration-300 cursor-pointer ${
            current === opt.id ? 'text-black' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};
