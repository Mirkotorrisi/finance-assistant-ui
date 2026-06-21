'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { hierarchy, pack, HierarchyCircularNode } from 'd3-hierarchy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency } from '@/lib/format'
import { categoryColor } from '@/lib/chart-colors'
import type { SpendingDistributionParams, DistributionItem } from '@/lib/types/financial-summary'

const PRESETS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
]

interface SpendingBubbleProps {
  title?: string
  params?: SpendingDistributionParams
  onCategoryClick?: (category: string, startDate: string, endDate: string) => void
}

interface RootDatum {
  children?: DistributionItem[]
  amount?: number
}

type FetchState = { loading: boolean; error: string | null; data: DistributionItem[] }
type FetchAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; data: DistributionItem[] }
  | { type: 'ERROR'; error: string }

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'START':  return { loading: true, error: null, data: state.data }
    case 'SUCCESS': return { loading: false, error: null, data: action.data }
    case 'ERROR':  return { loading: false, error: action.error, data: [] }
  }
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return isoDate(d)
}

export function SpendingBubble({ title = 'Spending by Category', params, onCategoryClick }: SpendingBubbleProps) {
  const [startDate, setStartDate] = useState(monthsAgo(6))
  const [endDate, setEndDate] = useState(isoDate(new Date()))
  const [activePreset, setActivePreset] = useState<number | null>(6)
  const [{ loading, error, data }, dispatch] = useReducer(fetchReducer, {
    loading: true,
    error: null,
    data: [],
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width || 600)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1)
    window.addEventListener('transactions-updated', refresh)
    return () => window.removeEventListener('transactions-updated', refresh)
  }, [])

  useEffect(() => {
    const resolvedParams: SpendingDistributionParams = params ?? {
      start_date: startDate,
      end_date: endDate,
      group_by: 'category',
    }
    dispatch({ type: 'START' })
    financialSummaryService
      .getSpendingDistribution(resolvedParams)
      .then((res) => dispatch({ type: 'SUCCESS', data: res.distribution }))
      .catch((err) => dispatch({ type: 'ERROR', error: err instanceof Error ? err.message : 'Failed to load data' }))
  }, [startDate, endDate, params, refreshKey])

  function handlePreset(months: number) {
    setActivePreset(months)
    setStartDate(monthsAgo(months))
    setEndDate(isoDate(new Date()))
  }

  const height = Math.max(320, width * 0.65)

  const packedLeaves: HierarchyCircularNode<RootDatum>[] = (() => {
    if (data.length === 0) return []
    const root = hierarchy<RootDatum>({ children: data })
      .sum((d: RootDatum) => Math.abs(d.amount ?? 0))
    const packedRoot = pack<RootDatum>().size([width, height]).padding(6)(root)
    return packedRoot.leaves()
  })()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!params && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.months}
                  size="sm"
                  variant={activePreset === p.months ? 'default' : 'outline'}
                  className="h-8 px-3 text-xs rounded-lg"
                  onClick={() => handlePreset(p.months)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setActivePreset(null) }}
                  className="h-8 w-36 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setActivePreset(null) }}
                  className="h-8 w-36 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <div ref={containerRef}>
          {loading ? (
            <div className="rounded-xl bg-muted animate-pulse" style={{ height }} />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for the selected period.</p>
          ) : (
            <>
              <svg width={width} height={height}>
                {packedLeaves.map((node: HierarchyCircularNode<RootDatum>) => {
                  const item = node.data as DistributionItem
                  const color = categoryColor(item.name)
                  const r = node.r
                  const nameFontSize = Math.max(9, Math.min(14, r / 3.5))
                  const amountFontSize = nameFontSize * 0.82
                  const showText = r > 28

                  return (
                    <g
                      key={item.name}
                      transform={`translate(${node.x},${node.y})`}
                      style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                      role={onCategoryClick ? 'button' : undefined}
                      tabIndex={onCategoryClick ? 0 : undefined}
                      aria-label={`${item.name}: ${formatCurrency(Math.abs(item.amount))}`}
                      onClick={() => onCategoryClick?.(item.name, startDate, endDate)}
                      onKeyDown={(e) => {
                        if (onCategoryClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          onCategoryClick(item.name, startDate, endDate)
                        }
                      }}
                    >
                      <circle r={r} fill={color} fillOpacity={0.88} />
                      {showText && (
                        <>
                          <text
                            textAnchor="middle"
                            dy="-0.25em"
                            fontSize={nameFontSize}
                            fontWeight="700"
                            fill="white"
                            style={{ pointerEvents: 'none' }}
                          >
                            {item.name.length > 12 ? item.name.slice(0, 11) + '…' : item.name}
                          </text>
                          <text
                            textAnchor="middle"
                            dy={nameFontSize + 2}
                            fontSize={amountFontSize}
                            fill="white"
                            fillOpacity={0.9}
                            style={{ pointerEvents: 'none' }}
                          >
                            {formatCurrency(Math.abs(item.amount))}
                          </text>
                        </>
                      )}
                      <title>{`${item.name}: ${formatCurrency(Math.abs(item.amount))} (${Math.abs(item.percent).toFixed(1)}%)`}</title>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 pt-2 border-t border-border/40">
                {[...data]
                  .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                  .map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 min-w-0 rounded-md px-1 -mx-1 transition-colors hover:bg-muted/60"
                      style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                      onClick={() => onCategoryClick?.(item.name, startDate, endDate)}
                    >
                      <span
                        className="shrink-0 inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColor(item.name) }}
                      />
                      <span className="truncate text-xs text-muted-foreground" title={item.name}>
                        {item.name}
                      </span>
                      <span className="ml-auto shrink-0 text-xs font-medium tabular-nums">
                        {formatCurrency(Math.abs(item.amount))}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
