import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MapPage from '../../src/pages/map';
import '@testing-library/jest-dom';
import axios from 'axios';

// --- MOCKS ---

// 1. Mock Next Router to simulate Deep Links
const mockPush = jest.fn();
let mockQuery = {};
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/map',
      pathname: '/map',
      query: mockQuery,
      asPath: '/map',
      push: mockPush,
      isReady: true,
    };
  },
}));

// 2. Mock Axios for client-side fetching
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 3. Mock react-simple-maps (UI Library)
// FIX: We use <svg> for ComposableMap to prevent console warnings about <circle>/<g> tags
jest.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: any) => <svg data-testid="geo-map">{children}</svg>,
  ZoomableGroup: ({ children }: any) => <g>{children}</g>,
  Geographies: ({ children }: any) => <g>{children({ geographies: [] })}</g>,
  Geography: () => <path />,
  Marker: ({ onClick, children }: any) => <g data-testid="map-marker" onClick={onClick}>{children}</g>
}));

// 4. Mock d3-scale to bypass ESM errors
jest.mock('d3-scale', () => ({
  scaleSqrt: () => ({
    domain: () => ({
      range: () => () => 10 // Returns a function that always sets circle size to 10px
    })
  })
}));

describe('Map Page - UI & Deep Linking', () => {

  const MOCK_GEO_DATA = {
    locations: [
      {
        name: 'Berlin',
        country: 'Germany',
        lat: 52, lon: 13,
        count: 5,
        totalStorage: 100,
        totalCredits: 5000,
        ips: ['1.2.3.4'] // Target IP
      }
    ],
    stats: { totalNodes: 5, countries: 1, topRegion: 'Berlin' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: MOCK_GEO_DATA });
    mockQuery = {};
  });

  test('RENDERING: Should display region list and stats', async () => {
    render(<MapPage />);

    // Wait for data load
    await waitFor(() => expect(screen.getByText('Berlin, Germany')).toBeInTheDocument());

    // Check dynamic title (Germany appears in title AND list, so we check for length)
    const germanyTexts = screen.getAllByText(/Germany/);
    expect(germanyTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/Leads Storage/)).toBeInTheDocument();
  });

  test('DEEP LINKING: Should lock onto target IP from URL', async () => {
    // Simulate user arriving with ?focus=1.2.3.4
    mockQuery = { focus: '1.2.3.4' };

    render(<MapPage />);

    await waitFor(() => {
        // We check if the marker became "active" or the Berlin card is highlighted
        const berlinItem = screen.getByText('Berlin, Germany').closest('.group');
        expect(berlinItem).toHaveClass('bg-zinc-800'); // Active class check
    });
  });

  test('VIEW TOGGLE: Should switch between Storage, Credits, and Health', async () => {
    render(<MapPage />);
    await waitFor(() => expect(screen.getByText('Berlin, Germany')).toBeInTheDocument());

    // FIX: "CREDITS" appears multiple times (mobile/desktop toggles). We click the first one.
    const creditsBtns = screen.getAllByText('CREDITS');
    fireEvent.click(creditsBtns[0]);

    // Title should update
    await waitFor(() => expect(screen.getByText(/Tops Network Earnings/)).toBeInTheDocument());
  });
});
