'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { flatten } from '@/lib/blueprint-edit'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { Blueprint, BlueprintPreview } from '@/lib/types/blueprint'

interface Props {
  /** Categories just removed from the blueprint that still have transactions. */
  entries: BlueprintPreview['impact']['by_category']
  blueprint: Blueprint
  onDone: () => void
}

const LEAVE = ''

/** After saving: choose where the transactions of removed categories should go. */
export function ReassignPanel({ entries, blueprint, onDone }: Props) {
  const { t } = useTranslation()
  const options = flatten(blueprint.categories)
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moved, setMoved] = useState(0)

  async function apply() {
    setBusy(true)
    setError(null)
    try {
      let total = 0
      for (const entry of entries) {
        const target = targets[entry.key]
        if (!target) continue
        const label = options.find((o) => o.node.key === target)?.node.label
        if (!label) continue
        for (const text of entry.texts) {
          total += (await workspacesService.remapCategory(text, label)).transactions_updated
        }
      }
      setMoved(total)
      window.dispatchEvent(new Event('transactions-updated'))
      if (total === 0) onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (moved > 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            {t('blueprintEditor.moved', { n: moved })}
          </span>
          <Button size="sm" onClick={onDone}>
            {t('blueprintEditor.reassignDone')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('blueprintEditor.reassignTitle')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('blueprintEditor.reassignHelp')}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.key} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-56 font-medium">
              {entry.label} <span className="font-normal text-muted-foreground">({t('blueprintEditor.transactionsCount', { n: entry.transactions })})</span>
            </span>
            <span className="text-muted-foreground">→</span>
            <Select value={targets[entry.key] ?? LEAVE} onChange={(e) => setTargets((p) => ({ ...p, [entry.key]: e.target.value }))} className="h-8 w-56" aria-label={`${entry.label} →`}>
              <option value={LEAVE}>{t('blueprintEditor.reassignLeave')}</option>
              {options.map(({ node, depth }) => (
                <option key={node.key} value={node.key}>
                  {'  '.repeat(depth)}
                  {node.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onDone}>
            {t('blueprintEditor.reassignLeave')}
          </Button>
          <Button size="sm" disabled={busy || !Object.values(targets).some(Boolean)} onClick={apply}>
            {t('blueprintEditor.reassignApply')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
