import { Database, HardDrive, Activity, Zap, Clock } from 'lucide-react';
import { Node } from '../types';
import { formatBytes, formatUptime, formatLastSeen } from '../utils/formatters';

export const useCardCycle = (node: Node, step: number, zenMode: boolean, sortBy: string = '') => {

  // --- FIX: REMOVED HARD OVERRIDES ---
  // Previously, checking (sortBy === 'storage') here locked the card 
  // to that metric forever, ignoring the timer. 
  // We now trust the 'step' prop, which Home.tsx automatically 
  // snaps to the correct starting point when you sort.

  const currentStep = step % 5;

  if (currentStep === 0) {
    return {
      label: 'Storage Used',
      value: formatBytes(node.storage_used),
      color: zenMode ? 'text-zinc-300' : 'text-blue-400',
      icon: Database
    };
  }

  if (currentStep === 1) {
    return {
      label: 'Committed',
      value: formatBytes(node.storage_committed || 0),
      color: zenMode ? 'text-zinc-300' : 'text-purple-400',
      icon: HardDrive
    };
  }

  if (currentStep === 2) {
    const score = node.health || 0;
    return {
      label: 'Health Score',
      value: `${score}/100`,
      color: score > 80 ? 'text-green-400' : 'text-yellow-400',
      icon: Activity
    };
  }

  if (currentStep === 3) {
    return {
      label: 'Continuous Uptime',
      value: formatUptime(node.uptime),
      color: 'text-orange-400',
      icon: Zap
    };
  }

  // Default / Step 4
  return {
    label: 'Last Seen',
    value: formatLastSeen(node.last_seen_timestamp),
    color: 'text-zinc-400',
    icon: Clock
  };
};
