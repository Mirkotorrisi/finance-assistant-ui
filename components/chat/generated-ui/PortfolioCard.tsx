import { Card } from '@/components/ui/card'
import { Portfolio } from '@/lib/schemas/financial'

interface PortfolioCardProps {
  data: Portfolio
}

export function PortfolioCard({ data }: PortfolioCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-bold text-xl mb-4">Portfolio Summary</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Total Value:</span>
          <span className="font-semibold">${data.totalValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Gain/Loss:</span>
          <span className={data.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${data.totalGainLoss.toLocaleString()} ({data.totalGainLossPercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {data.items.map((item) => (
          <div key={item.symbol} className="border-t pt-2">
            <div className="flex justify-between">
              <span className="font-semibold">{item.symbol}</span>
              <span>${item.currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{item.shares} shares @ ${item.avgCost.toFixed(2)}</span>
              <span className={item.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                {item.gainLoss >= 0 ? '+' : ''}{item.gainLossPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
