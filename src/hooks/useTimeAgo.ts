// src/hooks/useTimeAgo.ts
import { useState, useEffect } from 'react';

export const useTimeAgo = (timestamp: number | undefined) => {
  const [timeAgo, setTimeAgo] = useState('Syncing...');

  useEffect(() => {
    if (!timestamp) return;

    const update = () => {
      const now = Date.now();
      const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      const diff = Math.floor((now - time) / 1000);

      if (diff < 60) {
        setTimeAgo(`${diff} second${diff !== 1 ? 's' : ''} ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
};
