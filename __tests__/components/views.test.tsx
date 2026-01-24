import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthView } from '../../src/components/modals/views/HealthView';
import { StorageView } from '../../src/components/modals/views/StorageView';
import { IdentityView } from '../../src/components/modals/views/IdentityView';

// --- POLYFILLS ---
// Fixes Recharts "width(0)" warnings in Jest/JSDOM by overriding the Recharts container
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <OriginalModule.ResponsiveContainer width={800} height={800}>
        {children}
      </OriginalModule.ResponsiveContainer>
    ),
  };
});

// ResizeObserver polyfill (still good to keep for other libs)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// --- MOCKS ---
jest.mock('../../src/hooks/useNodeHistory', () => ({
  useNodeHistory: () => ({
    history: [],
    reliabilityScore: 95,
    growth: 10,
    loading: false
  })
}));

const createMockNode = (overrides = {}) => ({
  pubkey: 'TestNode123',
  address: '1.2.3.4:6000',
  version: '1.5.0',
  uptime: 86400,
  storage_committed: 1000 * (1024**3), 
  storage_used: 500 * (1024**3), 
  credits: 5000,
  health: 95,
  network: 'MAINNET',
  is_public: true,
  healthBreakdown: { uptime: 95, version: 100, reputation: 90, storage: 95 },
  location: { countryName: 'Testland' },
  ...overrides
});

const MOCK_STATS = {
  avgBreakdown: { uptime: 80, version: 80, reputation: 80, storage: 80, total: 80 },
  totalNodes: 100
};

describe('Component Views (Visual Logic)', () => {

  describe('<HealthView />', () => {
    test('VISUALS: High health (>=80) should render breakdown elements', () => {
      render(
        <HealthView 
            node={createMockNode({ health: 95 })} 
            zenMode={false} 
            onBack={jest.fn()} 
            avgNetworkHealth={80} 
            medianStorage={1000} 
            networkStats={MOCK_STATS}
            timeRange="24H"
            onTimeRangeChange={jest.fn()}
        />
      );

      // It shows weighted points or "Base: 95" for specific categories (like Uptime).
      expect(screen.getByText(/Base: 95/i)).toBeInTheDocument();
      expect(screen.getByText(/STORAGE/i)).toBeInTheDocument();
      expect(screen.getByText(/UPTIME/i)).toBeInTheDocument();
    });
  });

  describe('<StorageView />', () => {
    test('LOGIC: Detects comparison against median', () => {
      render(<StorageView 
        node={createMockNode({ storage_committed: 2000 * (1024**3) })} 
        zenMode={false} onBack={jest.fn()} 
        medianCommitted={1000 * (1024**3)} 
        totalStorageCommitted={5000 * (1024**3)} 
        nodeCount={5} 
        timeRange="30D"
        onTimeRangeChange={jest.fn()}
        historyLoading={false}
        history={[]}
      />);

      expect(screen.getByText(/Median/i)).toBeInTheDocument();
      expect(screen.getByText(/ABOVE/i)).toBeInTheDocument();
    });

    test('VISUALS: Calculates Utilization Efficiency percentage', () => {
        render(<StorageView 
            node={createMockNode({ storage_committed: 1000, storage_used: 500 })} 
            zenMode={false} onBack={jest.fn()} medianCommitted={1000} 
            totalStorageCommitted={5000} nodeCount={5} 
            timeRange="30D"
            onTimeRangeChange={jest.fn()}
            historyLoading={false}
            history={[]}
        />);

        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText(/Efficiency/i)).toBeInTheDocument();
    });
  });

  describe('<IdentityView />', () => {
    test('VERSION CHECK: Renders Consensus information', () => {
      render(<IdentityView node={createMockNode()} nodes={[]} zenMode={false} onBack={jest.fn()} mostCommonVersion="1.5.0" />);
      expect(screen.getByText(/Network Consensus/i)).toBeInTheDocument();
    });
  });
});
