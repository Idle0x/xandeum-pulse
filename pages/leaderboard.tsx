{simStep === 2 && (
    <div className="p-4 md:p-8 animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="mb-6 text-center">
            <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Step 3: Income</h3>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-1">Estimate Network Share</p>
        </div>
        <div className="max-w-xl mx-auto space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- INPUT 1: NETWORK FEES --- */}
                <div className="relative">
                    {/* CLICK-AWAY SHIELD FOR FEE HELP */}
                    {showFeeHelp && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFeeHelp(false)}></div>}
                    
                    <div className="flex justify-between items-end mb-2 relative z-50">
                        <div className="flex items-center gap-2">
                        <label className={`text-[10px] uppercase font-bold ${simNetworkFees <= 0 ? 'text-red-500' : 'text-zinc-400'}`}>Total Network Fees</label>
                        <div className="relative">
                            <button onClick={() => setShowFeeHelp(!showFeeHelp)} className="text-zinc-500 hover:text-white transition"><Info size={14} /></button>
                            {showFeeHelp && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                    <p className="text-[10px] md:text-xs text-zinc-300 leading-relaxed"><strong className="text-white block mb-1">About Network Fees:</strong>Revenue collected from sedApps. <span className="text-yellow-500 block mt-1">94% is distributed to pNode owners.</span></p>
                                    <div className="absolute bottom-[-6px] left-1 w-3 h-3 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="number" min="0" value={simNetworkFees} onChange={(e) => setSimNetworkFees(Number(e.target.value))} className={`w-full bg-zinc-900 border rounded-xl p-3 text-[12px] md:text-sm text-white font-mono outline-none transition ${simNetworkFees <= 0 ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-blue-500'}`}/>
                        <span className="absolute right-4 top-3.5 text-[10px] font-bold text-zinc-600">SOL</span>
                    </div>
                    {/* SUBTITLE ADDED HERE */}
                    <p className="text-[10px] text-zinc-500 italic mt-2 ml-1">
                        Enter the total SOL revenue generated from network traffic & usage.
                    </p>
                </div>

                {/* --- INPUT 2: MULTIPLIER --- */}
                <div className="relative">
                    {/* CLICK-AWAY SHIELD FOR NETWORK HELP */}
                    {showNetworkHelp && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNetworkHelp(false)}></div>}
                    
                    <div className="flex justify-between items-end mb-2 relative z-50">
                        <div className="flex items-center gap-2">
                        <label className={`text-[10px] uppercase font-bold ${networkAvgMult < 1 ? 'text-red-500' : 'text-zinc-400'}`}>Est. Total Boosted Credits</label>
                        <div className="relative">
                            <button onClick={() => setShowNetworkHelp(!showNetworkHelp)} className="text-zinc-500 hover:text-white transition"><Settings2 size={14} /></button>
                            {showNetworkHelp && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                    <p className="text-[10px] md:text-xs text-zinc-300 leading-relaxed"><strong className="text-white block mb-1">Estimation Multiplier</strong>Factor to estimate Total Network Boosted Credits. <span className="text-yellow-500 block mt-1">14x accounts for high-impact nodes.</span></p>
                                    <div className="absolute bottom-[-6px] left-1 w-3 h-3 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="number" min="0" step="0.1" value={networkAvgMult} onChange={(e) => { const val = e.target.value === '' ? 0 : Number(e.target.value); setNetworkAvgMult(val); }} className={`w-full bg-zinc-900 border rounded-xl p-3 text-[12px] md:text-sm text-white font-mono outline-none transition ${networkAvgMult < 1 ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-purple-500'}`}/>
                        <span className="absolute right-4 top-3.5 text-[10px] font-bold text-zinc-600">AVG X</span>
                    </div>
                    {/* SUBTITLE ADDED HERE */}
                    <p className="text-[10px] text-zinc-500 italic mt-2 ml-1 leading-relaxed">
                        Enter multiplier to estimate global score. <br />
                        <span className="font-mono not-italic text-zinc-600">(Total Network Credits × Multiplier)</span>
                    </p>
                </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/30 rounded-xl md:rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col items-center text-center space-y-4 md:space-y-6">
                    <div>
                        <div className="text-[9px] md:text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Your Share</div>
                        <div className="text-sm md:text-lg font-mono text-zinc-300">{(metrics.share * 100).toFixed(6)}%</div>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                    <div>
                        <div className="text-[10px] md:text-xs text-yellow-600 font-bold uppercase tracking-widest mb-2">Estimated Payout</div>
                        <div className="text-4xl md:text-6xl font-extrabold text-white text-shadow-lg tracking-tight flex items-baseline justify-center gap-2">{metrics.stoinc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}<span className="text-sm md:text-lg font-bold text-zinc-500">SOL</span></div>
                        <div className="text-[9px] md:text-[10px] text-zinc-500 mt-2">Per Epoch (~2 Days)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
