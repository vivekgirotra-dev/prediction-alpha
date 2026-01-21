import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Step 1: Get active markets from Gamma API
    const marketsRes = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=30'
    )
    if (!marketsRes.ok) throw new Error('Gamma API error')
    const markets = await marketsRes.json()

    // Step 2: Get prices from CLOB for each market's token
    const opportunities = await Promise.all(
      markets.slice(0, 20).map(async (m: any) => {
        let yesPrice = 0.5
        
        // Get token ID (YES token is usually first)
        const tokenId = m.clobTokenIds?.[0] || m.conditionId
        
        if (tokenId) {
          try {
            const priceRes = await fetch(
              `https://clob.polymarket.com/midpoint?token_id=${tokenId}`
            )
            if (priceRes.ok) {
              const priceData = await priceRes.json()
              yesPrice = parseFloat(priceData.mid) || 0.5
            }
          } catch (e) {
            // Price fetch failed, use default
          }
        }

        return {
          id: m.id || m.conditionId,
          type: 'polymarket',
          title: m.question,
          platform: 'Polymarket',
          yesPrice,
          noPrice: 1 - yesPrice,
          volume: parseFloat(m.volume || '0'),
          liquidity: parseFloat(m.liquidity || '0'),
          endDate: m.endDate,
          url: `https://polymarket.com/event/${m.slug}`,
        }
      })
    )

    // Filter out invalid and sort by volume
    const valid = opportunities
      .filter((o: any) => o.title && o.yesPrice > 0.01 && o.yesPrice < 0.99)
      .sort((a: any, b: any) => b.volume - a.volume)

    return NextResponse.json({ opportunities: valid, fetchedAt: new Date().toISOString() })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message, opportunities: [] }, { status: 500 })
  }
}
