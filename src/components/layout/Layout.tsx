import Head from 'next/head';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  zenMode: boolean;
  onClick?: () => void;
}

export const Layout = ({ children, zenMode, onClick }: LayoutProps) => {
  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        zenMode ? 'bg-black text-zinc-300 selection:bg-zinc-700' : 'bg-[#09090b] text-zinc-100 selection:bg-blue-500/30'
      }`}
      onClick={onClick}
    >
      <Head>
        <title>Xandeum Pulse {zenMode ? '[ZEN MODE]' : ''}</title>
      </Head>
      {children}
    </div>
  );
};
