export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Just return mock data for now to verify the API route works
  const mockData = Array.from({ length: 10 }, (_, i) => ({
    fullAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    account: `0x${Math.random().toString(16).substr(2, 40)}`,
    profit: Math.floor(Math.random() * 100000) + 10000,
    volume: Math.floor(Math.random() * 500000) + 100000,
    markets_traded: Math.floor(Math.random() * 50) + 5,
    win_rate: (Math.random() * 30 + 55).toFixed(1),
    recentBets: [
      {
        market: 'Will Bitcoin reach $100k in 2025?',
        amount: Math.floor(Math.random() * 5000) + 1000,
        outcome: Math.random() > 0.5 ? 'Yes' : 'No',
        timestamp: Date.now() - Math.random() * 86400000 * 3,
      },
      {
        market: 'Will AI replace developers by 2026?',
        amount: Math.floor(Math.random() * 3000) + 1000,
        outcome: Math.random() > 0.5 ? 'Yes' : 'No',
        timestamp: Date.now() - Math.random() * 86400000 * 5,
      },
      {
        market: 'Will Ethereum flip Bitcoin?',
        amount: Math.floor(Math.random() * 4000) + 1500,
        outcome: Math.random() > 0.5 ? 'Yes' : 'No',
        timestamp: Date.now() - Math.random() * 86400000 * 7,
      }
    ],
  })).sort((a, b) => b.volume - a.volume);
  
  res.status(200).json(mockData);
}
