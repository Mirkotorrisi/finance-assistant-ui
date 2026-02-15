import { componentRegistry } from './component-registry'
import { SummaryTable } from '@/components/generated/SummaryTable'
import { BasicChart } from '@/components/generated/BasicChart'
import { MetricCard } from '@/components/generated/MetricCard'
import { StockQuoteCard } from '@/components/chat/generated-ui/StockQuoteCard'
import { PortfolioCard } from '@/components/chat/generated-ui/PortfolioCard'
import { MarketDataCard } from '@/components/chat/generated-ui/MarketDataCard'
import {
  tableContractSchema,
  chartContractSchema,
  metricContractSchema,
} from '@/lib/schemas/generated-ui'
import {
  stockQuoteSchema,
  portfolioSchema,
  marketDataSchema,
} from '@/lib/schemas/financial'

// Register all components
export function registerComponents() {
  componentRegistry.register({
    key: 'summary-table',
    component: SummaryTable as never,
    description: 'Flexible table for financial data',
    dataSchema: tableContractSchema,
  })

  componentRegistry.register({
    key: 'basic-chart',
    component: BasicChart as never,
    description: 'Line, bar, or area chart',
    dataSchema: chartContractSchema,
  })

  componentRegistry.register({
    key: 'metric-card',
    component: MetricCard as never,
    description: 'Display key metric with trend',
    dataSchema: metricContractSchema,
  })

  componentRegistry.register({
    key: 'stock-quote',
    component: StockQuoteCard as never,
    description: 'Stock quote display',
    dataSchema: stockQuoteSchema,
  })

  componentRegistry.register({
    key: 'portfolio',
    component: PortfolioCard as never,
    description: 'Portfolio holdings display',
    dataSchema: portfolioSchema,
  })

  componentRegistry.register({
    key: 'market-data',
    component: MarketDataCard as never,
    description: 'Market fundamentals display',
    dataSchema: marketDataSchema,
  })
}
