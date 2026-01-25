import { useState } from 'react';
import { TrendingUp, BarChart2, Calculator } from 'lucide-react';

export function EconomicsChapter() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="mb-16 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Economic Engine</h2>
                <p className="text-zinc-500">Tracks Total Accumulation (Wealth) and Yield Velocity (Rate).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Accumulation vs Velocity */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-yellow-500" size={20}/>
                        <h3 className="font-bold text-white">Yield Analytics</h3>
                    </div>
                    <div className="h-40 bg-zinc-900/50 rounded-xl flex items-end justify-between px-4 pb-0 relative overflow-hidden border border-zinc-800 mb-4">
                        {/* Fake Area Chart */}
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent clip-path-polygon"></div>
                        <div className="w-full h-full flex items-end justify-between gap-1">
                            {[20, 35, 45, 30, 55, 70, 65, 80, 95].map((h, i) => (
                                <div key={i} className="flex-1 bg-yellow-500/40 hover:bg-yellow-500 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase">Total Accumulation</div>
                            <div className="text-xl font-bold text-white">1.2M Cr</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase">Yield Velocity</div>
                            <div className="text-xl font-bold text-green-400">+12% / 24h</div>
                        </div>
                    </div>
                </div>

                {/* 2. STOINC Calculator */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Calculator className="text-yellow-500" size={20}/>
                        <h3 className="font-bold text-white">STOINC Multiplier</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-zinc-900 rounded border border-zinc-800">
                            <span className="text-xs text-zinc-400">Base Reward</span>
                            <span className="text-sm font-mono text-white">100 Cr</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 justify-center">
                             <span>× 1.2 (NFT)</span>
                             <span>× 1.5 (Era)</span>
                             <span>= <strong className="text-yellow-500">1.8x (Geometric)</strong></span>
                        </div>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                             <div className="text-[10px] font-bold text-yellow-600 uppercase">Final Payout</div>
                             <div className="text-3xl font-black text-yellow-500">180 Cr</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
