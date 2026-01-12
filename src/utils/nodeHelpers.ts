import { Node } from '../types';

export const getSafeIp = (node: Node | null) => {
  return node?.address ? node.address.split(':')[0] : 'Unknown IP';
};

export const getSafeVersion = (node: Node | null) => {
  return node?.version || 'Unknown';
};

export const compareVersions = (v1: string = '0.0.0', v2: string = '0.0.0') => {
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

// Added specifically for InspectorModal
export const checkIsLatest = (nodeVersion: string | null | undefined, consensusVersion: string) => {
  const cleanVer = (nodeVersion || '').replace(/[^0-9.]/g, '');
  const cleanConsensus = consensusVersion.replace(/[^0-9.]/g, '');
  return cleanVer === cleanConsensus || compareVersions(cleanVer, cleanConsensus) > 0;
};
