import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../src/pages/index'; // ✅ Updated Path
import '@testing-library/jest-dom';
import axios from 'axios';

// --- MOCKING THE WORLD ---

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ✅ NEW: Mock html-to-image to prevent Canvas errors in the ShareProof component
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mocked'),
}));

jest.mock('geoip-lite', () => ({
  lookup: jest.fn().mockReturnValue({ ll: [0, 0], country: 'US', city: 'Test City' }),
}));

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

// --- TEST DATA ---

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
  // Optional: Mock the breakdown if your logic requires it
  healthBreakdown: { uptime: 98, version: 100, reputation: 90, storage: 90 },
  clusterStats: { totalGlobal: 1, mainnetCount: 1, devnetCount: 0 }
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
    localStorage.setItem('xandeum_favorites', '[]');
  });

  // =========================================================
  // SCENARIO 1: DEEP LINKING
  // =========================================================

  test('DASHBOARD AUTO-OPEN: Should open modal if URL has ?open=PUBKEY', async () => {
    mockQuery = { open: '8xTestNodeKey123' };
    await act(async () => { render(<Home />); });
    
    // The Modal Header contains "NODE INSPECTOR"
    await waitFor(() => { expect(screen.getByText('NODE INSPECTOR')).toBeVisible(); });
    // The Modal should show the truncated key or full key depending on your view
    expect(screen.getByText(/8xTestNodeKey123/)).toBeInTheDocument();
  });

  // =========================================================
  // SCENARIO 2: CARD INTERACTION
  // =========================================================

  test('CLICK CARD: Clicking a node card should open the Inspector', async () => {
    await act(async () => { render(<Home />); });
    
    // Find the card by its IP or Key and click it
    const nodeCard = await screen.findByText(/192.168.1.1/); 
    fireEvent.click(nodeCard);

    await waitFor(() => { 
        expect(screen.getByText('NODE INSPECTOR')).toBeVisible(); 
    });
  });

  // =========================================================
  // SCENARIO 3: NAVIGATION FLOWS
  // =========================================================

  test('LEADERBOARD LINK: Should generate precise 3-system link', async () => {
    await act(async () => { render(<Home />); });

    // Open Modal
    const nodeCard = await screen.findByText(/8xTestNodeKey123/); 
    fireEvent.click(nodeCard.closest('div')!); // Adjusted selector

    // Click Reputation Card in Modal
    const repCard = screen.getByText('REPUTATION').closest('div');
    fireEvent.click(repCard!);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/leaderboard'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('highlight=8xTestNodeKey123'));
  });

  // =========================================================
  // SCENARIO 4: CRASH RESISTANCE
  // =========================================================

  test('API FAILURE: Should handle nodes with missing credits gracefully', async () => {
    const OFFLINE_NODE = { ...SAMPLE_NODE, credits: null };
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [OFFLINE_NODE] },
        stats: { systemStatus: { credits: false } }
      }
    });
    
    await act(async () => { render(<Home />); });
    
    // It should render "CREDITS API OFFLINE" or similar text you defined
    const badges = await screen.findAllByText(/CREDITS API OFFLINE/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  // =========================================================
  // SCENARIO 5: FILTERING
  // =========================================================

  test('SEARCH: Typing should filter nodes', async () => {
    await act(async () => { render(<Home />); });
    
    const searchInput = screen.getByPlaceholderText(''); // Your input has empty placeholder
    fireEvent.change(searchInput, { target: { value: 'GhostNodeVPN' } });

    // Should show the Ghost node
    expect(await screen.findByText(/GhostNodeVPN/)).toBeInTheDocument();
    // Should NOT show the Sample node
    expect(screen.queryByText(/8xTestNodeKey123/)).not.toBeInTheDocument();
  });

});
