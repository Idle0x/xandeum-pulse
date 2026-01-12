import { useState, useEffect } from 'react';

export const LiveWireLoader = () => (
  <div className="w-full h-1 relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
    <div className="absolute inset-0 bg-blue-500/20 blur-[2px]"></div>
    <div
      className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer"
      style={{ animationDuration: '1.5s' }}
    ></div>
  </div>
);

export const PulseGraphLoader = () => {
  const [text, setText] = useState('Initializing Uplink...');

  useEffect(() => {
    const texts = [
      'Establishing Connection...',
      'Parsing Gossip Protocol...',
      'Syncing Node Storage...',
      'Decrypting Ledger...',
    ];
    let i = 0;

    const interval = setInterval(() => {
      setText(texts[i % texts.length]);
      i++;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-80">
      <div className="relative w-64 h-32 mb-6">
        <svg viewBox="0 0 300 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          <path
            d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50 L80,30 L90,70 L100,50 L150,50 L160,10 L170,90 L180,50 L220,50 L230,30 L240,70 L250,50 L300,50"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-graph"
          />
          <div className="absolute top-0 bottom-0 w-1 bg-white/50 blur-[1px] animate-scan-line"></div>
        </svg>
      </div>
      <div className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">{text}</div>
      <style jsx>{`
        .animate-draw-graph {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw 2s ease-in-out infinite;
        }
        .animate-scan-line {
          left: 0;
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes draw {
          0% {
            stroke-dashoffset: 400;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
          }
          90% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }
        @keyframes scan {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
