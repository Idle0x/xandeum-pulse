import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../pages/index';
import '@testing-library/jest-dom';
import axios from 'axios';

// --- MOCKING THE WORLD ---

// 1. Mock Axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 2. Mock GeoIP
jest.mock('geoip-lite', () => ({
  lookup: jest.fn().mockReturnValue({ ll: [0, 0], country: 'US', city: 'Test City' }),
}));

// 3. Mock Next.js Router
const mockPush = jest.fn();
let mockQuery = {};

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: mockQuery,
      asPath: '',
      push: mockPush,
      replace: jest.fn(),
      events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    };
  },
}));

// --- TEST DATA GENESIS ---

const SAMPLE_NODE = {
  pubkey: '8xTestNodeKey123',
  address: '192.168.1.1:6000',
  version: '1.5.0',
  uptime: 900000,
  storage_committed: 1000,
  storage_used: 500,
  credits: 50000,
  health: 98,
  network: 'MAINNET',
  is_public: true,
  location: { countryName: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35, lon: 139 },
  healthBreakdown: { uptime: 98, version: 100, reputation: 90, storage: 90 }
};

const PRIVATE_NODE = {
  ...SAMPLE_NODE,
  pubkey: 'GhostNodeVPN',
  is_public: false,
  location: { countryName: 'Unknown', countryCode: 'XX', city: 'Hidden', lat: 0, lon: 0 }
};

const MOCK_API_RESPONSE = {
  data: {
    result: { pods: [SAMPLE_NODE, PRIVATE_NODE] },
    stats: { consensusVersion: '1.5.0', totalNodes: 2, systemStatus: { credits: true } }
  }
};

describe('Xandeum Pulse - Integration & Deep Linking', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
    mockedAxios.get.mockResolvedValue(MOCK_API_RESPONSE);

    // BYPASS WELCOME CURTAIN
    localStorage.setItem('xandeum_pulse_welcome_v1', 'true');
  });

  // =========================================================
  // SCENARIO 1: DEEP LINKING (Teleportation)
  // =========================================================

  test('DASHBOARD AUTO-OPEN: Should open modal if URL has ?open=PUBKEY', async () => {
    mockQuery = { open: '8xTestNodeKey123' };

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('NODE INSPECTOR')).toBeVisible();
    });

    expect(screen.getByText(/8xTestNodeKey123/)).toBeInTheDocument();
  });

  // =========================================================
  // SCENARIO 2: NAVIGATION FLOWS
  // =========================================================

  test('LEADERBOARD LINK: Should generate precise 3-system link', async () => {
    await act(async () => {
      render(<Home />);
    });

    const nodeCard = await screen.findByText(/8xTestNodeKey123/); 
    fireEvent.click(nodeCard.closest('.group')!); 

    const repCard = screen.getByText('REPUTATION').closest('div');
    fireEvent.click(repCard!);

    // VERIFY ALL 3 PARAMETERS ARE PRESENT (Identity Precision)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/leaderboard'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('highlight=8xTestNodeKey123'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('network=MAINNET')); 
    // Address check (URL encoded or plain)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('focusAddr=')); 
  });

  // =========================================================
  // SCENARIO 3: GHOST PROTOCOLS
  // =========================================================

  test('GHOST NODE: Private nodes should link to map but handle privacy', async () => {
    await act(async () => {
      render(<Home />);
    });

    const ghostCardText = await screen.findByText(/GhostNodeVPN/); 
    fireEvent.click(ghostCardText.closest('.group')!);

    const mapCard = screen.getByText('PHYSICAL LAYER').closest('div');
    const linkElement = mapCard?.closest('a');
    expect(linkElement).toHaveAttribute('href', '/map?focus=192.168.1.1'); 
  });

  // =========================================================
  // SCENARIO 4: CRASH RESISTANCE
  // =========================================================

  test('API FAILURE: Should display "CREDITS API OFFLINE" badge if API fails', async () => {
    const OFFLINE_NODE = { ...SAMPLE_NODE, credits: null, isUntracked: false };
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [OFFLINE_NODE] },
        stats: { systemStatus: { credits: false } }
      }
    });

    await act(async () => {
      render(<Home />);
    });

    const card = await screen.findByText(/8xTestNode/);
    fireEvent.click(card.closest('.group')!);

    // Check for badge occurrence
    const badges = await screen.findAllByText(/API OFFLINE/i);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toBeInTheDocument();
  });

  // =========================================================
  // SCENARIO 5: PRECISION TARGETING (The Identity Crisis Fix)
  // =========================================================

  test('IDENTITY CRISIS: Should distinguish between Mainnet/Devnet siblings with same Pubkey', async () => {
    // 1. Create Sibling Nodes (Same Pubkey, Different Network/IP)
    const MAINNET_NODE = { ...SAMPLE_NODE, network: 'MAINNET', address: '1.1.1.1:6000' };
    const DEVNET_NODE = { ...SAMPLE_NODE, network: 'DEVNET', address: '2.2.2.2:6000' };
    
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [MAINNET_NODE, DEVNET_NODE] },
        stats: { systemStatus: { credits: true } }
      }
    });

    // 2. Target the DEVNET sibling specifically using the new 3-System Params
    mockQuery = { 
      open: SAMPLE_NODE.pubkey, 
      network: 'DEVNET', 
      focusAddr: '2.2.2.2' 
    };

    await act(async () => {
      render(<Home />);
    });

    // 3. Verify the Modal opened
    await waitFor(() => expect(screen.getByText('NODE INSPECTOR')).toBeVisible());

    // 4. CRITICAL CHECK: Ensure the "DEVNET" badge is visible, NOT Mainnet
    // This confirms the dashboard filtered strictly and didn't just grab the first node with the Pubkey
    expect(screen.getByText('DEVNET NETWORK')).toBeVisible();
    expect(screen.queryByText('MAINNET NETWORK')).toBeNull();
    
    // 5. Verify IP specific match
    expect(screen.getByText('2.2.2.2')).toBeVisible();
  });

});