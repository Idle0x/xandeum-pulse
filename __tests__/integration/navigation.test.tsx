import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../src/pages/index';
import '@testing-library/jest-dom';
import axios from 'axios';

// --- MOCKING THE WORLD ---

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

    // UPDATED: Use getAllByText because Header exists twice (Mobile/Desktop)
    await waitFor(() => { 
        const headers = screen.getAllByText('NODE INSPECTOR');
        expect(headers.length).toBeGreaterThan(0);
        expect(headers[0]).toBeInTheDocument();
    });

    const keys = screen.getAllByText(/8xTestNodeKey123/);
    expect(keys.length).toBeGreaterThan(0);
  });

  // =========================================================
  // SCENARIO 2: CARD INTERACTION
  // =========================================================

  test('CLICK CARD: Clicking a node card should open the Inspector', async () => {
    await act(async () => { render(<Home />); });

    const nodeCards = await screen.findAllByText(/192.168.1.1/);
    const clickableCard = nodeCards[0].closest('div[onClick]') || nodeCards[0].closest('.group');

    if (clickableCard) {
      fireEvent.click(clickableCard);
    } else {
      fireEvent.click(nodeCards[0]); 
    }

    // UPDATED: Handle duplicate headers
    await waitFor(() => { 
        const headers = screen.getAllByText('NODE INSPECTOR');
        expect(headers[0]).toBeVisible(); 
    });
  });

  // =========================================================
  // SCENARIO 3: NAVIGATION FLOWS
  // =========================================================

  test('LEADERBOARD LINK: Should generate precise 3-system link', async () => {
    await act(async () => { render(<Home />); });

    // Open Modal
    const nodeCards = await screen.findAllByText(/8xTestNodeKey123/); 
    fireEvent.click(nodeCards[0].closest('.group')!); 

    // Find the Reputation Card inside the modal
    // Note: 'REPUTATION' text might appear in the grid view (Mobile or Desktop)
    const repTexts = await screen.findAllByText('REPUTATION');
    
    // Find the one that is inside a clickable container (the card)
    const clickableRepCard = repTexts.find(el => el.closest('div[onClick]'));

    if (clickableRepCard) {
        fireEvent.click(clickableRepCard.closest('div[onClick]')!);
    } else {
        // Fallback: try clicking the first one found if structure is different
        fireEvent.click(repTexts[0]);
    }

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/leaderboard'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('highlight=8xTestNodeKey123'));
  });

  // =========================================================
  // SCENARIO 4: CRASH RESISTANCE
  // =========================================================

  test('API FAILURE: Should handle nodes with missing credits gracefully', async () => {
    const OFFLINE_NODE = { ...SAMPLE_NODE, credits: null, isUntracked: false };
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [OFFLINE_NODE] },
        stats: { systemStatus: { credits: false } }
      }
    });

    await act(async () => { render(<Home />); });

    // Open Modal
    const cards = await screen.findAllByText(/8xTestNode/);
    fireEvent.click(cards[0].closest('.group')!);

    // Look for the offline badge text we added
    const badges = await screen.findAllByText(/API OFFLINE/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  // =========================================================
  // SCENARIO 5: FILTERING
  // =========================================================

  test('SEARCH: Typing should filter nodes', async () => {
    await act(async () => { render(<Home />); });

    const inputs = screen.getAllByPlaceholderText(''); 
    const searchInput = inputs.find(i => i.tagName === 'INPUT');

    if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'GhostNodeVPN' } });
    }

    const ghostTexts = await screen.findAllByText(/GhostNodeVPN/);
    expect(ghostTexts.length).toBeGreaterThan(0);

    expect(screen.queryByText(/8xTestNodeKey123/)).not.toBeInTheDocument();
  });

  // =========================================================
  // SCENARIO 6: IDENTITY CRISIS
  // =========================================================

  test('IDENTITY CRISIS: Should distinguish between Mainnet/Devnet siblings', async () => {
    const MAINNET_NODE = { ...SAMPLE_NODE, network: 'MAINNET', address: '1.1.1.1:6000', version: '1.0.0' };
    const DEVNET_NODE = { ...SAMPLE_NODE, network: 'DEVNET', address: '2.2.2.2:6000', version: '9.9.9-DEV' };

    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [MAINNET_NODE, DEVNET_NODE] },
        stats: { systemStatus: { credits: true } }
      }
    });

    // Request Devnet specific
    mockQuery = { open: SAMPLE_NODE.pubkey, network: 'DEVNET', focusAddr: '2.2.2.2:6000' };

    await act(async () => { render(<Home />); });

    // UPDATED: Handle duplicate headers
    await waitFor(() => {
        const headers = screen.getAllByText('NODE INSPECTOR');
        expect(headers[0]).toBeVisible();
    });

    // Check that we loaded the DEV version
    const versionBadges = screen.getAllByText('9.9.9-DEV');
    expect(versionBadges.length).toBeGreaterThan(0);
  });

});
