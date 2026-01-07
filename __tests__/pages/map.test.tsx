import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MapPage from '../../pages/map';
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

// 3. IMPORTANT: Mock react-simple-maps
// Rendering D3 maps in JSDOM is flaky. We mock it to ensure the logic runs without SVG errors.
jest.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: any) => <div data-testid="geo-map">{children}</div>,
  ZoomableGroup: ({ children }: any) => <div>{children}</div>,
  Geographies: ({ children }: any) => <div>{children({ geographies: [] })}</div>, // Return empty geos
  Geography: () => <div />,
  Marker: ({ onClick, children }: any) => <div data-testid="map-marker" onClick={onClick}>{children}</div>
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
    
    // Check dynamic title
    expect(screen.getByText(/Germany/)).toBeInTheDocument();
    expect(screen.getByText(/Leads Storage/)).toBeInTheDocument();
  });

  test('DEEP LINKING: Should lock onto target IP from URL', async () => {
    // Simulate user arriving with ?focus=1.2.3.4
    mockQuery = { focus: '1.2.3.4' };
    
    render(<MapPage />);

    // Logic: 
    // 1. Page loads
    // 2. useEffect checks router.query.focus
    // 3. Matches IP '1.2.3.4' to 'Berlin'
    // 4. Sets 'activeLocation' to Berlin (triggers split view)

    await waitFor(() => {
        // If split view opens, the "Open Live Stats" button disappears or the list becomes visible
        // We check if the marker became "active" logic or if the specific Berlin card is highlighted
        const berlinItem = screen.getByText('Berlin, Germany').closest('.group');
        expect(berlinItem).toHaveClass('bg-zinc-800'); // Active class check
    });
  });

  test('VIEW TOGGLE: Should switch between Storage, Credits, and Health', async () => {
    render(<MapPage />);
    await waitFor(() => expect(screen.getByText('Berlin, Germany')).toBeInTheDocument());

    const creditsBtn = screen.getByText('CREDITS');
    fireEvent.click(creditsBtn);

    // Title should update
    await waitFor(() => expect(screen.getByText(/Tops Network Earnings/)).toBeInTheDocument());
  });
});
