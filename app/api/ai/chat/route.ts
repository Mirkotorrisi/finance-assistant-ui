/**
 * Chat API route – the brain of the generative UI architecture.
 *
 * Priority:
 * 1. If CHAT_PLAN_URL is set: forward the request to that endpoint and return its UI plan.
 * 2. If USE_MOCK_PLAN=true: generate a mock UI plan locally (dev / demo mode).
 * 3. Otherwise: use OpenAI with real backend tool-calls to build a UI plan.
 *
 * The response is a plain-text stream that ends with the UI_METADATA_MARKER followed by
 * the JSON-encoded UIPlan.  ChatContainer splits these and feeds the plan to UIRenderer.
 */

import { openai } from '@ai-sdk/openai'
import { generateText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import type { UIPlan, UIPlanComponent } from '@/lib/types/ui-plan'

// Marker used to embed ui_metadata from the plan inside a plain text stream.
// ChatContainer parses this marker out of assistant messages and renders the
// appropriate UI components via UIRenderer.
export const UI_METADATA_MARKER = '__UI_METADATA__:'

export const maxDuration = 30

// ---------------------------------------------------------------------------
// Shared stream helper
// ---------------------------------------------------------------------------
function makeTextStream(text: string, plan?: UIPlan): Response {
  const encoder = new TextEncoder()
  let output = text
  if (plan) {
    output += `\n\n${UI_METADATA_MARKER}${JSON.stringify(plan)}`
  }
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(output))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// ---------------------------------------------------------------------------
// 1) Forward to a configurable backend chat/plan endpoint
// ---------------------------------------------------------------------------
async function forwardToChatPlanUrl(
  url: string,
  messages: unknown[],
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
  } catch (err) {
    throw new Error(
      `Failed to connect to CHAT_PLAN_URL at ${url}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  if (!response.ok) {
    throw new Error(`CHAT_PLAN_URL returned status ${response.status}`)
  }
  const data: { text?: string; plan?: UIPlan } = await response.json()
  return makeTextStream(data.text ?? '', data.plan)
}

// ---------------------------------------------------------------------------
// 2) Mock plan generator – keyword matching for local dev / demo
// ---------------------------------------------------------------------------
const CURRENT_MONTH = (() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})()

const CURRENT_YEAR = new Date().getFullYear()

function buildMockPlan(userMessage: string): UIPlan {
  const msg = userMessage.toLowerCase()

  const components: UIPlanComponent[] = []
  let order = 0

  const wants = (keywords: string[]) => keywords.some((k) => msg.includes(k))

  if (wants(['overview', 'dashboard', 'summary', 'how am i doing', "how's my"])) {
    components.push(
      { type: 'SummaryCards', order: order++, title: 'Financial Overview' },
      {
        type: 'MonthlyBarChart',
        order: order++,
        title: `Monthly Overview ${CURRENT_YEAR}`,
        action: {
          service: 'financialData',
          method: 'getByYear',
          params: { year: CURRENT_YEAR },
        },
      },
    )
  }

  if (wants(['transaction', 'expense', 'spending', 'spent', 'payment', 'history'])) {
    components.push({
      type: 'TransactionsTable',
      order: order++,
      title: 'Recent Transactions',
      action: { service: 'transactions', method: 'list', params: {} },
    })
  }

  if (wants(['account', 'balance', 'wallet', 'bank'])) {
    components.push({
      type: 'AccountsList',
      order: order++,
      title: 'My Accounts',
      action: { service: 'accounts', method: 'list', params: {} },
    })
  }

  if (wants(['pie', 'distribution', 'breakdown', 'category', 'categories'])) {
    components.push({
      type: 'SpendingPie',
      order: order++,
      title: 'Spending by Category',
      action: {
        service: 'financialSummary',
        method: 'getSpendingDistribution',
        params: { group_by: 'category' },
      },
    })
  }

  if (wants(['chart', 'bar', 'monthly', 'month', 'trend'])) {
    components.push({
      type: 'MonthlyBarChart',
      order: order++,
      title: `Monthly Overview ${CURRENT_YEAR}`,
      action: {
        service: 'financialData',
        method: 'getByYear',
        params: { year: CURRENT_YEAR },
      },
    })
  }

  if (wants(['add transaction', 'new transaction', 'record transaction', 'log expense'])) {
    components.push({
      type: 'FormTransaction',
      order: order++,
      title: 'Add Transaction',
    })
  }

  if (wants(['add account', 'new account', 'create account', 'open account'])) {
    components.push({ type: 'FormAccount', order: order++, title: 'Add Account' })
  }

  // Default: show summary + transactions
  if (components.length === 0) {
    components.push(
      { type: 'SummaryCards', order: 0, title: 'Financial Overview' },
      {
        type: 'TransactionsTable',
        order: 1,
        title: 'Recent Transactions',
        action: { service: 'transactions', method: 'list', params: {} },
      },
    )
  }

  return {
    text: `Here is your financial data based on your request.`,
    components,
  }
}

// ---------------------------------------------------------------------------
// 3) OpenAI with real backend tool definitions
// ---------------------------------------------------------------------------
const financeTools = {
  getTransactions: tool({
    description: 'Fetch a list of transactions, optionally filtered by category or date range',
    inputSchema: z.object({
      category: z.string().optional().describe('Filter by category'),
      start_date: z.string().optional().describe('Start date YYYY-MM-DD'),
      end_date: z.string().optional().describe('End date YYYY-MM-DD'),
      account_id: z.number().optional().describe('Filter by account ID'),
    }),
    execute: async (params) => ({
      type: 'TransactionsTable',
      title: 'Transactions',
      action: { service: 'transactions', method: 'list', params },
    }),
  }),
  getAccounts: tool({
    description: 'Fetch all financial accounts',
    inputSchema: z.object({
      active_only: z.boolean().optional().describe('Only return active accounts'),
    }),
    execute: async (params) => ({
      type: 'AccountsList',
      title: 'My Accounts',
      action: { service: 'accounts', method: 'list', params },
    }),
  }),
  getMonthlySummary: tool({
    description: 'Get a financial summary for a specific month (YYYY-MM)',
    inputSchema: z.object({
      month: z.string().describe('Month in YYYY-MM format'),
    }),
    execute: async (params) => ({
      type: 'SummaryCards',
      title: `Summary for ${params.month}`,
      action: { service: 'financialSummary', method: 'getMonthly', params },
    }),
  }),
  getSpendingDistribution: tool({
    description: 'Get spending distribution by category or account for a date range',
    inputSchema: z.object({
      start_date: z.string().describe('Start date YYYY-MM-DD'),
      end_date: z.string().describe('End date YYYY-MM-DD'),
      group_by: z.enum(['category', 'account']).optional(),
    }),
    execute: async (params) => ({
      type: 'SpendingPie',
      title: 'Spending Distribution',
      action: { service: 'financialSummary', method: 'getSpendingDistribution', params },
    }),
  }),
  getMonthlyChart: tool({
    description: 'Show a bar chart of monthly income and expenses for a given year',
    inputSchema: z.object({
      year: z.number().describe('Year (e.g. 2024)'),
    }),
    execute: async (params) => ({
      type: 'MonthlyBarChart',
      title: `Monthly Overview ${params.year}`,
      action: { service: 'financialData', method: 'getByYear', params },
    }),
  }),
  showAddTransactionForm: tool({
    description: 'Show a form so the user can add a new transaction',
    inputSchema: z.object({}),
    execute: async () => ({
      type: 'FormTransaction',
      title: 'Add Transaction',
    }),
  }),
  showAddAccountForm: tool({
    description: 'Show a form so the user can add a new account',
    inputSchema: z.object({}),
    execute: async () => ({
      type: 'FormAccount',
      title: 'Add Account',
    }),
  }),
}

async function handleWithOpenAI(messages: { role: string; content: string }[]): Promise<Response> {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are a helpful personal finance assistant.
You help users understand their finances using the available tools.
Always use the appropriate tool(s) to answer the user's request.
Only use the provided tools – do not invent data.
Today is ${new Date().toISOString().split('T')[0]}. Current month: ${CURRENT_MONTH}. Current year: ${CURRENT_YEAR}.`,
    messages: messages as { role: 'user' | 'assistant' | 'system'; content: string }[],
    tools: financeTools,
    stopWhen: stepCountIs(3),
  })

  // Collect tool results as UI plan components
  const components: UIPlanComponent[] = []
  let order = 0

  for (const step of result.steps ?? []) {
    for (const toolResult of step.toolResults ?? []) {
      const r = toolResult.output as Record<string, unknown>
      if (r && typeof r.type === 'string') {
        components.push({
          type: r.type as UIPlanComponent['type'],
          order: order++,
          title: typeof r.title === 'string' ? r.title : undefined,
          action: r.action as UIPlanComponent['action'],
        })
      }
    }
  }

  const plan: UIPlan | undefined =
    components.length > 0
      ? { text: result.text, components }
      : undefined

  return makeTextStream(result.text, plan)
}

/** Raw shape of a chat message coming from the client request body. */
interface RawChatMessage {
  role: string
  content?: string
  parts?: { type: string; text?: string }[]
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 1) Configurable backend endpoint
    const chatPlanUrl = process.env.CHAT_PLAN_URL
    if (chatPlanUrl) {
      return await forwardToChatPlanUrl(chatPlanUrl, messages)
    }

    // 2) Mock plan (local dev feature flag)
    if (process.env.USE_MOCK_PLAN === 'true') {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      const text: string = lastUser?.content ?? ''
      const plan = buildMockPlan(text)
      return makeTextStream(plan.text, plan)
    }

    // 3) OpenAI fallback
    const formattedMessages = messages.map((msg: RawChatMessage) => ({
      role: msg.role,
      content: msg.parts
        ? msg.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('')
        : msg.content ?? '',
    }))

    return await handleWithOpenAI(formattedMessages)
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
