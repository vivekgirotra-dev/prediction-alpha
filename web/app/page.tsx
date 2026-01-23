'use client'

import { useState, useEffect } from 'react'

type PolymarketOpp = {
  id: string
  type: 'polymarket'
  title: string
  platform: string
  yesPrice: number
  noPrice: number
  volume: number
  liquidity: number
  endDate: string
  url: string
}

type Whale = {
  rank: number
  address: string
  username: string
  volume: number
  pnl: number
  profileImage: string | null
  verified: boolean
}

type RiskProfile = 'conservative' | 'balanced' | 'aggressive'
type Tab = 'home' | 'arb' | 'ev' | 'whales' | 'settings'

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 999
  const target = new Date(dateStr)
  const diff = target.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDuration(dateStr: string): string {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 7) return days + ' days'
  if (days < 30) return Math.ceil(days / 7) + ' weeks'
  if (days < 365) return Math.ceil(days / 30) + ' months'
  if (days === 999) return 'TBD'
  return Math.ceil(days / 365) + ' years'
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return '$' + (vol / 1000000).toFixed(1) + 'M'
  if (vol >= 1000) return '$' + Math.round(vol / 1000) + 'K'
  return '$' + Math.round(vol)
}

function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? '+' : ''
  if (Math.abs(pnl) >= 1000000) return prefix + '$' + (pnl / 1000000).toFixed(1) + 'M'
  if (Math.abs(pnl) >= 1000) return prefix + '$' + Math.round(pnl / 1000) + 'K'
  return prefix + '$' + Math.round(pnl)
}

function getRiskLevel(volume: number): RiskProfile {
  if (volume >= 1000000) return 'conservative'
  if (volume >= 100000) return 'balanced'
  return 'aggressive'
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<PolymarketOpp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [whales, setWhales] = useState<Whale[]>([])
  const [whalesLoading, setWhalesLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [])

  useEffect(() => {
    if (activeTab === 'whales' && whales.length === 0) {
      fetchWhales()
    }
  }, [activeTab])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/markets')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOpportunities(data.opportunities || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchWhales = async () => {
    try {
      setWhalesLoading(true)
      const res = await fetch('/api/whales')
      const data = await res.json()
      if (data.whales) {
        setWhales(data.whales)
      }
    } catch (e) {
      console.error('Failed to fetch whales:', e)
    } finally {
      setWhalesLoading(false)
    }
  }

  const filteredOpps = opportunities.filter(opp => {
    const level = getRiskLevel(opp.volume)
    if (riskProfile === 'conservative' && level !== 'conservative') return false
    if (riskProfile === 'balanced' && level === 'aggressive') return false
    if (durationFilter !== 'all') {
      const days = getDaysUntil(opp.endDate)
      if (durationFilter === '1w' && days > 7) return false
      if (durationFilter === '1m' && days > 30) return false
      if (durationFilter === '3m' && days > 90) return false
    }
    return true
  })

  const hiddenCount = opportunities.length - filteredOpps.length

  const Header = () => (
    <div className="text-center py-6">
      <h1 className="text-2xl font-bold text-white">Prediction Alpha</h1>
      <p className="text-gray-400 text-sm">Live Polymarket Data</p>
      <div className="absolute top-6 right-4 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
        {currentTime.toLocaleTimeString()}
      </div>
    </div>
  )

  const Nav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
      <div className="flex justify-around py-2">
        {[
          { id: 'home', label: 'Home' },
          { id: 'arb', label: 'Arb' },
          { id: 'ev', label: '+EV' },
          { id: 'whales', label: 'Whales' },
          { id: 'settings', label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={'flex flex-col items-center px-3 py-1 ' + (activeTab === tab.id ? 'text-blue-500' : 'text-gray-500')}
          >
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )

  if (activeTab === 'settings') {
    return (
      <main className="min-h-screen bg-gray-900 relative">
        <Header />
        <div className="px-4 pb-24">
          <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Risk Profile</h3>
            {[
              { id: 'conservative', label: 'Conservative', desc: 'More than $1M volume' },
              { id: 'balanced', label: 'Balanced', desc: 'More than $100K volume' },
              { id: 'aggressive', label: 'Aggressive', desc: 'All markets' },
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setRiskProfile(option.id as RiskProfile)}
                className={'w-full text-left p-3 rounded-lg mb-2 ' + (riskProfile === option.id ? 'bg-blue-600' : 'bg-gray-700')}
              >
                <div className="text-white font-medium">{option.label}</div>
                <div className="text-gray-400 text-sm">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <Nav />
      </main>
    )
  }

  if (activeTab === 'whales') {
    return (
      <main className="min-h-screen bg-gray-900 relative">
        <Header />
        <div className="px-4 pb-24">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Top Traders</h2>
              <p className="text-gray-400 text-sm">Polymarket Leaderboard</p>
            </div>
            <button
              onClick={fetchWhales}
              className="text-xs bg-gray-800 px-3 py-1 rounded-lg hover:bg-gray-700 text-white"
            >
              Refresh
            </button>
          </div>
          {whalesLoading && whales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Loading top traders...</div>
          ) : (
            <div className="space-y-3">
              {whales.map((whale) => (
                <div key={whale.address} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                      {whale.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{whale.username}</span>
                        {whale.verified && <span className="text-blue-400 text-sm">✓</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={'font-semibold ' + (whale.pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {formatPnl(whale.pnl)}
                      </div>
                      <div className="text-xs text-gray-500">{formatVolume(whale.volume)} vol</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Nav />
      </main>
    )
  }

  if (activeTab === 'arb' || activeTab === 'ev') {
    return (
      <main className="min-h-screen bg-gray-900 relative">
        <Header />
        <div className="px-4 pb-24 text-center py-12">
          <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400">This feature is under development</p>
        </div>
        <Nav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 relative">
      <Header />
      <div className="px-4 pb-24">
        <div className="text-center mb-4">
          <span className="text-red-500">*</span>
          <span className="text-gray-400 ml-1">Live Markets</span>
          <div className="text-3xl font-bold text-green-500">{filteredOpps.length}</div>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {(['conservative', 'balanced', 'aggressive'] as RiskProfile[]).map(profile => (
            <button
              key={profile}
              onClick={() => setRiskProfile(profile)}
              className={'px-4 py-2 rounded-full text-sm font-medium ' + (riskProfile === profile ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300')}
            >
              {profile.charAt(0).toUpperCase() + profile.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: '1w', label: '<1w' },
            { id: '1m', label: '<1m' },
            { id: '3m', label: '<3m' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setDurationFilter(filter.id)}
              className={'px-4 py-2 rounded-lg text-sm ' + (durationFilter === filter.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300')}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading markets...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : (
          <div>
            {filteredOpps.map(opp => (
              <div key={opp.id} className="bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">{opp.platform}</span>
                  <span className="text-gray-400 text-sm">{formatVolume(opp.volume)}</span>
                </div>
                <h3 className="text-white font-medium mb-1">{opp.title}</h3>
                <div className="text-gray-500 text-sm mb-3">{formatDuration(opp.endDate)}</div>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-gray-700 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">YES</div>
                    <div className="text-green-500 font-bold">{Math.round(opp.yesPrice * 100)}c</div>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">NO</div>
                    <div className="text-red-500 font-bold">{Math.round(opp.noPrice * 100)}c</div>
                  </div>
                </div>
                <a
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium"
                >
                  Trade on Polymarket
                </a>
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="text-center text-gray-500 py-4">
                {hiddenCount} hidden.
                <button onClick={() => setRiskProfile('aggressive')} className="text-blue-400 ml-1">
                  Show all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Nav />
    </main>
  )
}
