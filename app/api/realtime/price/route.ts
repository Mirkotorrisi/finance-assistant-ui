import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Mock function to fetch real-time price
async function fetchRealTimePrice(symbol: string) {
  // Simulate fetching price data
  const basePrices: Record<string, number> = {
    'AAPL': 178.25,
    'GOOGL': 142.50,
    'MSFT': 378.90,
    'TSLA': 245.75,
    'AMZN': 155.60,
  }
  
  const basePrice = basePrices[symbol] || 100
  const randomChange = (Math.random() - 0.5) * 2
  const price = basePrice + randomChange
  const change = randomChange
  const changePercent = (randomChange / basePrice) * 100
  
  return {
    symbol,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    timestamp: new Date().toISOString()
  }
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  
  if (!symbol) {
    return new Response('Symbol required', { status: 400 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const priceData = await fetchRealTimePrice(symbol.toUpperCase())
          const data = `data: ${JSON.stringify(priceData)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch (error) {
          console.error('Error fetching real-time price:', error)
          clearInterval(interval)
          controller.close()
        }
      }, 5000)
      
      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
