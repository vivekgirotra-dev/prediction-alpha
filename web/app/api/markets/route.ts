import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch active, open markets sorted by volume
    const response = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=50', {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) throw new Error(`Polymarket API error: ${response.status}`)

    const events = await response.json()

    const opportunities = events
      .filter((event: any) => {
        if (!event.markets || event.markets.length === 0) return false
        const market = event.markets[0]
        // Filter: must have prices and not be resolved
        const yesPrice = parseFloat(market.outcomePrices?.[0] || '0')
        const noPrice = parseFloat(market.outcomePrices?.[1] || '0')
        return yesPrice > 0.01 && yesPrice < 0.99 && noPrice > 0.01
      })
      .map((event: any) => {
        const market = event.markets[0]
        const yesPrice = parseFloat(market.outcomePrices?.[0] || '0.5')
        const noPrice = parseFloat(market.outcomePrices?.[1] || '0.5')

        return {
          id: market.id || event.id,
          type: 'polymarket',
          title: event.title || market.question,
          platform: 'Polymarket',
          yesPrice,
          noPrice,
          volume: parseFloat(market.volume || '0'),
          liquidity: parseFloat(market.liquidity || '0'),
          endDate: event.endDate || market.endDate,
          url: `https://polymarket.com/event/${event.slug}`,
        }
      })
      .sort((a: any, b: any) => b.volume - a.volume) // Sort by volume
      .slice(0, 20)

    return NextResponse.json({ opportunities, fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Failed to fetch Polymarket data:', error)
    return NextResponse.json({ error: 'Failed to fetch markets', opportunities: [] }, { status: 500 })
  }
}
