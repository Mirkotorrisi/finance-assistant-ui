'use client'

import { useEffect, useMemo, useReducer, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { distinctColors } from '@/lib/chart-colors'
import { transactionsService } from '@/lib/services/transactions.service'
import { accountsService } from '@/lib/services/accounts.service'
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format'
import {
  DEFAULT_SORT,
  accountOptions,
  nextSort,
  sortTransactions,
  toggleIn,
  visibleTransactions as applyChipFilters,
  type AccountKey,
  type SortKey,
  type SortState,
} from '@/lib/transaction-filters'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { CategoryEditor } from '@/components/finance/CategoryEditor'
import { TransactionSearch } from '@/components/finance/TransactionSearch'
import type { Transaction, TransactionFilters } from '@/lib/types/transaction'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

type ListState = { loading: boolean; error: string | null; transactions: Transaction[]; limit: number }
type ListAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; transactions: Transaction[] }
  | { type: 'ERROR'; error: string }
  | { type: 'REPLACE'; transaction: Transaction }
  | { type: 'MORE' }

function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case 'START': return { ...state, loading: true, error: null, limit: PAGE_SIZE }
    case 'SUCCESS': return { ...state, loading: false, transactions: action.transactions }
    case 'ERROR': return { ...state, loading: false, error: action.error }
    case 'REPLACE':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.transaction.id ? action.transaction : t)) }
    case 'MORE': return { ...state, limit: state.limit + PAGE_SIZE }
  }
}

interface TransactionsTableProps {
  title?: string
  params?: TransactionFilters
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'press inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium select-none',
        active
          ? 'border-border/80 bg-card text-foreground hover:border-foreground/30'
          : 'border-transparent bg-transparent text-muted-foreground/60 line-through hover:bg-muted',
      )}
    >
      {color && (
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full"
          style={{ background: color, opacity: active ? 1 : 0.35 }}
        />
      )}
      {children}
    </button>
  )
}

function SortableHead({
  column,
  label,
  sort,
  onSort,
  className,
}: {
  column: SortKey
  label: string
  sort: SortState
  onSort: (key: SortKey) => void
  className?: string
}) {
  const { t } = useTranslation()
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column)}
        title={t('transactions.sortBy', { column: label })}
        className={cn(
          'group/sort inline-flex items-center gap-1 rounded-sm -mx-1 px-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className?.includes('text-right') && 'flex-row-reverse',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60')} aria-hidden="true" />
      </button>
    </TableHead>
  )
}

export function TransactionsTable({ title, params }: TransactionsTableProps) {
  const { t } = useTranslation()
  const [{ loading, error, transactions, limit }, dispatch] = useReducer(listReducer, {
    loading: true,
    error: null,
    transactions: [],
    limit: PAGE_SIZE,
  })
  const [categories, setCategories] = useState<string[]>([])
  const [accountNames, setAccountNames] = useState<Map<number, string>>(new Map())
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())
  const [hiddenAccounts, setHiddenAccounts] = useState<Set<AccountKey>>(new Set())
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    transactionsService.getCategories().then(setCategories).catch(() => {})
    // inactive accounts too: old transactions still belong to them
    accountsService
      .list(false)
      .then((accounts) => setAccountNames(new Map(accounts.map((a) => [a.id, a.name]))))
      .catch(() => {})
  }, [refreshKey])

  useEffect(() => {
    dispatch({ type: 'START' })
    transactionsService
      .list(params)
      .then((transactions) => dispatch({ type: 'SUCCESS', transactions }))
      .catch((err) => dispatch({ type: 'ERROR', error: err instanceof Error ? err.message : t('transactions.error') }))
  }, [params, refreshKey, t])

  const toggleCategory = (category: string) => setHiddenCategories((prev) => toggleIn(prev, category))
  const toggleAccount = (key: AccountKey) => setHiddenAccounts((prev) => toggleIn(prev, key))
  const showAllCategories = () => setHiddenCategories(new Set())
  const hideAllCategories = () => setHiddenCategories(new Set(categories))

  const noAccountLabel = t('transactions.filters.noAccount')
  const accounts = useMemo(
    () => accountOptions(transactions, accountNames, noAccountLabel),
    [transactions, accountNames, noAccountLabel],
  )
  const categoryLabels = useMemo(() => {
    const labels = new Map<string, string>()
    for (const tx of transactions) {
      if (tx.category_label && !labels.has(tx.category)) labels.set(tx.category, tx.category_label)
    }
    return labels
  }, [transactions])
  const labelOf = (cat: string) => categoryLabels.get(cat) ?? cat
  // one color per category label, no clashes among the chips; the badge in each row uses the same map
  const colors = useMemo(() => distinctColors(categories.map((c) => categoryLabels.get(c) ?? c)), [categories, categoryLabels])

  const filteredTransactions = applyChipFilters(transactions, hiddenCategories, hiddenAccounts)
  const totals = useMemo(() => {
    let expenses = 0
    let income = 0
    for (const tx of filteredTransactions) {
      if (tx.amount < 0) expenses += tx.amount
      else income += tx.amount
    }
    return { expenses, income, net: expenses + income }
  }, [filteredTransactions])
  const accountName = (tx: Transaction) =>
    tx.account_id === null ? noAccountLabel : accountNames.get(tx.account_id) ?? `#${tx.account_id}`
  const sortedTransactions = useMemo(
    () => sortTransactions(filteredTransactions, sort, accountName),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accountName is derived from accountNames/noAccountLabel
    [filteredTransactions, sort, accountNames, noAccountLabel],
  )
  const visibleTransactions = sortedTransactions.slice(0, limit)
  const allCategoriesShown = hiddenCategories.size === 0
  const noCategoryShown = categories.length > 0 && categories.every((c) => hiddenCategories.has(c))

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title ?? t('transactions.defaultTitle')}</CardTitle>
        {!loading && !error && (
          <span className="num text-xs text-muted-foreground">
            {t('transactions.shown', { shown: visibleTransactions.length, total: filteredTransactions.length })}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {accounts.length > 1 && (
          <div className="mb-3">
            <span className="eyebrow mb-1.5 block">{t('transactions.filters.accounts')}</span>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <Chip key={String(a.key)} active={!hiddenAccounts.has(a.key)} onClick={() => toggleAccount(a.key)}>
                  {a.name}
                  <span className="num text-[10px] text-muted-foreground">{a.count}</span>
                </Chip>
              ))}
            </div>
          </div>
        )}
        {categories.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="eyebrow">{t('transactions.filters.categories')}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-border" />
              <button
                type="button"
                onClick={showAllCategories}
                disabled={allCategoriesShown}
                className="text-[11px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {t('transactions.filters.all')}
              </button>
              <button
                type="button"
                onClick={hideAllCategories}
                disabled={noCategoryShown}
                className="text-[11px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {t('transactions.filters.none')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Chip key={cat} active={!hiddenCategories.has(cat)} color={colors.get(labelOf(cat))} onClick={() => toggleCategory(cat)}>
                  {labelOf(cat)}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {!loading && !error && (
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-2.5">
            <span className="eyebrow">{t('transactions.totalsTitle')}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">{t('charts.expenses')}</span>
              <strong className="num text-sm font-semibold">{formatCurrency(totals.expenses)}</strong>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">{t('charts.income')}</span>
              <strong className="num text-sm font-semibold text-positive">{formatSignedCurrency(totals.income)}</strong>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">{t('charts.net')}</span>
              <strong className={cn('num text-sm font-semibold', totals.net >= 0 ? 'text-positive' : 'text-foreground')}>{formatSignedCurrency(totals.net)}</strong>
            </span>
            <span className="num ml-auto text-xs text-muted-foreground">{t('charts.txCount', { n: filteredTransactions.length })}</span>
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer h-9 rounded-md" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : visibleTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('transactions.noData')}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto border-t border-border/70 px-5 pt-1 sm:-mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead column="date" label={t('transactions.headers.date')} sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortableHead column="description" label={t('transactions.headers.description')} sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortableHead column="account" label={t('transactions.headers.account')} sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortableHead column="category" label={t('transactions.headers.category')} sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortableHead column="amount" label={t('transactions.headers.amount')} sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} className="text-right" />
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTransactions.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="num whitespace-nowrap text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell className="max-w-[520px]">
                      <span className="block truncate" title={tx.description}>{tx.description}</span>
                    </TableCell>
                    <TableCell className="max-w-[180px] whitespace-nowrap text-xs text-muted-foreground">
                      <span className="block truncate" title={accountName(tx)}>{accountName(tx)}</span>
                    </TableCell>
                    <TableCell>
                      <CategoryEditor
                        transaction={tx}
                        color={colors.get(tx.category_label ?? tx.category)}
                        onUpdated={(updated) => dispatch({ type: 'REPLACE', transaction: updated })}
                      />
                    </TableCell>
                    <TableCell
                      className={`num whitespace-nowrap text-right font-medium ${tx.amount >= 0 ? 'text-positive' : 'text-foreground'}`}
                    >
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="pl-1 pr-2 opacity-60 transition-opacity group-hover:opacity-100">
                      <TransactionSearch description={tx.description} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{t('transactions.shown', { shown: visibleTransactions.length, total: filteredTransactions.length })}</span>
              {filteredTransactions.length > limit && (
                <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'MORE' })}>
                  {t('transactions.showMore', { n: Math.min(PAGE_SIZE, filteredTransactions.length - limit) })}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
