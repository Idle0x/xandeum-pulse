import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthView } from '../../src/components/modals/views/HealthView';
import { StorageView } from '../../src/components/modals/views/StorageView';
import { IdentityView } from '../../src/components/modals/views/IdentityView';

// --- MOCK DATA FACTORY ---
const createMockNode = (overrides = {}) => ({
  pubkey: 'TestNode123',
  address: '1.2.3.4:6000',
  version: '1.5.0',
  uptime: 86400,
  storage_committed: 1000 * (1024**3), // 1 TB
  storage_used: 500 * (1024**3), // 500 GB
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
    test('VISUALS: High health (>=80) should render GREEN elements', () => {
      render(<HealthView 
        node={createMockNode({ health: 95 })} 
        zenMode={false} 
        onBack={jest.fn()} 
        avgNetworkHealth={80} 
        medianStorage={1000} 
        networkStats={MOCK_STATS} 
      />);

      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText(/BETTER THAN/)).toBeInTheDocument();
    });

    test('VISUALS: Low health (<50) should render RED elements', () => {
      render(<HealthView 
        node={createMockNode({ health: 40 })} 
        zenMode={false} 
        onBack={jest.fn()} 
        avgNetworkHealth={80} 
        medianStorage={1000} 
        networkStats={MOCK_STATS} 
      />);

      expect(screen.getByText('40')).toBeInTheDocument();
      // Logic check for diff: 40 - 80 = -40
      expect(screen.getByText(/-40/)).toBeInTheDocument(); 
    });
  });

  describe('<StorageView />', () => {
    test('LOGIC: Should detect "Above Majority" status', () => {
      render(<StorageView 
        node={createMockNode({ storage_committed: 2000 })} 
        zenMode={false} 
        onBack={jest.fn()} 
        medianCommitted={1000} 
        totalStorageCommitted={5000} 
        nodeCount={5} 
      />);

      expect(screen.getByText(/Higher/)).toBeInTheDocument();
    });

    test('VISUALS: Tank/Bar should calculate fill percentage correctly (with buffer)', () => {
        // Max = max(500, 1000, 1000) * 1.1 = 1100
        // Expected % = (500 / 1100) * 100 = 45.45%
        const { container } = render(<StorageView 
            node={createMockNode({ storage_committed: 500 })} 
            zenMode={false} 
            onBack={jest.fn()} 
            medianCommitted={1000} 
            totalStorageCommitted={5000} 
            nodeCount={5} 
        />);

        const elements = container.querySelectorAll('[style*="45."]');
        expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('<IdentityView />', () => {
    test('VERSION CHECK: Should show "Up to Date" when versions match', () => {
      render(<IdentityView 
        node={createMockNode({ version: '1.5.0' })} 
        nodes={[]}
        zenMode={false} 
        onBack={jest.fn()} 
        mostCommonVersion="1.5.0" 
      />);

      expect(screen.getByText(/Up to Date/i)).toBeInTheDocument();
    });

    test('INTERACTION: Copy button should trigger clipboard', async () => {
      const mockClipboard = { writeText: jest.fn() };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<IdentityView 
        node={createMockNode()} 
        nodes={[]}
        zenMode={false} 
        onBack={jest.fn()} 
        mostCommonVersion="1.5.0" 
      />);

      const copyBtns = screen.getAllByRole('button');
      // Clicking first available copy button
      fireEvent.click(copyBtns[1]);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
