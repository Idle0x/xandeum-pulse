import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthView } from '../../src/components/modals/views/HealthView';
import { StorageView } from '../../src/components/modals/views/StorageView';
import { IdentityView } from '../../src/components/modals/views/IdentityView';

const MOCK_STATS = {
  avgBreakdown: { uptime: 80, version: 80, reputation: 80, storage: 80, total: 80 },
  totalNodes: 100
};

const MOCK_NODE = {
  pubkey: 'TestKey',
  address: '1.2.3.4:6000',
  version: '1.5.0',
  storage_committed: 1000,
  storage_used: 500,
  health: 85,
  healthBreakdown: { uptime: 80, version: 80, reputation: 80, storage: 80 },
  network: 'MAINNET'
};

describe('Component Views (Visual Logic)', () => {

  describe('<HealthView />', () => {
    test('Renders with required NetworkStats prop', () => {
      render(
        <HealthView 
          node={MOCK_NODE as any} 
          zenMode={false} 
          onBack={jest.fn()} 
          avgNetworkHealth={80} 
          medianStorage={1000}
          networkStats={MOCK_STATS} 
        />
      );
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('<StorageView />', () => {
    test('Calibrates bar height with 10% buffer logic', () => {
      // Logic: Max = max(node, med, avg) * 1.1
      // 500 / (1000 * 1.1) = ~45.45%
      const { container } = render(
        <StorageView 
          node={MOCK_NODE as any} 
          zenMode={false} 
          onBack={jest.fn()} 
          medianCommitted={1000} 
          totalStorageCommitted={5000}
          nodeCount={5}
        />
      );

      const bar = container.querySelector('[style*="height: 45"]');
      expect(bar).toBeInTheDocument();
    });

    test('Identifies "Lower" than median status correctly', () => {
      render(
        <StorageView 
          node={MOCK_NODE as any} 
          zenMode={false} 
          onBack={jest.fn()} 
          medianCommitted={2000} 
          totalStorageCommitted={10000}
          nodeCount={5}
        />
      );
      expect(screen.getByText(/Lower/i)).toBeInTheDocument();
    });
  });

  describe('<IdentityView />', () => {
    test('Identity copy button triggers navigator', () => {
      const mockCopy = jest.fn();
      Object.assign(navigator, { clipboard: { writeText: mockCopy } });

      render(<IdentityView node={MOCK_NODE as any} zenMode={false} onBack={jest.fn()} mostCommonVersion="1.5.0" />);
      
      const copyBtns = screen.getAllByRole('button');
      fireEvent.click(copyBtns[1]); // Clicks the first copy button in the list
      expect(mockCopy).toHaveBeenCalled();
    });
  });
});
