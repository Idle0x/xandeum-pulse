import { Node } from '../../types';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { StabilityRibbon } from '../modals/views/StabilityRibbon';

// UPDATED: Now accepts full 'node' object to support Stable ID history fetching
export const ExpandedRowDetails = ({ node }: { node: Node }) => {
  const { history, loading } = useNodeHistory(node);
  
  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
       <StabilityRibbon history={history} loading={loading} />
    </div>
  );
};
