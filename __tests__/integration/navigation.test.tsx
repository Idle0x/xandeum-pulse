import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../src/pages/index';
import '@testing-library/jest-dom';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mocked'),
}));

const mockPush = jest.fn();
let mockQuery = {};

jest.mock('next/router', () => ({
  useRouter() {
    return {
      query: mockQuery,
      push: mockPush,
      replace: jest.fn(),
      pathname: '/',
      asPath: '/',
      events: { on: jest.fn(), off: jest.fn() },
    };
  },
}));

const SAMPLE_NODE = {
  pubkey: '8xTestNodeKey123',
  address: '1.2.3.4:6000',
  version: '1.5.0',
  uptime: 900000,
  storage_committed: 1000 * (1024**3),
  storage_used: 500 * (1024**3),
  credits: 50000,
  health: 98,
  network: 'MAINNET',
  is_public: true,
  location: { countryName: 'Japan', countryCode: 'JP' },
  healthBreakdown: { uptime: 98, version: 100, reputation: 90, storage: 90 }
};

const MOCK_API_RESPONSE = {
  data: {
    result: { pods: [SAMPLE_NODE] },
    stats: { 
      consensusVersion: '1.5.0', 
      totalNodes: 1, 
      avgBreakdown: { total: 85 },
      medianStorage: 800 * (1024**3)
    }
  }
};

describe('Xandeum Pulse - Inspector Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
    mockedAxios.get.mockResolvedValue(MOCK_API_RESPONSE);
  });

  test('DASHBOARD AUTO-OPEN: Should find visible Header in dual-layout', async () => {
    mockQuery = { open: '8xTestNodeKey123' };
    await act(async () => { render(<Home />); });

    await waitFor(() => { 
        const headers = screen.getAllByText('NODE INSPECTOR');
        // Your code has hidden/flex logic; we ensure at least one is present
        expect(headers.length).toBeGreaterThan(0);
    });

    // Validates the sliced pubkey logic in your Header
    expect(screen.getAllByText(/8xTestNodeKey/i).length).toBeGreaterThan(0);
  });

  test('REPUTATION LINK: Navigates to leaderboard via card click', async () => {
    await act(async () => { render(<Home />); });
    fireEvent.click((await screen.findAllByText(/1.2.3.4/))[0].closest('.group')!);

    // Selector updated to match your new Reputation Card structure
    const repCard = screen.getAllByText('REPUTATION').find(el => el.closest('div[onClick]'));
    if (repCard) fireEvent.click(repCard.closest('div[onClick]')!);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/leaderboard?highlight=8xTestNodeKey123'));
  });

  test('API STATUS: Shows "API OFFLINE" when credits are null', async () => {
    const OFFLINE_NODE = { ...SAMPLE_NODE, credits: null };
    mockedAxios.get.mockResolvedValue({
      data: { result: { pods: [OFFLINE_NODE] }, stats: MOCK_API_RESPONSE.data.stats }
    });

    await act(async () => { render(<Home />); });
    fireEvent.click((await screen.findAllByText(/1.2.3.4/))[0].closest('.group')!);

    expect(await screen.findAllByText(/API OFFLINE/i)).not.toHaveLength(0);
  });
});
