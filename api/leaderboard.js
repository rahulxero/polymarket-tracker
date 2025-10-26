export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    const response = await fetch('https://clob.polymarket.com/leaderboard', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Polymarket');
    }

    const data = await response.json();
    
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
}
