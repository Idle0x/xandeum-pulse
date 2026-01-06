import React from 'react';

interface RadialProgressProps {
  score: number;
  size?: number;
  stroke?: number;
}

export const RadialProgress = ({ score, size = 160, stroke = 12 }: RadialProgressProps) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#18181b"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-white tracking-tighter">{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">
          Health Score
        </span>
      </div>
    </div>
  );
};
