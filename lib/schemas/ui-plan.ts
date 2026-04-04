import { z } from 'zod'

/** Whitelisted component types – any other value will be rejected at runtime. */
export const whitelistedComponentTypes = [
  'SummaryCards',
  'TransactionsTable',
  'AccountsList',
  'SpendingPie',
  'MonthlyBarChart',
  'FormTransaction',
  'FormAccount',
] as const

export const whitelistedComponentTypeSchema = z.enum(whitelistedComponentTypes)

export const serviceNameSchema = z.enum([
  'transactions',
  'accounts',
  'financialData',
  'financialSummary',
  'health',
])

export const componentActionSchema = z.object({
  service: serviceNameSchema,
  method: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
})

export const uiPlanComponentSchema = z.object({
  type: whitelistedComponentTypeSchema,
  order: z.number().int().nonnegative(),
  title: z.string().optional(),
  action: componentActionSchema.optional(),
})

export const uiPlanSchema = z.object({
  text: z.string(),
  components: z.array(uiPlanComponentSchema),
})

export type UIPlanComponent = z.infer<typeof uiPlanComponentSchema>
export type UIPlan = z.infer<typeof uiPlanSchema>
