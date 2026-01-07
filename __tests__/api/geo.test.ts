import { createMocks } from 'node-mocks-http';
import handleGeoRequest from '../../pages/api/geo';
import * as XandeumBrain from '../../lib/xandeum-brain';

// Mock the brain to return controlled data
jest.mock('../../lib/xandeum-brain');

describe('Spatial Intelligence API (Geo Aggregation)', () => {

  const TOKYO_MAINNET_SMALL = {
    pubkey: 'TokyoSmall',
    address: '1.1.1.1:6000',
    network: 'MAINNET',
    storage_committed: 1000 * (1024**3), // 1 TB
    credits: 500,
    health: 90,
    is_public: true,
    location: { city: 'Tokyo', countryName: 'Japan', countryCode: 'JP', lat: 35, lon: 139 },
    uptime: 1000
  };

  const TOKYO_DEVNET_WHALE = {
    pubkey: 'TokyoWhale',
    address: '2.2.2.2:6000',
    network: 'DEVNET', // Different Network
    storage_committed: 5000 * (1024**3), // 5 TB (The King)
    credits: 100, // Lower credits
    health: 95,
    is_public: true,
    location: { city: 'Tokyo', countryName: 'Japan', countryCode: 'JP', lat: 35, lon: 139 },
    uptime: 2000
  };

  const GHOST_NODE = {
    pubkey: 'GhostVPN',
    address: '3.3.3.3:6000',
    location: { city: 'Hidden', countryName: 'Private', countryCode: 'XX', lat: 0, lon: 0 } // Invalid Coords
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('AGGREGATION: Should group nodes by City/Country', async () => {
    // @ts-ignore
    XandeumBrain.getNetworkPulse.mockResolvedValue({
      nodes: [TOKYO_MAINNET_SMALL, TOKYO_DEVNET_WHALE],
      stats: { totalNodes: 2 }
    });

    const { req, res } = createMocks({ method: 'GET' });
    await handleGeoRequest(req, res);

    const data = JSON.parse(res._getData());
    
    // Should have 1 location (Tokyo) containing 2 nodes
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0].name).toBe('Tokyo');
    expect(data.locations[0].count).toBe(2);
    expect(data.locations[0].totalStorage).toBe(6000); // 1TB + 5TB
  });

  test('KING SELECTION: Should identify specific King Node Address & Network', async () => {
    // This verifies your "PRECISION FIX" logic in the loop
    // @ts-ignore
    XandeumBrain.getNetworkPulse.mockResolvedValue({
      nodes: [TOKYO_MAINNET_SMALL, TOKYO_DEVNET_WHALE],
      stats: { totalNodes: 2 }
    });

    const { req, res } = createMocks({ method: 'GET' });
    await handleGeoRequest(req, res);
    const data = JSON.parse(res._getData());
    const tokyo = data.locations[0];

    // 1. Storage King should be the Devnet Whale (5TB)
    expect(tokyo.topPerformers.STORAGE.val).toBe(5000);
    expect(tokyo.topPerformers.STORAGE.pk).toBe('TokyoWhale');
    expect(tokyo.topPerformers.STORAGE.network).toBe('DEVNET'); // Precision check
    expect(tokyo.topPerformers.STORAGE.address).toBe('2.2.2.2:6000'); // Precision check

    // 2. Credits King should be the Mainnet Small (500 Cr)
    expect(tokyo.topPerformers.CREDITS.val).toBe(500);
    expect(tokyo.topPerformers.CREDITS.pk).toBe('TokyoSmall');
    expect(tokyo.topPerformers.CREDITS.network).toBe('MAINNET');
  });

  test('GHOST PROTOCOL: Should exclude nodes with 0,0 coordinates from Map', async () => {
    // @ts-ignore
    XandeumBrain.getNetworkPulse.mockResolvedValue({
      nodes: [TOKYO_MAINNET_SMALL, GHOST_NODE],
      stats: { totalNodes: 2 }
    });

    const { req, res } = createMocks({ method: 'GET' });
    await handleGeoRequest(req, res);
    const data = JSON.parse(res._getData());

    // Should only see Tokyo. The Ghost node is tracked in stats but hidden from locations.
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0].name).toBe('Tokyo');
  });
});
