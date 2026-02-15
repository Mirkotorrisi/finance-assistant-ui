import { z } from 'zod'

// Base UI contract
export const uiContractSchema = z.object({
  type: z.enum(['table', 'chart', 'metric', 'card']),
  componentKey: z.string(),
  data: z.unknown(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
})

export type UIContract = z.infer<typeof uiContractSchema>

// Table contract
export const tableContractSchema = z.object({
  type: z.literal('table'),
  componentKey: z.literal('summary-table'),
  data: z.object({
    columns: z.array(z.object({
      key: z.string(),
      header: z.string(),
      align: z.enum(['left', 'center', 'right']).optional()
    })),
    rows: z.array(z.record(z.string(), z.unknown()))
  }),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).optional()
})

export type TableContract = z.infer<typeof tableContractSchema>

// Chart contract
export const chartContractSchema = z.object({
  type: z.literal('chart'),
  componentKey: z.literal('basic-chart'),
  data: z.object({
    chartType: z.enum(['line', 'bar', 'area']),
    series: z.array(z.object({
      name: z.string(),
      data: z.array(z.number())
    })),
    labels: z.array(z.string()),
    xAxisLabel: z.string().optional(),
    yAxisLabel: z.string().optional()
  }),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).optional()
})

export type ChartContract = z.infer<typeof chartContractSchema>

// Metric contract
export const metricContractSchema = z.object({
  type: z.literal('metric'),
  componentKey: z.literal('metric-card'),
  data: z.object({
    value: z.union([z.string(), z.number()]),
    label: z.string(),
    trend: z.object({
      direction: z.enum(['up', 'down', 'neutral']),
      value: z.number().optional()
    }).optional(),
    format: z.enum(['currency', 'percentage', 'number', 'text']).optional()
  }),
  metadata: z.object({
    description: z.string().optional()
  }).optional()
})

export type MetricContract = z.infer<typeof metricContractSchema>
