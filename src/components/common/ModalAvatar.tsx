import { Node } from '../../types';

export const ModalAvatar = ({ node }: { node: Node }) => {
  const code = node.location?.countryCode;

  if (code && code !== 'XX') {
    return (
      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden bg-zinc-900 relative group shrink-0">
        <img
          src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
          alt="country flag"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition duration-500"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl shadow-lg border border-white/10 bg-gradient-to-br from-blue-600 to-purple-600 text-white shrink-0">
      {node.pubkey?.slice(0, 2) || '??'}
    </div>
  );
};
