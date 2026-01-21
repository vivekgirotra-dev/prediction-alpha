'use client';

import { useState } from 'react';

type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

interface Opportunity {
  id: string;
  type: 'arbitrage' | 'ev' | 'whale';
  title: string;
  profitPct?: number;
  edgePct?: number;
  amount?: number;
  kalshiPrice?: number;
  polymarketPrice?: number;
  kalshiUrl?: string;
  polymarketUrl?: string;
  url?: string;
  platform?: string;
  side?: string;
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
  trafficLight: { color: string; label: string };
  kelly?: { recommendedBet: number; adjustedKelly: number };
}

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    type: 'arbitrage',
    title: 'Will Bitcoin reach $100k by Jan 31?',
    profitPct: 3.2,
    kalshiPrice: 48,
    polymarketPrice: 49,
    kalshiUrl: 'https://kalshi.com/markets/btc',
    polymarketUrl: 'https://polymarket.com/btc',
    riskLevel: 'conservative',
    trafficLight: { color: 'green', label: 'Strong' },
    kelly: { recommendedBet: 125, adjustedKelly: 6.25 },
  },
  {
    id: '2',
    type: 'arbitrage',
    title: 'Fed rate cut in March 2024?',
    profitPct: 2.1,
    kalshiPrice: 62,
    polymarketPrice: 36,
    kalshiUrl: 'https://kalshi.com/markets/fed',
    polymarketUrl: 'https://polymarket.com/fed',
    riskLevel: 'balanced',
    trafficLight: { color: 'yellow', label: 'Moderate' },
    kelly: { recommendedBet: 85, adjustedKelly: 4.25 },
  },
  {
    id: '3',
    type: 'arbitrage',
    title: 'Trump wins 2024 election?',
    profitPct: 1.5,
    kalshiPrice: 55,
    polymarketPrice: 44,
    kalshiUrl: 'https://kalshi.com/markets/trump',
    polymarketUrl: 'https://polymarket.com/trump',
    riskLevel: 'aggressive',
    trafficLight: { color: 'red', label: 'Weak' },
    kelly: { recommendedBet: 45, adjustedKelly: 2.25 },
  },
];

export default function Home() {
  const [risk, setRisk] = useState<RiskProfile>('balanced');

  const filteredOpps = mockOpportunities.filter((opp) => {
    if (risk === 'aggressive') return true;
    if (risk === 'balanced') return opp.riskLevel !== 'aggressive';
    return opp.riskLevel === 'conservative';
  });

  const lightColor = (color: string) => {
    if (color === 'green') return 'bg-green-500';
    if (color === 'yellow') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center">Prediction Alpha</h1>
        <p className="text-gray-400 text-center text-sm">Arbitrage Scanner</p>
      </header>

      {/* Risk Profile Selector */}
      <div className="flex gap-2 mb-6">
        {(['conservative', 'balanced', 'aggressive'] as RiskProfile[]).map((r) => (
          <button
            key={r}
            onClick={() => setRisk(r)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition ${
              risk === r ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{filteredOpps.length}</div>
          <div className="text-xs text-gray-400">Opportunities</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {filteredOpps.reduce((sum, o) => sum + (o.profitPct || 0), 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Total Edge</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            ${filteredOpps.reduce((sum, o) => sum + (o.kelly?.recommendedBet || 0), 0)}
          </div>
          <div className="text-xs text-gray-400">Kelly Bet</div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpps.map((opp) => (
          <div key={opp.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-white flex-1">{opp.title}</h3>
              <div className={`w-3 h-3 rounded-full ${lightColor(opp.trafficLight.color)}`} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-900 rounded-lg p-2">
                <div className="text-xs text-gray-400">Kalshi</div>
                <div className="text-lg font-bold text-blue-400">{opp.kalshiPrice}¢</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-2">
                <div className="text-xs text-gray-400">Polymarket</div>
                <div className="text-lg font-bold text-purple-400">{opp.polymarketPrice}¢</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-green-400 font-bold text-lg">+{opp.profitPct}% profit</div>
              <div className="text-xs text-gray-400">
                Kelly: ${opp.kelly?.recommendedBet} ({opp.kelly?.adjustedKelly}%)
              </div>
            </div>

            <div className="flex gap-2">
              
                href={opp.kalshiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-center py-2 rounded text-sm font-medium transition"
              >
                Trade on Kalshi
              </a>
              
                href={opp.polymarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-center py-2 rounded text-sm font-medium transition"
              >
                Trade on Polymarket
              </a>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-8 text-center text-gray-600 text-xs">
        Refreshes every 30 seconds • Not financial advice
      </footer>
    </main>
  );
}
