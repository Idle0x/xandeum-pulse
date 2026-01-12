// src/utils/formatters.ts

export const formatBytes = (bytes: number | undefined) => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0.00 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUptime = (seconds: number | undefined) => {
  if (!seconds || isNaN(seconds)) return '0m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
};

export const formatLastSeen = (timestamp: number | undefined) => {
  if (!timestamp || isNaN(timestamp)) return 'Never';
  const now = Date.now();
  const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const diff = now - time;

  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
