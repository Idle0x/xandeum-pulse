import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../src/pages/index';
import '@testing-library/jest-dom';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  test('REPUTATION LINK: Navigates to leaderboard via card click', async () => {
    await act(async () => { render(<Home />); });

    // Open Modal
    const nodeCard = await screen.findByText(/1.2.3.4/);
    fireEvent.click(nodeCard.closest('.group')!);

    // Find the Reputation container. In your code, handleLeaderboardNav is 
    // attached to the wrapper div.
    const repHeader = await screen.findByText('REPUTATION');
    const clickableContainer = repHeader.closest('div[onClick]');
    
    expect(clickableContainer).not.toBeNull();
    fireEvent.click(clickableContainer!);

    // Final check for navigation
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('highlight=8xTestNodeKey123'));
    });
  });

  test('API STATUS: Shows "API OFFLINE" when credits are null', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        result: { pods: [{ ...SAMPLE_NODE, credits: null }] },
        stats: { systemStatus: { credits: false } }
      }
    });

    await act(async () => { render(<Home />); });
    fireEvent.click((await screen.findByText(/1.2.3.4/)).closest('.group')!);

    const offlineText = await screen.findAllByText(/API OFFLINE/i);
    expect(offlineText.length).toBeGreaterThan(0);
  });
});
