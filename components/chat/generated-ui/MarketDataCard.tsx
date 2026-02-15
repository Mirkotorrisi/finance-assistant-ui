import { Card } from '@/components/ui/card'
import { MarketData } from '@/lib/schemas/financial'

interface MarketDataCardProps {
  data: MarketData
}

export function MarketDataCard({ data }: MarketDataCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-bold text-xl">{data.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{data.symbol}</p>
      
      <div className="grid grid-cols-2 gap-4">
        {data.sector && (
          <div>
            <p className="text-sm text-gray-600">Sector</p>
            <p className="font-semibold">{data.sector}</p>
          </div>
        )}
        {data.industry && (
          <div>
            <p className="text-sm text-gray-600">Industry</p>
            <p className="font-semibold">{data.industry}</p>
          </div>
        )}
        {data.pe !== undefined && (
          <div>
            <p className="text-sm text-gray-600">P/E Ratio</p>
            <p className="font-semibold">{data.pe.toFixed(2)}</p>
          </div>
        )}
        {data.eps !== undefined && (
          <div>
            <p className="text-sm text-gray-600">EPS</p>
            <p className="font-semibold">${data.eps.toFixed(2)}</p>
          </div>
        )}
        {data.dividend !== undefined && (
          <div>
            <p className="text-sm text-gray-600">Dividend</p>
            <p className="font-semibold">${data.dividend.toFixed(2)}</p>
          </div>
        )}
        {data.beta !== undefined && (
          <div>
            <p className="text-sm text-gray-600">Beta</p>
            <p className="font-semibold">{data.beta.toFixed(2)}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
