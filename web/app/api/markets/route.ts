import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date().toISOString()
    const marketsRes = await fetch(
      `https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=50&end_date_min=${now}`
    )
    if (!marketsRes.ok) throw new Error('Gamma API error')
    const markets = await marketsRes.json()

    const nowTime = Date.now()
    const activeMarkets = markets.filter((m: any) => {
      const endDate = m.endDate || m.end_date_iso || m.endDateIso
      if (!endDate) return true
      return new Date(endDate).getTime() > nowTime
    })

    const opportunities = await Promise.all(
      activeMarkets.slice(0, 25).map(async (m: any) => {
        let yesPrice = 0.5

        if (m.outcomePrices) {
          try {
            const prices = JSON.parse(m.outcomePrices)
            if (prices && prices[0]) {
              yesPrice = parseFloat(prices[0])
            }
          } catch (e) {}
        }

        if (yesPrice === 0.5) {
          const tokenId = m.clobTokenIds?.[0] || m.conditionId
          if (tokenId) {
            try {
              const priceRes = await fetch(
                `https://clob.polymarket.com/midpoint?token_id=${tokenId}`
              )
              if (priceRes.ok) {
                const priceData = await priceRes.json()
                if (priceData.mid && parseFloat(priceData.mid) > 0) {
                  yesPrice = parseFloat(priceData.mid)
                }
              }
            } catch (e) {}
          }
        }

        const endDate = m.endDate || m.end_date_iso || m.endDateIso || null

        return {
          id: m.id || m.conditionId,
          type: 'polymarket',
          title: m.question,
          platform: 'Polymarket',
          yesPrice,
          noPrice: 1 - yesPrice,
          volume: parseFloat(m.volume || '0'),
          liquidity: parseFloat(m.liquidity || '0'),
          endDate,
          url: m.conditionId
            ? `https://polymarket.com/event/${m.conditionId}`
            : `https://polymarket.com`,
        }
      })
    )

    const valid = opportunities
      .filter((o: any) => {
        if (!o.title) return false
        if (o.yesPrice <= 0.01 || o.yesPrice >= 0.99) return false
        if (o.yesPrice === 0.5 && o.volume < 10000) return false
        return true
      })
      .sort((a: any, b: any) => b.volume - a.volume)

    return NextResponse.json({ opportunities: valid, fetchedAt: new Date().toISOString() })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message, opportunities: [] }, { status: 500 })
  }
}
