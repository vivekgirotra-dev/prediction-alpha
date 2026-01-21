import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function fetchPolymarketMarkets() {
  try {
    const response = await axios.get(`${GAMMA_API_BASE}/markets`, {
      params: { limit: 100, active: true, closed: false }
    });
    
    return response.data.map(market => ({
      id: market.conditionId || market.id,
      question: market.question,
      yesBuyPrice: parseFloat(market.outcomePrices?.[0]) || 0.5,
      yesSellPrice: parseFloat(market.outcomePrices?.[0]) || 0.5,
      noBuyPrice: parseFloat(market.outcomePrices?.[1]) || 0.5,
      noSellPrice: parseFloat(market.outcomePrices?.[1]) || 0.5,
      volume: parseFloat(market.volume) || 0,
      url: `https://polymarket.com/event/${market.slug}`,
      source: 'polymarket',
      matchKey: createMatchKey(market.question)
    }));
  } catch (error) {
    console.error('Polymarket API error:', error.message);
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
