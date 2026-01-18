import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NetworkType } from '../../types/map';
import { NETWORK_STYLES } from '../../utils/mapConstants';

interface NetworkSwitcherProps {
  selectedNetwork: NetworkType;
  setSelectedNetwork: (net: NetworkType) => void;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ selectedNetwork, setSelectedNetwork }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeStyle = NETWORK_STYLES[selectedNetwork];
    const Icon = activeStyle.icon;

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all w-full md:w-auto min-w-[130px] justify-between group shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Icon size={14} className={activeStyle.color} />
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${activeStyle.color}`}>{activeStyle.label}</span>
                </div>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-full md:w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-0.5">
                      {(Object.keys(NETWORK_STYLES) as NetworkType[]).map((net) => {
                          const style = NETWORK_STYLES[net];
                          const NetIcon = style.icon;
                          const isActive = selectedNetwork === net;
                          return (
                              <button
                                  key={net}
                                  onClick={() => { setSelectedNetwork(net); setIsOpen(false); }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                              >
                                  <NetIcon size={14} className={style.color} />
                                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isActive ? 'text-white' : 'text-zinc-400'}`}>{style.label}</span>
                                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                              </button>
                          );
                      })}
                  </div>
                </>
            )}
        </div>
    );
};
