'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { hierarchy, pack, HierarchyCircularNode } from 'd3-hierarchy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { financialSummaryService } from '@/lib/services/financial-summary.service'
import { formatCurrency, formatWholeCurrency } from '@/lib/format'
import { isoDate, periodStart } from '@/lib/periods'
import { distinctColors } from '@/lib/chart-colors'
import type { SpendingDistributionParams, DistributionItem } from '@/lib/types/financial-summary'
import { useTranslation } from '@/lib/i18n'

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

type FetchState = { loading: boolean; error: string | null; data: DistributionItem[]; total: number }
type FetchAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; data: DistributionItem[]; total: number }
  | { type: 'ERROR'; error: string }

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'START':  return { ...state, loading: true, error: null }
    case 'SUCCESS': return { loading: false, error: null, data: action.data, total: action.total }
    case 'ERROR':  return { loading: false, error: action.error, data: [], total: 0 }
  }
}

/** Where the tooltip of a hovered bubble sits: above the circle, kept inside the chart width. */
function tooltipPosition(node: { x: number; y: number; r: number }, width: number) {
  const margin = 90
  return {
    left: Math.min(Math.max(node.x, margin), Math.max(margin, width - margin)),
    top: Math.max(node.y - node.r - 8, 0),
  }
}

export function SpendingBubble({ title, params, onCategoryClick }: SpendingBubbleProps) {
  const { t } = useTranslation()
  const [startDate, setStartDate] = useState(periodStart(1))
  const [endDate, setEndDate] = useState(isoDate(new Date()))
  const [activePreset, setActivePreset] = useState<number | null>(1)
  const [{ loading, error, data, total }, dispatch] = useReducer(fetchReducer, {
    loading: true,
    error: null,
    data: [],
    total: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

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
      .then((res) => dispatch({ type: 'SUCCESS', data: res.distribution, total: res.total_amount }))
      .catch((err) => dispatch({ type: 'ERROR', error: err instanceof Error ? err.message : t('charts.bubbleError') }))
  }, [startDate, endDate, params, refreshKey, t])

  function handlePreset(months: number) {
    setActivePreset(months)
    setStartDate(periodStart(months))
    setEndDate(isoDate(new Date()))
  }

  // tall enough that most bubbles can carry their amount: a squarer canvas packs bigger circles
  const height = Math.round(Math.min(720, Math.max(380, width * 0.68)))

  const packedLeaves: HierarchyCircularNode<RootDatum>[] = (() => {
    if (data.length === 0) return []
    const root = hierarchy<RootDatum>({ children: data })
      .sum((d: RootDatum) => Math.abs(d.amount ?? 0))
    const packedRoot = pack<RootDatum>().size([width, height]).padding(4)(root)
    return packedRoot.leaves()
  })()

  const colors = distinctColors(data.map((d) => d.name))
  const colorOf = (name: string) => colors.get(name) ?? 'var(--muted-foreground)'
  const txCount = data.reduce((s, d) => s + (d.count ?? 0), 0)
  const hoveredNode = hovered ? packedLeaves.find((n) => (n.data as DistributionItem).name === hovered) : undefined
  const hoveredItem = hoveredNode?.data as DistributionItem | undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('charts.spendingByCategory')}</CardTitle>
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
                  className="h-8 px-3 text-xs"
                  onClick={() => handlePreset(p.months)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('common.from')}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setActivePreset(null) }}
                  className="num h-8 w-36 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('common.to')}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setActivePreset(null) }}
                  className="num h-8 w-36 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="text-muted-foreground">{t('charts.periodTotal')}</span>
            <strong className="num text-base font-semibold">{formatCurrency(total)}</strong>
            <span className="num text-xs text-muted-foreground">· {t('charts.txCount', { n: txCount })}</span>
          </p>
        )}

        <div ref={containerRef}>
          {loading ? (
            <div className="shimmer rounded-xl" style={{ height }} />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('charts.noPeriodData')}</p>
          ) : (
            <>
              <div className="relative" onMouseLeave={() => setHovered(null)}>
                <svg width={width} height={height} className="block">
                  {packedLeaves.map((node: HierarchyCircularNode<RootDatum>) => {
                    const item = node.data as DistributionItem
                    const r = node.r
                    const color = colorOf(item.name)
                    const nameFontSize = Math.max(8, Math.min(14, r / 3.2))
                    const amountFontSize = Math.max(8, nameFontSize * 0.85)
                    const showText = r > 18
                    const showAmount = r > 24
                    // the amount in cents from r≈44 up; whole euros below, so small bubbles still carry a figure
                    const amountText = r > 44 ? formatCurrency(Math.abs(item.amount)) : formatWholeCurrency(Math.abs(item.amount))
                    const maxChars = Math.max(4, Math.floor((r * 2 - 6) / (nameFontSize * 0.58)))
                    const nameText = item.name.length > maxChars ? item.name.slice(0, Math.max(3, maxChars - 1)) + '…' : item.name
                    const isHovered = hovered === item.name
                    const dimmed = hovered !== null && !isHovered

                    return (
                      <g
                        key={item.name}
                        transform={`translate(${node.x},${node.y})`}
                        style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                        role={onCategoryClick ? 'button' : undefined}
                        tabIndex={onCategoryClick ? 0 : undefined}
                        onMouseEnter={() => setHovered(item.name)}
                        onFocus={() => setHovered(item.name)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${item.name}: ${formatCurrency(Math.abs(item.amount))}`}
                        onClick={() => onCategoryClick?.(item.name, startDate, endDate)}
                        onKeyDown={(e) => {
                          if (onCategoryClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onCategoryClick(item.name, startDate, endDate)
                          }
                        }}
                      >
                        <circle
                          r={r}
                          fill={color}
                          stroke={isHovered ? 'var(--foreground)' : 'var(--card)'}
                          strokeWidth={isHovered ? 2.5 : 2}
                          fillOpacity={dimmed ? 0.25 : 0.92}
                          className="transition-[fill-opacity,stroke] duration-200"
                        />
                        {showText && (
                          <g
                            opacity={dimmed ? 0.35 : 1}
                            className="transition-opacity duration-200"
                            style={{ pointerEvents: 'none', paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.22)', strokeWidth: 2 }}
                          >
                            <text textAnchor="middle" dy={showAmount ? '-0.2em' : '0.35em'} fontSize={nameFontSize} fontWeight="700" fill="white">
                              {nameText}
                            </text>
                            {showAmount && (
                              <text textAnchor="middle" dy={nameFontSize + 1} fontSize={amountFontSize} fill="white" fillOpacity={0.92}>
                                {amountText}
                              </text>
                            )}
                          </g>
                        )}
                      </g>
                    )
                  })}
                </svg>

                {hoveredNode && hoveredItem && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-pop"
                    style={tooltipPosition(hoveredNode, width)}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(hoveredItem.name) }} />
                      <span className="whitespace-nowrap">{hoveredItem.name}</span>
                    </div>
                    <div className="num mt-0.5 whitespace-nowrap text-muted-foreground">
                      {formatCurrency(Math.abs(hoveredItem.amount))} · {Math.abs(hoveredItem.percent).toFixed(1)}% · {t('charts.txCount', { n: hoveredItem.count })}
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 pt-2 border-t border-border/40">
                {[...data]
                  .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                  .map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center gap-2 min-w-0 rounded-md px-1 -mx-1 transition-colors hover:bg-muted/60 ${hovered === item.name ? 'bg-muted/60' : ''}`}
                      onMouseEnter={() => setHovered(item.name)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                      onClick={() => onCategoryClick?.(item.name, startDate, endDate)}
                    >
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(item.name) }} />
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
