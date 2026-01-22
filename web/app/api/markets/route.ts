import { NextResponse } from 'next/server'

export async function GET() {
    try {
          // Use EVENTS endpoint - events have correct slugs for URLs
      const eventsRes = await fetch(
              'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=50'
            )
          if (!eventsRes.ok) throw new Error('Gamma API error')
          const events = await eventsRes.json()

      const nowTime = Date.now()
          const activeEvents = events.filter((e: any) => {
                  const endDate = e.endDate || e.end_date_iso
                  if (!endDate) return true
                  return new Date(endDate).getTime() > nowTime
          })

      const opportunities = activeEvents.slice(0, 25).map((e: any) => {
              let yesPrice = 0.5
              let volume = 0

                                                                // Get price from first market in the event
                                                                if (e.markets && e.markets.length > 0) {
                                                                          const m = e.markets[0]
                                                                          if (m.outcomePrices) {
                                                                                      try {
                                                                                                    const prices = JSON.parse(m.outcomePrices)
                                                                                                    if (prices && prices[0]) {
                                                                                                                    yesPrice = parseFloat(prices[0])
                                                                                                      }
                                                                                      } catch (err) {}
                                                                          }
                                                                          volume = parseFloat(m.volume || '0')
                                                                }

                                                                // Use event volume if available
                                                                if (e.volume) volume = parseFloat(e.volume)

                                                                const endDate = e.endDate || e.end_date_iso || null

                                                                return {
                                                                          id: e.id,
                                                                          type: 'polymarket',
                                                                          title: e.title || e.markets?.[0]?.question || 'Unknown',
                                                                          platform: 'Polymarket',
                                                                          yesPrice,
                                                                          noPrice: 1 - yesPrice,
                                                                          volume,
                                                                          liquidity: parseFloat(e.liquidity || '0'),
                                                                          endDate,
                                                                          url: e.slug ? `https://polymarket.com/event/${e.slug}` : 'https://polymarket.com',
                                                                }
      })

      const valid = opportunities
            .filter((o: any) => {
                      if (!o.title || o.title === 'Unknown') return false
                      if (o.yesPrice <= 0.01 || o.yesPrice >= 0.99) return false
                      return true
            })
            .sort((a: any, b: any) => b.volume - a.volume)

      return NextResponse.json({ opportunities: valid, fetchedAt: new Date().toISOString() })
    } catch (error: any) {
          console.error('API error:', error)
          return NextResponse.json({ error: error.message, opportunities: [] }, { status: 500 })
    }
}
