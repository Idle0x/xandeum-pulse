import { ReactNode } from 'react';

export function DocShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020202] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col">
      {/* Global Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      {children}
    </div>
  );
}
