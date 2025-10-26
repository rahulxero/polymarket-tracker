export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Try Gamma API for leaderboard
    const leaderboardResponse = await fetch('https://gamma-api.polymarket.com/leaderboard?window=all', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!leaderboardResponse.ok) {
      throw new Error(`Leaderboard API failed: ${leaderboardResponse.status}`);
    }

    const leaderboardData = await leaderboardResponse.json();
    
    // Sort by volume and get top 10
    const topByVolume = leaderboardData
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);

    // Fetch recent bets for each trader
    const tradersWithBets = await Promise.all(
      topByVolume.map(async (trader) => {
        try {
          // Keep full address
          const address = trader.user || trader.account || trader.address;
          
          if (!address) {
            return {
              ...trader,
              fullAddress: null,
              recentBets: [],
            };
          }

          // Fetch user's positions/bets from Gamma API
          const betsResponse = await fetch(
            `https://gamma-api.polymarket.com/positions?user=${address}`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            }
          );

          let recentBets = [];
          if (betsResponse.ok) {
            const positions = await betsResponse.json();
            
            // Filter and format positions >= $1000
            recentBets = positions
              .filter(pos => {
                const totalValue = (pos.size || 0) * (pos.price || 1);
                return totalValue >= 1000;
              })
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 5)
              .map(pos => ({
                market: pos.market_slug || pos.question || pos.title || 'Unknown Market',
                amount: (pos.size || 0) * (pos.price || 1),
                outcome: pos.outcome || pos.side || (pos.price > 0.5 ? 'Yes' : 'No'),
                timestamp: pos.timestamp ? pos.timestamp * 1000 : Date.now(),
              }));
          }

          return {
            ...trader,
            fullAddress: address, // Store complete address
            recentBets,
          };
        } catch (err) {
          console.error(`Error fetching data for trader:`, err);
          return {
            ...trader,
            fullAddress: trader.user || trader.account || trader.address,
            recentBets: [],
          };
        }
      })
    );
    
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json(tradersWithBets);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
