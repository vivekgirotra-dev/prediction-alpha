import { NextResponse } from 'next/server'

export async function GET() {
    try {
          const res = await fetch(
                  'https://data-api.polymarket.com/v1/leaderboard?category=OVERALL&limit=20'
                )

      if (!res.ok) throw new Error('Leaderboard API error')

      const data = await res.json()

      const whales = data.map((trader: any) => ({
              rank: trader.rank,
              address: trader.proxyWallet,
              username: trader.userName || trader.proxyWallet.slice(0, 8) + '...',
              volume: parseFloat(trader.vol || '0'),
              pnl: parseFloat(trader.pnl || '0'),
              profileImage: trader.profileImage || null,
              verified: trader.verifiedBadge || false,
      }))

      return NextResponse.json({
              whales,
              fetchedAt: new Date().toISOString()
      })
    } catch (error: any) {
          console.error('Whales API error:', error)
          return NextResponse.json(
            { error: error.message, whales: [] },
            { status: 500 }
                )
    }
}
