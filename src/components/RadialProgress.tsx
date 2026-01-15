import React from 'react';

interface RadialProgressProps {
  score: number;
  size?: number;
  stroke?: number;
  zenMode?: boolean; // Added Prop
}

export const RadialProgress = ({ score, size = 160, stroke = 12, zenMode = false }: RadialProgressProps) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Zen Mode: White ring. Normal: Traffic light logic.
  const color = zenMode 
    ? '#ffffff' 
    : score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  const trackColor = zenMode ? '#27272a' : '#18181b'; // Zinc-800 vs Zinc-950

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
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
          className={zenMode ? "" : "transition-all duration-1000 ease-out"} // Kill animation in Zen
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-extrabold tracking-tighter ${zenMode ? 'text-white' : 'text-white'}`}>
            {score}
        </span>
      </div>
    </div>
  );
};
