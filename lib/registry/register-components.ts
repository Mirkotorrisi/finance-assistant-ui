import { componentRegistry } from './component-registry'
import { SummaryCards } from '@/components/finance/SummaryCards'
import { TransactionsTable } from '@/components/finance/TransactionsTable'
import { AccountsList } from '@/components/finance/AccountsList'
import { SpendingPie } from '@/components/finance/SpendingPie'
import { MonthlyBarChart } from '@/components/finance/MonthlyBarChart'
import { FormTransaction } from '@/components/finance/FormTransaction'
import { FormAccount } from '@/components/finance/FormAccount'

/** Register all whitelisted finance UI components. */
export function registerComponents() {
  componentRegistry.register({
    key: 'SummaryCards',
    component: SummaryCards as React.ComponentType<unknown>,
    description: 'Summary cards showing balance, income, expenses, and net for the current month',
  })

  componentRegistry.register({
    key: 'TransactionsTable',
    component: TransactionsTable as React.ComponentType<unknown>,
    description: 'Paginated table of financial transactions with optional filters',
  })

  componentRegistry.register({
    key: 'AccountsList',
    component: AccountsList as React.ComponentType<unknown>,
    description: 'List of financial accounts with current balances',
  })

  componentRegistry.register({
    key: 'SpendingPie',
    component: SpendingPie as React.ComponentType<unknown>,
    description: 'Pie chart of spending distribution by category or account',
  })

  componentRegistry.register({
    key: 'MonthlyBarChart',
    component: MonthlyBarChart as React.ComponentType<unknown>,
    description: 'Bar chart of monthly income, expenses, and net savings',
  })

  componentRegistry.register({
    key: 'FormTransaction',
    component: FormTransaction as React.ComponentType<unknown>,
    description: 'Form for creating a new financial transaction',
  })

  componentRegistry.register({
    key: 'FormAccount',
    component: FormAccount as React.ComponentType<unknown>,
    description: 'Form for creating a new financial account',
  })
}
