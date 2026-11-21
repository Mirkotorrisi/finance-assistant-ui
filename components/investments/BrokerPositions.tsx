'use client'

import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency, formatDate, formatSignedCurrency } from '@/lib/format'
import { avgCost, basisKey, needsAttention } from '@/lib/portfolio'
import type { ValuedPosition } from '@/lib/types/portfolio'
import { resultColor } from './InvestmentsView'

function money(value: number, currency: string | null): string {
  return formatCurrency(value, currency ?? 'EUR')
}

export function BrokerPositions({ positions, onEdit }: { positions: ValuedPosition[]; onEdit: (instrumentId: number | null) => void }) {
  const { t } = useTranslation()
  if (positions.length === 0) return <p className="text-sm text-muted-foreground">{t('portfolio.noPositions')}</p>
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('portfolio.col.instrument')}</TableHead>
            <TableHead className="text-right">{t('portfolio.col.quantity')}</TableHead>
            <TableHead className="text-right">{t('portfolio.col.avgCost')}</TableHead>
            <TableHead className="text-right">{t('portfolio.col.price')}</TableHead>
            <TableHead className="text-right">{t('portfolio.col.value')}</TableHead>
            <TableHead className="text-right">{t('portfolio.col.unrealized')}</TableHead>
            <TableHead>{t('portfolio.col.assetClass')}</TableHead>
            <TableHead>{t('portfolio.col.basis')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => {
            const avg = avgCost(p.open_cost, p.quantity)
            const attention = needsAttention(p)
            return (
              <TableRow key={p.key}>
                <TableCell className="min-w-56">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{[p.isin, p.symbol].filter(Boolean).join(' · ')}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{p.quantity ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{avg !== null ? money(avg, p.price_currency) : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {p.price !== null ? (
                    <span className={p.stale ? 'text-amber-700 dark:text-amber-400' : undefined} title={p.stale ? t('portfolio.stale') : undefined}>
                      {money(p.price, p.price_currency)}
                      <span className="block text-xs text-muted-foreground">{formatDate(p.price_date ?? undefined)}{p.fx ? ` · ${t('portfolio.fx')} ${p.fx}` : ''}</span>
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{p.value !== null ? formatCurrency(p.value) : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {p.unrealized !== null && p.price_basis !== 'cost' ? (
                    <span style={{ color: resultColor(p.unrealized) }}>{formatSignedCurrency(p.unrealized)}</span>
                  ) : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">{t(`portfolio.assetClass.${p.asset_class}`)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={attention ? 'destructive' : 'outline'} className="text-xs">{t(`portfolio.basis.${basisKey(p.price_basis)}`)}</Badge>
                  {attention && (
                    <Button variant="ghost" size="sm" className="ml-1 h-7 gap-1 px-2 text-xs" onClick={() => onEdit(p.instrument_id)}>
                      <AlertTriangle className="h-3 w-3" />
                      {t('portfolio.fix')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
