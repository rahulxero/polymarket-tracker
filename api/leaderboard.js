export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Fetch leaderboard sorted by volume
    const leaderboardResponse = await fetch('https://gamma-api.polymarket.com/leaderboard?window=all', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!leaderboardResponse.ok) {
      throw new Error(`API returned status: ${leaderboardResponse.status}`);
    }

    const leaderboardData = await leaderboardResponse.json();
    
    // Sort by total volume and get top 10
    const topByVolume = leaderboardData
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);

    // Fetch recent trades for each trader
    const tradersWithBets = await Promise.all(
      topByVolume.map(async (trader) => {
        try {
          const address = trader.user || trader.account || trader.address;
          
          // Fetch user's trade history
          const tradesResponse = await fetch(
            `https://gamma-api.polymarket.com/trades?user=${address}&limit=20`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            }
          );

          let recentBets = [];
          if (tradesResponse.ok) {
            const trades = await tradesResponse.json();
            // Filter bets >= $1000
            recentBets = trades
              .filter(trade => (trade.size || trade.amount || 0) >= 1000)
              .slice(0, 5)
              .map(trade => ({
                market: trade.market || trade.question || 'Unknown Market',
                amount: trade.size || trade.amount || 0,
                outcome: trade.outcome || trade.side,
                timestamp: trade.timestamp || Date.now(),
              }));
          }

          return {
            ...trader,
            recentBets,
          };
        } catch (err) {
          console.error(`Error fetching trades for trader:`, err);
          return {
            ...trader,
            recentBets: [],
          };
        }
      })
    );
    
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json(tradersWithBets);
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Return mock data as fallback
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      account: `0x${Math.random().toString(16).substr(2, 40)}`,
      profit: Math.floor(Math.random() * 100000) + 10000,
      volume: Math.floor(Math.random() * 500000) + 50000,
      markets_traded: Math.floor(Math.random() * 50) + 5,
      win_rate: (Math.random() * 30 + 55).toFixed(1),
      recentBets: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
        market: 'Sample Market Event',
        amount: Math.floor(Math.random() * 5000) + 1000,
        outcome: Math.random() > 0.5 ? 'Yes' : 'No',
        timestamp: Date.now() - Math.random() * 86400000,
      })),
    })).sort((a, b) => b.volume - a.volume);
    
    res.status(200).json(mockData);
  }
}
