import axios from 'axios';

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

export async function fetchKalshiMarkets() {
  try {
    const response = await axios.get(`${KALSHI_API_BASE}/markets`, {
      params: { limit: 100, status: 'open' }
    });
    
    return response.data.markets.map(market => ({
      id: market.ticker,
      question: market.title,
      yesBuyPrice: market.yes_ask / 100,
      yesSellPrice: market.yes_bid / 100,
      noBuyPrice: market.no_ask / 100,
      noSellPrice: market.no_bid / 100,
      volume: market.volume,
      url: `https://kalshi.com/markets/${market.ticker}`,
      source: 'kalshi',
      matchKey: createMatchKey(market.title)
    }));
  } catch (error) {
    console.error('Kalshi API error:', error.message);
    return [];
  }
}

function createMatchKey(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ');
}
