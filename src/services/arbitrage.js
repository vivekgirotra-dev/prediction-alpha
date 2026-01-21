export function findArbitrageOpportunities(kalshiMarkets, polymarketMarkets) {
  const opportunities = [];
  
  for (const km of kalshiMarkets) {
    for (const pm of polymarketMarkets) {
      if (marketsMatch(km.matchKey, pm.matchKey)) {
        const arb = calculateArbitrage(km, pm);
        if (arb) {
          opportunities.push(arb);
        }
      }
    }
  }
  
  return opportunities.sort((a, b) => b.profitPct - a.profitPct);
}

function marketsMatch(key1, key2) {
  const words1 = key1.split(' ');
  const words2 = key2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
  return commonWords.length >= 3;
}

export function calculateArbitrage(kalshiMarket, polymarketMarket) {
  const km = kalshiMarket;
  const pm = polymarketMarket;
  
  // Strategy 1: Buy YES on Kalshi, Buy NO on Polymarket
  const strat1Cost = km.yesBuyPrice + pm.noBuyPrice;
  const strat1Profit = 1 - strat1Cost;
  
  // Strategy 2: Buy NO on Kalshi, Buy YES on Polymarket
  const strat2Cost = km.noBuyPrice + pm.yesBuyPrice;
  const strat2Profit = 1 - strat2Cost;
  
  // Strategy 3: Price difference (edge) - Kalshi YES cheaper
  const edgeKalshiYes = pm.yesBuyPrice - km.yesBuyPrice;
  
  // Strategy 4: Price difference (edge) - Polymarket YES cheaper
  const edgePolyYes = km.yesBuyPrice - pm.yesBuyPrice;
  
  let bestStrategy = null;
  let profitPct = 0;
  let edge = 0;
  
  if (strat1Profit > 0.001) {
    bestStrategy = 'arb_kalshi_yes_poly_no';
    profitPct = strat1Profit * 100;
    edge = profitPct;
  } else if (strat2Profit > 0.001) {
    bestStrategy = 'arb_kalshi_no_poly_yes';
    profitPct = strat2Profit * 100;
    edge = profitPct;
  } else if (edgeKalshiYes > 0.01) {
    bestStrategy = 'edge_kalshi_yes';
    edge = edgeKalshiYes * 100;
    profitPct = edge;
  } else if (edgePolyYes > 0.01) {
    bestStrategy = 'edge_poly_yes';
    edge = edgePolyYes * 100;
    profitPct = edge;
  }
  
  if (!bestStrategy) return null;
  
  return {
    id: `${km.id}-${pm.id}`,
    question: km.question,
    kalshi: {
      id: km.id,
      yesBuyPrice: km.yesBuyPrice,
      noBuyPrice: km.noBuyPrice,
      url: km.url
    },
    polymarket: {
      id: pm.id,
      yesBuyPrice: pm.yesBuyPrice,
      noBuyPrice: pm.noBuyPrice,
      url: pm.url
    },
    strategy: bestStrategy,
    profitPct: Math.round(profitPct * 100) / 100,
    edge: Math.round(edge * 100) / 100,
    timestamp: new Date().toISOString()
  };
}
