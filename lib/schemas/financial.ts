import { z } from 'zod'

// Stock Quote Schema
export const stockQuoteSchema = z.object({
  symbol: z.string().min(1).max(10),
  price: z.number().positive(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number().int().positive(),
  marketCap: z.number().positive().optional(),
  timestamp: z.string().datetime()
})

export type StockQuote = z.infer<typeof stockQuoteSchema>

// Portfolio Schemas
export const portfolioItemSchema = z.object({
  symbol: z.string(),
  shares: z.number().positive(),
  avgCost: z.number().positive(),
  currentPrice: z.number().positive(),
  totalValue: z.number(),
  gainLoss: z.number(),
  gainLossPercent: z.number()
})

export const portfolioSchema = z.object({
  items: z.array(portfolioItemSchema),
  totalValue: z.number(),
  totalGainLoss: z.number(),
  totalGainLossPercent: z.number()
})

export type Portfolio = z.infer<typeof portfolioSchema>

// Market Data Schema
export const marketDataSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  pe: z.number().optional(),
  eps: z.number().optional(),
  dividend: z.number().optional(),
  beta: z.number().optional()
})

export type MarketData = z.infer<typeof marketDataSchema>
