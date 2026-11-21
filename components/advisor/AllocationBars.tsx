'use client'

import { CHART_PALETTE } from '@/lib/chart-colors'
import { useTranslation } from '@/lib/i18n'
import type { AllocationTarget } from '@/lib/types/profile'

/** The target allocation as one stacked bar plus a legend with weight and band. */
export function AllocationBars({ targets }: { targets: AllocationTarget[] }) {
  const { t } = useTranslation()
  if (targets.length === 0) return <p className="text-sm text-muted-foreground">{t('advisor.ips.noAllocation')}</p>
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={t('advisor.ips.allocation')}>
        {targets.map((a, i) => (
          <div key={a.asset_class} style={{ width: `${a.weight}%`, backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-3">
        {targets.map((a, i) => (
          <li key={a.asset_class} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
            <span>{t(`advisor.options.assetClass.${a.asset_class}`)}</span>
            <span className="text-muted-foreground">
              {a.weight}% ±{a.band}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
