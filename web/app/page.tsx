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

function getRiskLevel(opp: PolymarketOpp): RiskProfile {
  if (opp.volume >= 1000000) return 'conservative'
  if (opp.volume >= 100000) return 'balanced'
  return 'aggressive'
}

function logToStorage(opp: PolymarketOpp) {
  try {
    const logs = JSON.parse(localStorage.getItem('prediction-alpha-log') || '[]')
    logs.push({ ...opp, loggedAt: new Date().toISOString() })
    localStorage.setItem('prediction-alpha-log', JSON.stringify(logs))
  } catch {}
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<PolymarketOpp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [durationFilter, setDurationFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all')
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced')
  const [activeTab, setActiveTab] = useState<Tab>('home')
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
      }
    } catch { setError('Failed to fetch') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchMarkets()
    const i = setInterval(fetchMarkets, 60000)
    return () => clearInterval(i)
  }, [])

  const filtered = opportunities.filter(o => {
    const days = getDaysUntil(o.endDate)
    if (durationFilter === 'week' && days > 7) return false
    if (durationFilter === 'month' && days > 30) return false
    if (durationFilter === 'quarter' && days > 90) return false
    const risk = getRiskLevel(o)
    if (riskProfile === 'conservative' && risk !== 'conservative') return false
    if (riskProfile === 'balanced' && risk === 'aggressive') return false
    return true
  })

  const hiddenCount = opportunities.length - filtered.length

  if (activeTab === 'settings') return (
    <main className="min-h-screen pb-20">
      <Header lastUpdated={lastUpdated} onRefresh={fetchMarkets} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="font-medium mb-3">Risk Profile</h3>
          {(['conservative','balanced','aggressive'] as RiskProfile[]).map(p => (
            <button key={p} onClick={() => setRiskProfile(p)} className={`w-full p-3 mb-2 rounded-lg text-left ${riskProfile === p ? 'bg-blue-600' : 'bg-gray-800'}`}>
              <div className="capitalize font-medium">{p}</div>
              <div className="text-xs opacity-70">{p === 'conservative' ? '>$1M volume' : p === 'balanced' ? '>$100K volume' : 'All markets'}</div>
            </button>
          ))}
        </div>
      </div>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )

  if (activeTab !== 'home') return (
    <main className="min-h-screen pb-20">
      <Header lastUpdated={lastUpdated} onRefresh={fetchMarkets} />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">{activeTab === 'arb' ? '📊' : activeTab === 'ev' ? '📈' : '🐋'}</div>
        <h2 className="text-xl font-bold mb-2">{activeTab === 'arb' ? 'Arbitrage' : activeTab === 'ev' ? '+EV' : 'Whales'}</h2>
        <p className="text-gray-400 mb-4">Coming soon</p>
        <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm">🔒 Pro</span>
      </div>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )

  return (
    <main className="min-h-screen pb-20">
      <Header lastUpdated={lastUpdated} onRefresh={fetchMarkets} />
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800 text-center py-4">
        <div className="text-sm text-gray-400">🔴 Live Markets</div>
        <div className="text-4xl font-bold text-green-400">{filtered.length}</div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
          {(['conservative','balanced','aggressive'] as RiskProfile[]).map(p => (
            <button key={p} onClick={() => setRiskProfile(p)} className={`flex-1 py-2 rounded-lg text-sm capitalize ${riskProfile === p ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-2 flex gap-2">
        {[{k:'all',l:'All'},{k:'week',l:'<1w'},{k:'month',l:'<1m'},{k:'quarter',l:'<3m'}].map(({k,l}) => (
          <button key={k} onClick={() => setDurationFilter(k as any)} className={`flex-1 py-2 rounded-lg text-sm ${durationFilter === k ? 'bg-purple-500/20 text-purple-400 border border-purple-500' : 'bg-gray-900 border border-gray-800'}`}>{l}</button>
        ))}
      </div>
      <div className="max-w-lg mx-auto px-4 py-2 space-y-3">
        {loading && !opportunities.length ? <div className="text-center py-8 text-gray-500">Loading...</div> : error ? <div className="text-center py-8 text-red-400">{error}</div> : filtered.map(o => (
          <div key={o.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between mb-2">
              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">Polymarket</span>
              <span className="text-xs text-gray-500">{formatVolume(o.volume)}</span>
            </div>
            <h3 className="font-medium mb-1">{o.title}</h3>
            <div className="text-xs text-gray-500 mb-3">⏱️ {formatDuration(o.endDate)}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2"><div className="text-xs text-gray-400">YES</div><div className="text-lg font-semibold text-green-400">{(o.yesPrice*100).toFixed(0)}¢</div></div>
              <div className="bg-gray-800/50 rounded-lg p-2"><div className="text-xs text-gray-400">NO</div><div className="text-lg font-semibold text-red-400">{(o.noPrice*100).toFixed(0)}¢</div></div>
            </div>
            <button onClick={() => { logToStorage(o); window.open(o.url, '_blank') }} className="w-full py-2 bg-blue-600 rounded-lg text-sm">Trade on Polymarket</button>
          </div>
        ))}
        {hiddenCount > 0 && <div className="text-center py-4 text-gray-500 text-sm">{hiddenCount} hidden. <button onClick={() => setRiskProfile('aggressive')} className="text-blue-400">Show all</button></div>}
      </div>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  )
}

function Header({ lastUpdated, onRefresh }: { lastUpdated: string | null, onRefresh: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Prediction Alpha</h1><p className="text-sm text-gray-400">Live Polymarket Data</p></div>
        <button onClick={onRefresh} className="text-xs bg-gray-800 px-3 py-1 rounded-lg">🔄 {lastUpdated || 'Refresh'}</button>
      </div>
    </header>
  )
}

function Nav({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-around">
        {[{k:'home',i:'🏠',l:'Home'},{k:'arb',i:'📊',l:'Arb'},{k:'ev',i:'📈',l:'+EV'},{k:'whales',i:'🐋',l:'Whales'},{k:'settings',i:'⚙️',l:'Settings'}].map(({k,i,l}) => (
          <button key={k} onClick={() => setActiveTab(k as Tab)} className={`flex flex-col items-center ${activeTab === k ? 'text-blue-400' : 'text-gray-500'}`}>
            <span className="text-xl">{i}</span><span className="text-xs">{l}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
