// utils/historyAggregator.ts

export const consolidateHistory = (data: any[], timeRange: string) => {
  // 1. For High-Res windows, return raw hourly data
  if (timeRange === '24H' || timeRange === '3D' || timeRange === '7D') {
    return data;
  }

  // 2. For Long-Term windows, group by Date (YYYY-MM-DD)
  const groups: Record<string, any[]> = {};
  
  data.forEach(point => {
    // robust date parsing
    const dateObj = new Date(point.date || point.created_at);
    if (isNaN(dateObj.getTime())) return;
    
    const dateKey = dateObj.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(point);
  });

  // 3. Flatten into Daily Summaries
  return Object.keys(groups).sort().map(dateStr => {
    const dayPoints = groups[dateStr];
    
    // Sort chronological to ensure we find the true "End of Day" values
    dayPoints.sort((a, b) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());
    
    const lastPoint = dayPoints[dayPoints.length - 1];
    
    // CALCULATION LOGIC:
    // Health = Average of the day (rounded)
    const avgHealth = dayPoints.reduce((sum, p) => sum + (Number(p.health) || 0), 0) / dayPoints.length;
    
    // Uptime = Average of the day (since it's a percentage)
    const avgUptime = dayPoints.reduce((sum, p) => sum + (Number(p.uptime) || 0), 0) / dayPoints.length;

    // Rank = Best (lowest) rank of the day
    const minRank = Math.min(...dayPoints.map(p => p.rank || 999999));

    return {
      ...lastPoint, // Keep network, pubkey, static info
      date: dateStr, // Overwrite timestamp with just the date
      health: Math.round(avgHealth),
      uptime: avgUptime,
      // Credits/Storage = Last value of the day (Accumulators)
      credits: lastPoint.credits,
      storage_committed: lastPoint.storage_committed,
      storage_used: lastPoint.storage_used,
      rank: minRank === 999999 ? 0 : minRank
    };
  });
};
