// components/PhysicalLocationBadge.tsx
import React from 'react';
import { Node } from '../types';

interface BadgeProps {
  node: Node;
  zenMode: boolean;
}

export const PhysicalLocationBadge = ({ node, zenMode }: BadgeProps) => {
  const ip = node.address ? node.address.split(':')[0] : 'Unknown';
  const country = node.location?.countryName || 'Unknown Location';
  const code = node.location?.countryCode;

  return (
    <div className="flex items-center gap-2 font-mono text-sm mt-1">
      <span
        className={`font-bold transition-all duration-1000 ${
          zenMode ? 'text-blue-400' : 'text-cyan-400'
        } animate-pulse-glow text-shadow-neon`}
      >
        {ip}
      </span>
      <span className="text-zinc-600">|</span>
      <div className="flex items-center gap-2">
        {code && code !== 'XX' && (
          <img
            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
            alt="flag"
            className="w-5 h-auto rounded-sm shadow-sm"
          />
        )}
        <span className="text-white font-bold tracking-wide">{country}</span>
      </div>
      <style jsx>{`
        .text-shadow-neon {
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
          }
        }
      `}</style>
    </div>
  );
};
