import React, { forwardRef } from 'react';
import { Zap } from 'lucide-react';
import { Node } from '../../types';
import { ControlRail } from './ControlRail';
import { NodeColumn } from './NodeColumn';
import { SynthesisEngine } from './SynthesisEngine';
import { EmptySlot } from './ComparisonUI';
import { PLAYER_THEMES } from './MicroComponents';

// Re-defining themes locally to ensure they are available to the ghost canvas
const LEADER_THEME_MAP: Record<string, any> = {
  STORAGE: { name: 'indigo', hex: '#818cf8', headerBg: 'bg-indigo-900/40', bodyBg: 'bg-indigo-900/5', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  CREDITS: { name: 'emerald', hex: '#34d399', headerBg: 'bg-emerald-900/40', bodyBg: 'bg-emerald-900/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  HEALTH: { name: 'rose', hex: '#fb7185', headerBg: 'bg-rose-900/40', bodyBg: 'bg-rose-900/5', text: 'text-rose-400', border: 'border-rose-500/20' },
  UPTIME: { name: 'sky', hex: '#38bdf8', headerBg: 'bg-sky-900/40', bodyBg: 'bg-sky-900/5', text: 'text-sky-400', border: 'border-sky-500/20' }
};

const StaticWatermark = () => (
  <div className="flex items-center justify-center gap-3 py-8 w-full border-t border-zinc-800 bg-[#020202] mt-auto">
     <div className="w-6 h-6 bg-cyan-500 rounded-full shadow-[0_0_15px_#06b6d4] flex items-center justify-center">
        <Zap size={12} className="text-black fill-black" />
     </div>
     <div className="flex flex-col">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Verified by Pulse</span>
        <span className="text-[10px] font-mono text-zinc-600">xandeum.network/pulse</span>
     </div>
  </div>
);

interface PulseExportCanvasProps {
  mode: 'TABLE' | 'FULL';
  nodes: Node[];
  leaders: { metric: string, node: Node }[];
  benchmarks: any;
  showNetwork: boolean;
  networkScope: string;
  currentWinners: any;
  overallWinnerKey: string | null;
}

export const PulseExportCanvas = forwardRef<HTMLDivElement, PulseExportCanvasProps>(({ 
  mode, nodes, leaders, benchmarks, showNetwork, networkScope, currentWinners, overallWinnerKey 
}, ref) => {

  const totalItems = leaders.length + nodes.length;

  // Helper for Title Case (e.g., "MAINNET" -> "Mainnet")
  const formatScope = (scope: string) => scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();

  return (
    <div ref={ref} className="bg-[#020202] flex flex-col items-start text-zinc-100 font-sans" style={{ width: 'fit-content', minWidth: '100%', minHeight: '100vh' }}>
        
        {/* 1. HEADER SECTION (UPDATED) */}
        <div className="w-full flex flex-col items-center justify-center pt-12 pb-8 border-b border-white/5 bg-[#050505]">
            <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">Xandeum Node Performance Report</h1>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 font-medium">
                <span>Network: <span className="text-zinc-300 font-bold">{formatScope(networkScope)}</span></span>
                <span className="text-zinc-700">•</span>
                <span><span className="text-zinc-300 font-bold">{totalItems}</span> Nodes Analyzed</span>
                <span className="text-zinc-700">•</span>
                <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
        </div>

        {/* 2. THE TABLE (Infinite Width Flex Row) */}
        <div className="flex items-start bg-[#020202] border-b border-white/5" style={{ width: 'max-content' }}>
            <div className="sticky left-0 z-10">
                 <ControlRail showNetwork={showNetwork} benchmarks={benchmarks} />
            </div>
            
            {/* Render Leaders */}
            {leaders.map((leader) => {
                const isWinner = {
                    health: (leader.node.health || 0) === currentWinners.health,
                    storage: (leader.node.storage_committed || 0) === currentWinners.storage,
                    credits: (leader.node.credits || 0) === currentWinners.credits
                };
                return (
                    <NodeColumn 
                        key={`export-leader-${leader.metric}`} 
                        node={leader.node} 
                        onRemove={() => {}} 
                        anchorNode={undefined} 
                        theme={LEADER_THEME_MAP[leader.metric]} 
                        winners={isWinner}
                        overallWinner={leader.node.pubkey === overallWinnerKey}
                        benchmarks={benchmarks}
                        showNetwork={showNetwork}
                        isLeader={true}      
                        leaderType={leader.metric}
                        hoveredNodeKey={null}
                    />
                );
            })}

            {/* Render Users */}
            {nodes.map((node, index) => {
                const isWinner = {
                    health: (node.health || 0) === currentWinners.health,
                    storage: (node.storage_committed || 0) === currentWinners.storage,
                    credits: (node.credits || 0) === currentWinners.credits
                };
                return (
                    <NodeColumn 
                        key={`export-node-${node.pubkey}`} 
                        node={node} 
                        onRemove={() => {}} 
                        anchorNode={nodes[0]} 
                        theme={PLAYER_THEMES[index % PLAYER_THEMES.length]} 
                        winners={isWinner}
                        overallWinner={node.pubkey === overallWinnerKey}
                        benchmarks={benchmarks}
                        showNetwork={showNetwork}
                        hoveredNodeKey={null}
                    />
                );
            })}
             {/* Spacer for right border aesthetics */}
             <div className="w-12 bg-transparent shrink-0"></div>
        </div>

        {/* 3. ANALYTICS DECK (Only for FULL mode) */}
        {mode === 'FULL' && (
            <div className="w-full bg-[#050505] p-8 flex justify-center border-b border-white/5">
                <div style={{ width: '1200px', maxWidth: '90vw' }}> 
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-bold text-zinc-300 uppercase tracking-widest">Network Synthesis</h2>
                    </div>
                    <SynthesisEngine 
                        nodes={[...leaders.map(l => l.node), ...nodes]} 
                        themes={[...leaders.map(l => LEADER_THEME_MAP[l.metric]), ...PLAYER_THEMES]} 
                        networkScope={networkScope} 
                        benchmarks={benchmarks}
                    />
                </div>
            </div>
        )}

        {/* 4. FOOTER / WATERMARK */}
        <StaticWatermark />
    </div>
  );
});

PulseExportCanvas.displayName = 'PulseExportCanvas';
