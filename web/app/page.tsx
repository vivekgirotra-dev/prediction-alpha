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

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 999
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDuration(dateStr: string): string {
  const days = getDaysUntil(dateStr)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.ceil(days / 7)} weeks`
  if (days < 365) return `${Math.ceil(days / 30)} months`
  if (days === 999) return 'TBD'
  return `${(days / 365).toFixed(1)} years`
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function getDurationCategory(dateStr: string): string {
  const days = getDaysUntil(dateStr)
  if (days <= 7) return 'week'
  if (days <= 30) return 'month'
  if (days <= 90) return 'quarter'
  return 'long'
}

function logToStorage(opp: PolymarketOpp, action: string) {
  try {
    const saved = localStorage.getItem('prediction-alpha-log')
    const logs = saved ? JSON.parse(saved) : []
    logs.push({ ...opp, loggedAt: new Date().toISOString(), action, outcome: 'pending' })
    localStorage.setItem('prediction-alpha-log', JSON.stringify(logs))
  } catch (e) {
    console.error('Log failed:', e)
  }
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<PolymarketOpp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [durationFilter, setDurationFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/markets')
      const data = await res.json()
      if (data.opportunities) {
        setOpportunities(data.opportunities)
        setLastUpdated(new Date().toLocaleTimeString())
        setError(null)
      } else {
        setError('No markets found')
      }
    } catch (e) {
      setError('Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const handleAction = (opp: PolymarketOpp) => {
    logToStorage(opp, 'view')
    window.open(opp.url, '_blank')
  }

  const filteredOpportunities = opportunities.filter(opp => {
    if (durationFilter === 'all') return true
    const cat = getDurationCategory(opp.endDate)
    if (durationFilter === 'week' && cat !== 'week') return false
    if (durationFilter === 'month' && !['week', 'month'].includes(cat)) return false
    if (durationFilter === 'quarter' && cat === 'long') return false
    return true
  })

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Prediction Alpha</h1>
              <p className="text-sm text-gray-400">Live Polymarket Data</p>
            </div>
            <button onClick={fetchMarkets} className="text-xs bg-gray-800 px-3 py-1 rounded-lg">
              🔄 {lastUpdated || 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <div className="text-sm text-gray-400 mb-1">🔴 Live Markets</div>
          <div className="text-4xl font-bold text-green-400">{filteredOpportunities.length}</div>
          <div className="text-sm text-gray-500">active opportunities</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'week', label: '< 1 week' },
            { key: 'month', label: '< 1 month' },
            { key: 'quarter', label: '< 3 months' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setDurationFilter(key as typeof durationFilter)}
              className={`flex-1 py-2 rounded-lg text-sm ${durationFilter === key ? 'bg-purple-500/20 text-purple-400 border border-purple-500' : 'bg-gray-900 border border-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-3">
        {loading && opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading live markets...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : (
          filteredOpportunities.map(opp => (
            <div key={opp.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between mb-2">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">Polymarket</span>
                <span className="text-xs text-gray-500">{formatVolume(opp.volume)} vol</span>
              </div>
              <h3 className="font-medium mb-1">{opp.title}</h3>
              <div className="text-xs text-gray-500 mb-3">⏱️ Resolves in {formatDuration(opp.endDate)}</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">YES</div>
                  <div className="text-lg font-semibold text-green-400">{(opp.yesPrice * 100).toFixed(0)}¢</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">NO</div>
                  <div className="text-lg font-semibold text-red-400">{(opp.noPrice * 100).toFixed(0)}¢</div>
                </div>
              </div>
              <button onClick={() => handleAction(opp)} className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                Trade on Polymarket
              </button>
            </div>
          ))
        )}
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
