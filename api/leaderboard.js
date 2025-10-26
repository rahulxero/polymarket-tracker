export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    console.log('Fetching leaderboard data...');
    
    // Try CLOB API first (simpler, more reliable)
    let leaderboardResponse = await fetch('https://clob.polymarket.com/leaderboard', {
      headers: {
        'Accept': 'application/json',
      },
    });

    // If CLOB fails, try Gamma API
    if (!leaderboardResponse.ok) {
      console.log('CLOB failed, trying Gamma API...');
      leaderboardResponse = await fetch('https://gamma-api.polymarket.com/leaderboard?window=all', {
        headers: {
          'Accept': 'application/json',
        },
      });
    }

    if (!leaderboardResponse.ok) {
      throw new Error(`APIs returned status: ${leaderboardResponse.status}`);
    }

    const leaderboardData = await leaderboardResponse.json();
    console.log('Leaderboard data received:', leaderboardData.length, 'traders');
    
    // Sort by volume and get top 10
    const topByVolume = leaderboardData
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);

    // For now, return without fetching individual bets (we'll add that back once this works)
    const tradersWithBets = topByVolume.map((trader, index) => {
      const address = trader.user || trader.account || trader.address;
      
      return {
        ...trader,
        fullAddress: address,
        recentBets: [], // Empty for now to test
      };
    });
    
    console.log('Returning', tradersWithBets.length, 'traders');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json(tradersWithBets);
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
    });
  }
}
