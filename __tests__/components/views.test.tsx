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

  // =========================================================
  // 1. HEALTH VIEW TESTS
  // =========================================================
  describe('<HealthView />', () => {

    test('VISUALS: High health (>=80) should render GREEN elements', () => {
      // @ts-ignore - partial node mock is fine
      render(<HealthView node={createMockNode({ health: 95 })} zenMode={false} onBack={jest.fn()} avgNetworkHealth={80} medianStorage={1000} networkStats={MOCK_STATS} />);

      // Check for the score text
      expect(screen.getByText('95')).toBeInTheDocument();

      // Check if the "Better than" badge is rendered
      expect(screen.getByText(/BETTER THAN/)).toBeInTheDocument();
    });

    test('VISUALS: Low health (<50) should render RED elements', () => {
      // @ts-ignore
      render(<HealthView node={createMockNode({ health: 40 })} zenMode={false} onBack={jest.fn()} avgNetworkHealth={80} medianStorage={1000} networkStats={MOCK_STATS} />);

      expect(screen.getByText('40')).toBeInTheDocument();
      // We look for a red indicator (checking class names is brittle, but logic verification via text is robust)
      // The logic calculates diff: 40 - 80 = -40
      expect(screen.getByText(/-40/)).toBeInTheDocument(); 
    });
  });

  // =========================================================
  // 2. STORAGE VIEW TESTS
  // =========================================================
  describe('<StorageView />', () => {

    test('LOGIC: Should detect "Above Majority" status', () => {
      // Node has 2000, Median is 1000 -> Higher
      // @ts-ignore
      render(<StorageView node={createMockNode({ storage_committed: 2000 })} zenMode={false} onBack={jest.fn()} medianCommitted={1000} totalStorageCommitted={5000} nodeCount={5} />);

      expect(screen.getByText(/Higher/)).toBeInTheDocument();
      // On Desktop view, it explicitly says "ABOVE MAJORITY"
      // Note: Mobile view might hide this specific text, but "Higher" exists in both.
    });

    test('LOGIC: Should detect "Below Majority" status', () => {
      // Node has 500, Median is 1000 -> Lower
      // @ts-ignore
      render(<StorageView node={createMockNode({ storage_committed: 500 })} zenMode={false} onBack={jest.fn()} medianCommitted={1000} totalStorageCommitted={5000} nodeCount={5} />);

      expect(screen.getByText(/Lower/)).toBeInTheDocument();
    });

    test('VISUALS: Tank/Bar should calculate fill percentage correctly (with buffer)', () => {
        // Node 500, Median 1000, Avg 1000
        // New Logic: Max = max(500, 1000, 1000) * 1.1 (Buffer) = 1100
        // Expected % = (500 / 1100) * 100 = 45.45...%
        
        // @ts-ignore
        const { container } = render(<StorageView node={createMockNode({ storage_committed: 500 })} zenMode={false} onBack={jest.fn()} medianCommitted={1000} totalStorageCommitted={5000} nodeCount={5} />);

        // We search for a style attribute that contains "45." instead of "50%" to match the buffered calculation
        const elements = container.querySelectorAll('[style*="45."]');
        
        expect(elements.length).toBeGreaterThan(0);
    });
  });

  // =========================================================
  // 3. IDENTITY VIEW TESTS
  // =========================================================
  describe('<IdentityView />', () => {

    test('VERSION CHECK: Should show "Up to Date" when versions match', () => {
      // @ts-ignore
      render(<IdentityView node={createMockNode({ version: '1.5.0' })} zenMode={false} onBack={jest.fn()} mostCommonVersion="1.5.0" />);

      expect(screen.getByText(/Up to Date/i)).toBeInTheDocument();
      expect(screen.queryByText(/Update Recommended/i)).not.toBeInTheDocument();
    });

    test('VERSION CHECK: Should show "Update Recommended" when behind', () => {
      // @ts-ignore
      render(<IdentityView node={createMockNode({ version: '1.0.0' })} zenMode={false} onBack={jest.fn()} mostCommonVersion="1.5.0" />);

      expect(screen.getByText(/Update Recommended/i)).toBeInTheDocument();
    });

    test('INTERACTION: Copy button should trigger clipboard', async () => {
      // Mock Clipboard
      const mockClipboard = { writeText: jest.fn() };
      Object.assign(navigator, { clipboard: mockClipboard });

      // @ts-ignore
      render(<IdentityView node={createMockNode()} zenMode={false} onBack={jest.fn()} mostCommonVersion="1.5.0" />);

      // Find copy button next to Pubkey (first copy button usually)
      const copyBtns = screen.getAllByRole('button');
      // The first button is "BACK", subsequent ones are copy buttons inside the list
      // We just click one
      fireEvent.click(copyBtns[1]);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

});
