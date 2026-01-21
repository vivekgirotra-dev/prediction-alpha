import express from 'express';
import cors from 'cors';
import { fetchKalshiMarkets } from './api/kalshi.js';
import { fetchPolymarketMarkets } from './api/polymarket.js';
import { findArbitrageOpportunities } from './services/arbitrage.js';
import { filterByRiskProfile, calculateKellyBet, getTrafficLight, RISK_PROFILES } from './services/alerts.js';

const app = express();
app.use(cors());
app.use(express.json());

let cachedOpportunities = [];
let lastScan = null;
let kalshiCount = 0;
let polymarketCount = 0;

async function scanMarkets() {
  console.log('Scanning markets...');
  
  const [kalshiMarkets, polymarketMarkets] = await Promise.all([
    fetchKalshiMarkets(),
    fetchPolymarketMarkets()
  ]);
  
  kalshiCount = kalshiMarkets.length;
  polymarketCount = polymarketMarkets.length;
  
  console.log(`Found ${kalshiCount} Kalshi markets, ${polymarketCount} Polymarket markets`);
  
  cachedOpportunities = findArbitrageOpportunities(kalshiMarkets, polymarketMarkets);
  lastScan = new Date().toISOString();
  
  console.log(`Found ${cachedOpportunities.length} opportunities`);
}

// API Routes
app.get('/api/opportunities', (req, res) => {
  const riskProfile = req.query.risk || 'balanced';
  const bankroll = parseInt(req.query.bankroll) || 1000;
  
  const filtered = filterByRiskProfile(cachedOpportunities, riskProfile);
  
  const enriched = filtered.map(opp => ({
    ...opp,
    trafficLight: getTrafficLight(opp.edge),
    kelly: calculateKellyBet(opp.edge, 0.5 + (opp.edge / 200), riskProfile, bankroll)
  }));
  
  res.json({
    opportunities: enriched,
    meta: {
      kalshiMarkets: kalshiCount,
      polymarketMarkets: polymarketCount,
      totalOpportunities: cachedOpportunities.length,
      filteredCount: enriched.length,
      riskProfile,
      lastScan
    }
  });
});

app.get('/api/profiles', (req, res) => {
  res.json(RISK_PROFILES);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', lastScan });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scanMarkets();
  setInterval(scanMarkets, 30000);
});
