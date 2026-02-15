import { Card } from '@/components/ui/card'
import { StockQuote } from '@/lib/schemas/financial'

interface StockQuoteCardProps {
  data: StockQuote
}

export function StockQuoteCard({ data }: StockQuoteCardProps) {
  const isPositive = data.change >= 0
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-2xl">{data.symbol}</h3>
          <p className="text-3xl font-semibold">${data.price.toFixed(2)}</p>
        </div>
        <div className={`text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <p className="font-semibold">
            {isPositive ? '+' : ''}{data.change.toFixed(2)}
          </p>
          <p className="text-sm">
            ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Volume: {data.volume.toLocaleString()}</p>
        {data.marketCap && (
          <p>Market Cap: ${(data.marketCap / 1e9).toFixed(2)}B</p>
        )}
      </div>
    </Card>
  )
}
