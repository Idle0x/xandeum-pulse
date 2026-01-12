// components/WelcomeCurtain.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, LayoutDashboard, PlayCircle } from 'lucide-react';

export const WelcomeCurtain = () => {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const seen = localStorage.getItem('xandeum_pulse_welcome_v1');
    if (!seen) {
      setTimeout(() => setShow(true), 100);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEnter = () => {
    localStorage.setItem('xandeum_pulse_welcome_v1', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-[#09090b] border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-center items-center gap-6 mb-6 relative z-10">
          <div className="flex flex-col items-center gap-2">
            <div className={`p-3 rounded-xl border border-zinc-800 shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-colors duration-500 ${!isMobile ? 'bg-zinc-800 text-blue-400' : 'bg-zinc-900 text-zinc-600'}`}>
              <Monitor size={32} />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${!isMobile ? 'text-blue-400' : 'text-zinc-600'}`}>Desktop</span>
          </div>
          <div className="h-px w-8 bg-zinc-800"></div>
          <div className="flex flex-col items-center gap-2">
            <div className={`p-3 rounded-xl border border-zinc-800 transition-colors duration-500 ${isMobile ? 'bg-zinc-800 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-zinc-900 text-zinc-600'}`}>
              <div className="relative">
                <LayoutDashboard size={24} />
              </div>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isMobile ? 'text-blue-400' : 'text-zinc-600'}`}>Mobile</span>
          </div>
        </div>

        <div className="text-center relative z-10 space-y-2 mb-6">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Welcome to Pulse
          </h2>
          <div className="text-xs text-zinc-400 leading-relaxed px-2 space-y-3">
            <p>Hi there! This dashboard is packed with real-time data sourced directly from the network.</p>
            <p className={isMobile ? "text-blue-200" : "text-zinc-300"}>
              {isMobile 
                ? "Because of the data complexity, a desktop screen provides the best experience, though we have optimized this mobile view for quick checks on the go."
                : "You're using a large screen, which is perfect! You are ready to fully explore the interactive map and detailed metrics."
              }
            </p>
          </div>
        </div>

        <div className="space-y-3 text-left relative z-10 mt-6">
            <Link href="/docs?training=true">
                <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 group">
                    <PlayCircle size={16} className="group-hover:scale-110 transition-transform" /> 
                    Take a Walkthrough
                </button>
            </Link>

            <button 
                onClick={handleEnter}
                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-sm tracking-wide uppercase transition-all border border-zinc-700"
            >
                Continue to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};
