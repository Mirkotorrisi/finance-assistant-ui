import { StockQuoteCard } from './generated-ui/StockQuoteCard'
import { PortfolioCard } from './generated-ui/PortfolioCard'
import { MarketDataCard } from './generated-ui/MarketDataCard'
import { stockQuoteSchema, portfolioSchema, marketDataSchema } from '@/lib/schemas/financial'
import { UIRenderer } from '@/components/generated/UIRenderer'
import { uiContractSchema } from '@/lib/schemas/generated-ui'

interface ToolResultRendererProps {
  toolName: string
  result: unknown
}

export function ToolResultRenderer({ toolName, result }: ToolResultRendererProps) {
  try {
    // Check if result is a UI contract (for generated UI components)
    const uiValidation = uiContractSchema.safeParse(result)
    if (uiValidation.success) {
      return <UIRenderer contract={uiValidation.data} />
    }

    // Handle specific tool results (legacy support)
    switch (toolName) {
      case 'getStockQuote': {
        const data = stockQuoteSchema.parse(result)
        return <StockQuoteCard data={data} />
      }
      case 'getPortfolio': {
        const data = portfolioSchema.parse(result)
        return <PortfolioCard data={data} />
      }
      case 'getMarketData': {
        const data = marketDataSchema.parse(result)
        return <MarketDataCard data={data} />
      }
      default:
        return (
          <div className="p-4 bg-gray-100 rounded">
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return (
      <div className="p-4 bg-red-100 rounded text-red-800">
        <p className="font-semibold">Error rendering result:</p>
        <p className="text-sm">{errorMessage}</p>
      </div>
    )
  }
}
