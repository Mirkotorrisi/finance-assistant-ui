import { tool } from 'ai'
import { z } from 'zod'
import { stockQuoteSchema, portfolioSchema, marketDataSchema, StockQuote, Portfolio, MarketData } from '@/lib/schemas/financial'
import { tableContractSchema, chartContractSchema, TableContract, ChartContract } from '@/lib/schemas/generated-ui'

// Tool to get stock quotes
export const getStockQuote = tool({
  description: 'Get real-time stock quote for a given symbol',
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, GOOGL)')
  }),
  execute: async function({ symbol }: { symbol: string }): Promise<StockQuote> {
    // Mock data for testing - in production, this would call a real API
    const normalizedSymbol = symbol.toUpperCase()
    
    // Mock different stocks
    const mockData: Record<string, {
      price: number
      change: number
      volume: number
      marketCap?: number
    }> = {
      'AAPL': { price: 178.25, change: 2.45, volume: 52340000, marketCap: 2800000000000 },
      'GOOGL': { price: 142.50, change: -1.20, volume: 21500000, marketCap: 1800000000000 },
      'MSFT': { price: 378.90, change: 5.30, volume: 23100000, marketCap: 2850000000000 },
      'TSLA': { price: 245.75, change: -3.15, volume: 95000000, marketCap: 780000000000 },
      'AMZN': { price: 155.60, change: 1.80, volume: 42000000, marketCap: 1600000000000 },
    }
    
    const data = mockData[normalizedSymbol] || {
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      volume: Math.floor(10000000 + Math.random() * 50000000),
      marketCap: Math.floor(50000000000 + Math.random() * 500000000000)
    }
    
    const changePercent = (data.change / (data.price - data.change)) * 100
    
    const result = {
      symbol: normalizedSymbol,
      price: data.price,
      change: data.change,
      changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      timestamp: new Date().toISOString()
    }
    
    // Validate the result matches the schema
    return stockQuoteSchema.parse(result)
  }
})

// Tool to get user portfolio
export const getPortfolio = tool({
  description: 'Get user portfolio with holdings and performance',
  inputSchema: z.object({
    userId: z.string().optional().describe('User ID, defaults to current user')
  }),
  execute: async function({ userId }: { userId?: string }): Promise<Portfolio> {
    // Mock portfolio data
    const mockHoldings = [
      {
        symbol: 'AAPL',
        shares: 50,
        avgCost: 150.00,
        currentPrice: 178.25
      },
      {
        symbol: 'GOOGL',
        shares: 30,
        avgCost: 145.00,
        currentPrice: 142.50
      },
      {
        symbol: 'MSFT',
        shares: 25,
        avgCost: 320.00,
        currentPrice: 378.90
      }
    ]
    
    const items = mockHoldings.map(holding => {
      const totalValue = holding.shares * holding.currentPrice
      const costBasis = holding.shares * holding.avgCost
      const gainLoss = totalValue - costBasis
      const gainLossPercent = (gainLoss / costBasis) * 100
      
      return {
        symbol: holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice: holding.currentPrice,
        totalValue,
        gainLoss,
        gainLossPercent
      }
    })
    
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)
    const totalCost = items.reduce((sum, item) => sum + (item.shares * item.avgCost), 0)
    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100
    
    const result = {
      items,
      totalValue,
      totalGainLoss,
      totalGainLossPercent
    }
    
    // Validate the result matches the schema
    return portfolioSchema.parse(result)
  }
})

// Tool to get market data
export const getMarketData = tool({
  description: 'Get detailed market data and fundamentals for a stock',
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol')
  }),
  execute: async function({ symbol }: { symbol: string }): Promise<MarketData> {
    const normalizedSymbol = symbol.toUpperCase()
    
    // Mock market data for different stocks
    const mockMarketData: Record<string, {
      name: string
      sector?: string
      industry?: string
      pe?: number
      eps?: number
      dividend?: number
      beta?: number
    }> = {
      'AAPL': {
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        pe: 29.5,
        eps: 6.05,
        dividend: 0.96,
        beta: 1.24
      },
      'GOOGL': {
        name: 'Alphabet Inc.',
        sector: 'Communication Services',
        industry: 'Internet Content & Information',
        pe: 25.8,
        eps: 5.52,
        dividend: 0,
        beta: 1.06
      },
      'MSFT': {
        name: 'Microsoft Corporation',
        sector: 'Technology',
        industry: 'Software - Infrastructure',
        pe: 35.2,
        eps: 10.75,
        dividend: 2.72,
        beta: 0.89
      },
      'TSLA': {
        name: 'Tesla, Inc.',
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers',
        pe: 65.4,
        eps: 3.76,
        dividend: 0,
        beta: 2.03
      },
      'AMZN': {
        name: 'Amazon.com, Inc.',
        sector: 'Consumer Cyclical',
        industry: 'Internet Retail',
        pe: 48.2,
        eps: 3.23,
        dividend: 0,
        beta: 1.15
      }
    }
    
    const data = mockMarketData[normalizedSymbol] || {
      name: `${normalizedSymbol} Corporation`,
      sector: 'Technology',
      industry: 'Software',
      pe: 20 + Math.random() * 30,
      eps: Math.random() * 10,
      dividend: Math.random() * 2,
      beta: 0.5 + Math.random() * 1.5
    }
    
    const result = {
      symbol: normalizedSymbol,
      ...data
    }
    
    // Validate the result matches the schema
    return marketDataSchema.parse(result)
  }
})

// Tool to get financial summary table
export const getFinancialSummary = tool({
  description: 'Get a summary table of financial data',
  inputSchema: z.object({
    category: z.enum(['income', 'expenses', 'assets', 'liabilities']).describe('Financial category to summarize')
  }),
  execute: async function({ category }: { category: string }): Promise<TableContract> {
    // Mock data - replace with real API call
    const mockData = {
      type: 'table' as const,
      componentKey: 'summary-table' as const,
      data: {
        columns: [
          { key: 'item', header: 'Item', align: 'left' as const },
          { key: 'amount', header: 'Amount', align: 'right' as const },
          { key: 'change', header: 'Change (%)', align: 'right' as const }
        ],
        rows: [
          { item: 'Salary', amount: 5000, change: 5.2 },
          { item: 'Investments', amount: 1200, change: -2.1 },
          { item: 'Other', amount: 300, change: 0 }
        ]
      },
      metadata: {
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Summary`,
        description: `Overview of your ${category}`
      }
    }

    return tableContractSchema.parse(mockData)
  }
})

// Tool to get performance chart
export const getPerformanceChart = tool({
  description: 'Get a performance chart for financial data',
  inputSchema: z.object({
    metric: z.enum(['net-worth', 'spending', 'income']).describe('Metric to chart'),
    period: z.enum(['week', 'month', 'year']).describe('Time period')
  }),
  execute: async function({ metric, period }: { metric: string; period: string }): Promise<ChartContract> {
    // Mock data - replace with real API call
    const mockData = {
      type: 'chart' as const,
      componentKey: 'basic-chart' as const,
      data: {
        chartType: 'line' as const,
        series: [
          { name: metric, data: [1000, 1200, 1100, 1400, 1600, 1500] }
        ],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        xAxisLabel: 'Month',
        yAxisLabel: 'Amount ($)'
      },
      metadata: {
        title: `${metric} Trend`,
        description: `${period} performance for ${metric}`
      }
    }

    return chartContractSchema.parse(mockData)
  }
})

// Export all tools
export const tools = {
  getStockQuote,
  getPortfolio,
  getMarketData,
  getFinancialSummary,
  getPerformanceChart
}
