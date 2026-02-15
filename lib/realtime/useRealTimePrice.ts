'use client'

import { useState, useEffect } from 'react'

interface RealTimePriceUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}

export function useRealTimePrice(symbol: string) {
  const [data, setData] = useState<RealTimePriceUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/price?symbol=${symbol}`)
    
    eventSource.onopen = () => {
      setIsConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data)
      setData(update)
    }
    
    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }
    
    return () => {
      eventSource.close()
    }
  }, [symbol])

  return { data, isConnected }
}
