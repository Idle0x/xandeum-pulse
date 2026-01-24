import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../src/pages/index';
import '@testing-library/jest-dom';
import axios from 'axios';

// --- MOCKS ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Bypass the Curtain to reach the dashboard instantly
jest.mock('../../src/components/WelcomeCurtain', () => ({
  WelcomeCurtain: () => <div data-testid="curtain-mocked" />
}));

// Mock the Database History hooks to avoid Supabase connection errors
jest.mock('../../src/hooks/useNetworkHistory', () => ({
  useNetworkHistory: () => ({
    history: [],
    growth: 5,
    loading: false
  })
}));

jest.mock('../../src/hooks/useNodeHistory', () => ({
  useNodeHistory: () => ({
    history: [],
    reliabilityScore: 100,
    growth: 0,
    loading: false
  })
}));

const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      query: {},
      push: mockPush,
      replace: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    };
  },
}));

const SAMPLE_NODE = {
  pubkey: '8xTestNodeKey123',
  address: '1.2.3.4:6000',
  version: '1.5.0',
  credits: 50000,
  health: 98,
  network: 'MAINNET',
  storage_committed: 1000,
  last_seen_timestamp: Date.now(),
  isUntracked: false, // Ensure defaults
};

describe('Xandeum Pulse - Inspector Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [SAMPLE_NODE] },
        stats: { consensusVersion: '1.5.0', avgBreakdown: { total: 80 } }
      }
    });
  });

  test('REPUTATION LINK: Navigates to leaderboard', async () => {
    await act(async () => { render(<Home />); });

    const nodeCardText = await screen.findByText(/1.2.3.4/);
    fireEvent.click(nodeCardText.closest('div')!);

    const repLabels = await screen.findAllByText('REPUTATION');
    fireEvent.click(repLabels[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('highlight=8xTestNodeKey123'));
    });
  });

  test('API STATUS: Shows offline badge', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        // Explicitly set isUntracked: false so the logic falls through to credits: null
        result: { pods: [{ ...SAMPLE_NODE, credits: null, isUntracked: false }] },
        stats: { systemStatus: { credits: false } }
      }
    });

    await act(async () => { render(<Home />); });

    // Find card and open modal
    const nodeCardText = await screen.findByText(/1.2.3.4/);
    fireEvent.click(nodeCardText.closest('div')!);

    // Check for "API OFFLINE" 
    await waitFor(() => {
      const offlineBadges = screen.getAllByText(/API OFFLINE/i);
      expect(offlineBadges.length).toBeGreaterThan(0);
    });
  });
});
