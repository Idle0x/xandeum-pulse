import { useNodeHistory } from '../../hooks/useNodeHistory';
import { StabilityRibbon } from '../modals/views/StabilityRibbon';

export const ExpandedRowDetails = ({ pubkey }: { pubkey: string }) => {
  const { history, loading } = useNodeHistory(pubkey);
  
  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
       <StabilityRibbon history={history} loading={loading} days={20} />
    </div>
  );
};
