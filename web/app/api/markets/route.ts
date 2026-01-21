import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=30', {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const markets = await response.json()

    const opportunities = markets
      .filter((m: any) => {
        const yes = parseFloat(m.outcomePrices?.[0] || '0')
        return yes > 0.05 && yes < 0.95 && parseFloat(m.volume || '0') > 1000
      })
      .map((m: any) => ({
        id: m.id,
        type: 'polymarket',
        title: m.question,
        platform: 'Polymarket',
        yesPrice: parseFloat(m.outcomePrices?.[0] || '0.5'),
        noPrice: parseFloat(m.outcomePrices?.[1] || '0.5'),
        volume: parseFloat(m.volume || '0'),
        endDate: m.endDate,
        url: `https://polymarket.com/event/${m.slug || m.id}`,
      }))
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 20)

    return NextResponse.json({ opportunities, fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Polymarket fetch error:', error)
    return NextResponse.json({ error: 'Failed', opportunities: [] }, { status: 500 })
  }
}
