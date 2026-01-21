'use client'

import { useState } from 'react'

type ArbitrageOpp = {
  id: string
  type: 'arbitrage'
  title: string
  profitPct: number
  kalshiSide: string
  kalshiPrice: number
  polymarketSide: string
  polymarketPrice: number
  kalshiUrl: string
  polymarketUrl: string
  riskLevel: 'conservative' | 'balanced' | 'aggressive'
}

type EvOpp = {
  id: string
  type: 'ev'
  title: string
  edgePct: number
  trueProb: number
  platform: string
  price: number
  url: string
  riskLevel: 'conservative' | 'balanced' | 'aggressive'
  recommendedStake?: number
}

type WhaleOpp = {
  id: string
  type: 'whale'
  title: string
  platform: string
  amount: number
  side: string
  priceBefore: number
  priceAfter: number
  winRate: number
  url: string
  riskLevel: 'conservative' | 'balanced' | 'aggressive'
}

type Opportunity = ArbitrageOpp | EvOpp | WhaleOpp

const mockOpportunities: Opportunity[] = [
  {
    id: 'arb-1',
    type: 'arbitrage',
    title: 'Will Bitcoin reach $100,000 by January 31?',
    profitPct: 3.09,
    kalshiSide: 'YES',
    kalshiPrice: 0.48,
    polymarketSide: 'NO',
    polymarketPrice: 0.49,
    kalshiUrl: 'https://kalshi.com',
    polymarketUrl: 'https://polymarket.com',
    riskLevel: 'conservative',
  },
  {
    id: 'arb-2',
    type: 'arbitrage',
    title: 'Will the Fed raise rates in March?',
    profitPct: 1.01,
    kalshiSide: 'NO',
    kalshiPrice: 0.80,
    polymarketSide: 'YES',
    polymarketPrice: 0.19,
    kalshiUrl: 'https://kalshi.com',
    polymarketUrl: 'https://polymarket.com',
    riskLevel: 'conservative',
  },
  {
    id: 'ev-1',
    type: 'ev',
    title: 'Trump wins 2028 presidential election',
    edgePct: 4.2,
    trueProb: 0.42,
    platform: 'Kalshi',
    price: 0.38,
    url: 'https://kalshi.com',
    riskLevel: 'conservative',
    recommendedStake: 25,
  },
  {
    id: 'whale-1',
    type: 'whale',
    title: 'Trump wins 2028 presidential election',
    platform: 'Polymarket',
    amount: 847000,
    side: 'YES',
    priceBefore: 0.34,
    priceAfter: 0.38,
    winRate: 74,
    url: 'https://polymarket.com',
    riskLevel: 'balanced',
  },
]

export default function Home() {
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced')

  const filteredOpportunities = mockOpportunities.filter(opp => {
    if (riskProfile === 'aggressive') return true
    if (riskProfile === 'balanced') return opp.riskLevel !== 'aggressive'
    return opp.riskLevel === 'conservative'
  })

  const hiddenCount = mockOpportunities.length - filteredOpportunities.length
  const totalEdge = filteredOpportunities.reduce((sum, opp) => {
    if (opp.type === 'arbitrage') return sum + (opp.profitPct / 100) * 100
    return sum
  }, 0)

  const arbCount = filteredOpportunities.filter(o => o.type === 'arbitrage').length
  const evCount = filteredOpportunities.filter(o => o.type === 'ev').length
  const whaleCount = filteredOpportunities.filter(o => o.type === 'whale').length
  const riskEmoji = { conservative: '🟢', balanced: '🟡', aggressive: '🔴' }

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Prediction Alpha</h1>
          <p className="text-sm text-gray-400">Kalshi + Polymarket Edge</p>
        </div>
      </header>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <div className="text-sm text-gray-400 mb-1">{riskEmoji[riskProfile]} Your Edge Today</div>
          <div className="text-4xl font-bold text-green-400">${totalEdge.toFixed(0)}</div>
          <div className="text-sm text-gray-500">across {filteredOpportunities.length} opportunities</div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className={`py-2 rounded-lg ${arbCount > 0 ? 'bg-green-500/10' : ''}`}>
              <div className="text-lg">🟢 {arbCount}</div>
              <div className="text-xs text-gray-500">Arb</div>
            </div>
            <div className="py-2 rounded-lg">
              <div className="text-lg">📈 {evCount}</div>
              <div className="text-xs text-gray-500">+EV</div>
            </div>
            <div className="py-2 rounded-lg">
              <div className="text-lg">🐋 {whaleCount}</div>
              <div className="text-xs text-gray-500">Whale</div>
            </div>
            <div className="py-2 rounded-lg">
              <div className="text-lg text-gray-500">⚪ {hiddenCount}</div>
              <div className="text-xs text-gray-600">Hidden</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2">
          {(['conservative', 'balanced', 'aggressive'] as const).map(profile => (
            <button key={profile} onClick={() => setRiskProfile(profile)}
              className={`flex-1 p-3 rounded-xl border ${riskProfile === profile ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900'}`}>
              <div className="text-xl mb-1">{riskEmoji[profile]}</div>
              <div className="text-sm capitalize">{profile}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-3">
        {filteredOpportunities.map(opp => (
          <div key={opp.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            {opp.type === 'arbitrage' && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">🟢 Arbitrage</span>
                  <span className="text-green-400 font-bold">+{opp.profitPct.toFixed(1)}%</span>
                </div>
                <h3 className="font-medium mb-3">{opp.title}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Kalshi {opp.kalshiSide}</div>
                    <div className="text-lg font-semibold">{(opp.kalshiPrice * 100).toFixed(0)}¢</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Polymarket {opp.polymarketSide}</div>
                    <div className="text-lg font-semibold">{(opp.polymarketPrice * 100).toFixed(0)}¢</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={opp.kalshiUrl} target="_blank" className="flex-1 text-center py-2 bg-blue-600 rounded-lg text-sm">Kalshi</a>
                  <a href={opp.polymarketUrl} target="_blank" className="flex-1 text-center py-2 bg-gray-700 rounded-lg text-sm">Polymarket</a>
                </div>
              </>
            )}
            {opp.type === 'ev' && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">📈 +EV</span>
                  <span className="text-green-400 font-bold">+{opp.edgePct.toFixed(1)}% edge</span>
                </div>
                <h3 className="font-medium mb-3">{opp.title}</h3>
                <div className="text-sm mb-3">
                  <span className="text-gray-400">True: {(opp.trueProb * 100).toFixed(0)}%</span>
                  <span className="text-gray-400 ml-4">{opp.platform}: {(opp.price * 100).toFixed(0)}¢</span>
                </div>
                {opp.recommendedStake && <div className="bg-gray-800/50 rounded-lg p-2 mb-3 text-sm">Stake: <span className="text-blue-400">${opp.recommendedStake}</span></div>}
                <a href={opp.url} target="_blank" className="block text-center py-2 bg-blue-600 rounded-lg text-sm">Place on {opp.platform}</a>
              </>
            )}
            {opp.type === 'whale' && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">🐋 Whale</span>
                  <span className="text-purple-400 font-bold">${(opp.amount/1000).toFixed(0)}K</span>
                </div>
                <h3 className="font-medium mb-3">{opp.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-3 h-3 rounded-full ${opp.winRate >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm">{opp.winRate}% win rate</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 mb-3 text-sm">
                  {opp.side} on {opp.platform}: {(opp.priceBefore * 100).toFixed(0)}¢ → {(opp.priceAfter * 100).toFixed(0)}¢
                </div>
                <a href={opp.url} target="_blank" className="block text-center py-2 bg-gray-700 rounded-lg text-sm">View on {opp.platform}</a>
              </>
            )}
          </div>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-around">
          <button className="text-blue-400 text-center"><span className="text-xl">🏠</span><div className="text-xs">Home</div></button>
          <button className="text-gray-500 text-center"><span className="text-xl">📊</span><div className="text-xs">Arb</div></button>
          <button className="text-gray-500 text-center"><span className="text-xl">📈</span><div className="text-xs">+EV</div></button>
          <button className="text-gray-500 text-center"><span className="text-xl">🐋</span><div className="text-xs">Whales</div></button>
          <button className="text-gray-500 text-center"><span className="text-xl">⚙️</span><div className="text-xs">Settings</div></button>
        </div>
      </nav>
    </main>
  )
}
