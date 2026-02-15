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
  TableContract,
  ChartContract,
  MetricContract,
} from '@/lib/schemas/generated-ui'
import {
  stockQuoteSchema,
  portfolioSchema,
  marketDataSchema,
  StockQuote,
  Portfolio,
  MarketData,
} from '@/lib/schemas/financial'

// Register all components
export function registerComponents() {
  componentRegistry.register<{ contract: TableContract }>({
    key: 'summary-table',
    component: SummaryTable,
    description: 'Flexible table for financial data',
    dataSchema: tableContractSchema,
  })

  componentRegistry.register<{ contract: ChartContract }>({
    key: 'basic-chart',
    component: BasicChart,
    description: 'Line, bar, or area chart',
    dataSchema: chartContractSchema,
  })

  componentRegistry.register<{ contract: MetricContract }>({
    key: 'metric-card',
    component: MetricCard,
    description: 'Display key metric with trend',
    dataSchema: metricContractSchema,
  })

  componentRegistry.register<{ data: StockQuote }>({
    key: 'stock-quote',
    component: StockQuoteCard,
    description: 'Stock quote display',
    dataSchema: stockQuoteSchema,
  })

  componentRegistry.register<{ data: Portfolio }>({
    key: 'portfolio',
    component: PortfolioCard,
    description: 'Portfolio holdings display',
    dataSchema: portfolioSchema,
  })

  componentRegistry.register<{ data: MarketData }>({
    key: 'market-data',
    component: MarketDataCard,
    description: 'Market fundamentals display',
    dataSchema: marketDataSchema,
  })
}
