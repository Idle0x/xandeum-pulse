// src/hooks/useStoincSimulator.ts
import { useState, useEffect, useRef, useMemo } from 'react';
import { calculateStoinc } from '../lib/xandeum-economics'; // Ensure this path matches your repo
import { RankedNode, StoincMetrics } from '../types/leaderboard';

export const useStoincSimulator = (allNodes: RankedNode[]) => {
  // --- VISIBILITY & STEP STATE ---
  const [showSim, setShowSim] = useState(false);
  const [simStep, setSimStep] = useState(0); 
  
  // --- MODE STATE ---
  const [simMode, setSimMode] = useState<'NEW' | 'IMPORT'>('NEW');
  const [showManualInput, setShowManualInput] = useState(false);

  // --- STEP 1: INPUTS ---
  const [importKey, setImportKey] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [autoPilotCountdown, setAutoPilotCountdown] = useState<number | null>(null);

  // Manual Configuration
  const [simNodes, setSimNodes] = useState<number>(1);
  const [simStorageVal, setSimStorageVal] = useState<number>(100); 
  const [simStorageUnit, setSimStorageUnit] = useState<'MB' | 'GB' | 'TB' | 'PB'>('GB'); 
  const [simStake, setSimStake] = useState<number>(1000); 
  const [simPerf, setSimPerf] = useState<number>(1.0);
  const [importedBaseCredits, setImportedBaseCredits] = useState<number>(0);

  // --- STEP 2: BOOSTS ---
  const [boostCounts, setBoostCounts] = useState<Record<string, number>>({});

  // --- STEP 3: FINANCIALS ---
  const [simNetworkFees, setSimNetworkFees] = useState<number>(100); 
  const [networkAvgMult, setNetworkAvgMult] = useState<number>(14); 

  // --- INTERNAL REFS ---
  // Tracks config changes to reset boosts if user changes their fleet setup
  const lastStep1Config = useRef<string>('');

  // --- HELPER: RESET LOGIC ON STEP CHANGE ---
  const handleStepTransition = (nextStep: number) => {
    if (simStep === 0 && nextStep === 1) {
        const currentConfig = simMode === 'IMPORT' 
            ? `IMPORT_${importKey.trim()}`
            : `NEW_${simNodes}_${simStorageVal}_${simStorageUnit}_${simPerf}_${simStake}`;

        if (lastStep1Config.current && lastStep1Config.current !== currentConfig) {
            setBoostCounts({});
        }
        lastStep1Config.current = currentConfig;
    }
    setSimStep(nextStep);
  };

  // Reset transient states when navigating
  useEffect(() => {
    if (simStep === 0) {
      setImportSuccess(false);
      setAutoPilotCountdown(null);
    }
  }, [simStep]);

  // --- AUTOPILOT TIMER ---
  useEffect(() => {
    if (autoPilotCountdown === null) return;
    if (autoPilotCountdown <= 0) {
      handleStepTransition(1);
      setAutoPilotCountdown(null);
      return;
    }
    const timer = setTimeout(() => setAutoPilotCountdown(autoPilotCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoPilotCountdown]);

  // --- ACTIONS ---
  const clearImport = () => {
    setImportKey('');
    setImportSuccess(false);
    setSimMode('NEW');
    setImportedBaseCredits(0);
    setImportError(null);
    setAutoPilotCountdown(null);
  };

  const handleImportNode = (keyToImport?: string) => {
    setImportError(null);
    setImportSuccess(false);
    const key = keyToImport || importKey.trim();

    if (!key) { setImportError("Please enter a public key."); return; }
    
    const node = allNodes.find(n => n.pubkey === key);
    if (node) {
        setImportKey(key);
        setImportSuccess(true);
        setSimMode('IMPORT');
        setImportedBaseCredits(node.credits);
        setAutoPilotCountdown(3); 
    } else {
        setImportError("Key not found in active leaderboard.");
    }
  };

  const toggleBoostCount = (name: string, delta: number) => {
      const current = boostCounts[name] || 0;
      const next = Math.max(0, current + delta);
      setBoostCounts({...boostCounts, [name]: next});
  };

  // Called from the Node Table "Use in Sim" button
  const loadNodeIntoSim = (nodeKey: string) => {
      setShowSim(true);
      setSimStep(0);
      handleImportNode(nodeKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSimulator = () => {
      setSimStep(0); 
      setBoostCounts({}); 
      clearImport(); 
      setShowManualInput(false); 
      setSimPerf(1.0);
  };

  // --- CALCULATIONS ---
  const metrics: StoincMetrics = useMemo(() => {
      const currentNetworkTotal = allNodes.reduce((sum, n) => sum + n.credits, 0);
      const result = calculateStoinc({
          storageVal: simStorageVal,
          storageUnit: simStorageUnit,
          nodeCount: simMode === 'IMPORT' ? 1 : simNodes, 
          performance: simPerf,
          stake: simStake,
          boosts: boostCounts,
          networkTotalBase: currentNetworkTotal,
          networkAvgMult: networkAvgMult,
          networkFees: simNetworkFees
      });
      const rawCredits = simMode === 'IMPORT' ? importedBaseCredits : result.userBaseCredits;
      const boostedCredits = simMode === 'IMPORT' ? (importedBaseCredits * result.geoMean) : result.boostedCredits;
      const estimatedNetworkBoostedTotal = (currentNetworkTotal * networkAvgMult) + (simMode === 'NEW' ? boostedCredits : 0);
      const share = estimatedNetworkBoostedTotal > 0 ? boostedCredits / estimatedNetworkBoostedTotal : 0;
      const stoinc = simNetworkFees * 0.94 * share;

      return { rawCredits, geoMean: result.geoMean, boostedCredits, share, stoinc, currentNetworkTotal };
  }, [simStorageVal, simStorageUnit, simNodes, simPerf, simStake, boostCounts, allNodes, networkAvgMult, simNetworkFees, simMode, importedBaseCredits]);

  const isStep1Valid = simMode === 'IMPORT' ? importedBaseCredits > 0 : simNodes >= 1;

  return {
    // State
    showSim, setShowSim,
    simStep, setSimStep,
    simMode, setSimMode,
    showManualInput, setShowManualInput,
    importKey, setImportKey,
    importError, setImportError,
    importSuccess, setImportSuccess,
    autoPilotCountdown, setAutoPilotCountdown,
    simNodes, setSimNodes,
    simStorageVal, setSimStorageVal,
    simStorageUnit, setSimStorageUnit,
    simStake, setSimStake,
    simPerf, setSimPerf,
    importedBaseCredits,
    boostCounts,
    simNetworkFees, setSimNetworkFees,
    networkAvgMult, setNetworkAvgMult,
    // Computed
    metrics,
    isStep1Valid,
    // Actions
    clearImport,
    handleImportNode,
    handleStepTransition,
    toggleBoostCount,
    loadNodeIntoSim,
    resetSimulator
  };
};
