'use client';
import { useState, useEffect } from 'react';

type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

interface Opportunity {
  id: string;
  question: string;
  kalshi: { yesBuyPrice: number; noBuyPrice: number; url: string };
  polymarket: { yesBuyPrice: number; noBuyPrice: number; url: string };
  strategy: string;
  profitPct: number;
  edge: number;
  trafficLight: { color: string; label: string };
  kelly: { recommendedBet: number; adjustedKelly: number; profileUsed: string };
}

interface ApiResponse {
  opportunities: Opportunity[];
  meta: {
    kalshiMarkets: number;
    polymarketMarkets: number;
    filteredCount: number;
    lastScan: string;
  };
}

export default function Home() {
  const [risk, setRisk] = useState<RiskProfile>('balanced');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/opportunities?risk=${risk}&bankroll=1000`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [risk]);

  const lightColor = (color: string) => {
    if (color === 'green') return 'bg-green-500';
    if (color === 'yellow') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center">⚡ Prediction Alpha</h1>
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
      {data && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{data.meta.filteredCount}</div>
            <div className="text-xs text-gray-500">Opportunities</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{data.meta.kalshiMarkets}</div>
            <div className="text-xs text-gray-500">Kalshi Markets</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{data.meta.polymarketMarkets}</div>
            <div className="text-xs text-gray-500">Polymarket</div>
          </div>
        </div>
      )}

      {/* Opportunities */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data?.opportunities.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-gray-400">No opportunities found for {risk} profile</div>
          <div className="text-gray-600 text-sm mt-2">Try a more aggressive profile or check back later</div>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.opportunities.map((opp) => (
            <div key={opp.id} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${lightColor(opp.trafficLight.color)}`} />
                <div className="flex-1">
                  <h3 className="font-medium text-sm leading-tight">{opp.question}</h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">+{opp.edge}%</div>
                  <div className="text-xs text-gray-500">edge</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-gray-500 text-xs mb-1">Kalshi</div>
                  <div>YES: {(opp.kalshi.yesBuyPrice * 100).toFixed(0)}¢</div>
                  <div>NO: {(opp.kalshi.noBuyPrice * 100).toFixed(0)}¢</div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-gray-500 text-xs mb-1">Polymarket</div>
                  <div>YES: {(opp.polymarket.yesBuyPrice * 100).toFixed(0)}¢</div>
                  <div>NO: {(opp.polymarket.noBuyPrice * 100).toFixed(0)}¢</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2 mb-3 text-sm">
                <span className="text-gray-500">Kelly says: </span>
                <span className="text-green-400 font-medium">${opp.kelly.recommendedBet}</span>
                <span className="text-gray-500"> ({opp.kelly.adjustedKelly}% of bankroll)</span>
              </div>

              <div className="flex gap-2">
                
                  href={opp.kalshi.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-center py-2 rounded text-sm font-medium transition"
                >
                  Trade on Kalshi
                </a>
                
                  href={opp.polymarket.url}
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
      )}

      <footer className="mt-8 text-center text-gray-600 text-xs">
        Last scan: {data?.meta.lastScan ? new Date(data.meta.lastScan).toLocaleTimeString() : '-'}
        <br />Refreshes every 30 seconds
      </footer>
    </main>
  );
}
