'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { addCategory, allKeys, flatten, uniqueKey } from '@/lib/blueprint-edit'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { Blueprint, CategoryUsage } from '@/lib/types/blueprint'

interface Props {
  usage: CategoryUsage[]
  /** The draft, so "add to blueprint" and "move to" offer what the user is currently editing. */
  draft: Blueprint
  onChange: (next: Blueprint) => void
  /** Called after transactions were moved, to refresh the usage list. */
  onMoved: () => void
}

/** Category names the data uses that the saved blueprint does not know: add them, or move their transactions. */
export function UnmappedPanel({ usage, draft, onChange, onMoved }: Props) {
  const { t } = useTranslation()
  const unmapped = usage.filter((u) => u.key === null)
  const options = flatten(draft.categories)
  const [target, setTarget] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)


  const add = (name: string) =>
    onChange({ ...draft, categories: addCategory(draft.categories, null, { key: uniqueKey(name, allKeys(draft.categories)), label: name }) })

  async function move(name: string) {
    const label = options.find((o) => o.node.key === target[name])?.node.label
    if (!label) return
    setError(null)
    try {
      const result = await workspacesService.remapCategory(name, label)
      setMessage(t('blueprintEditor.moved', { n: result.transactions_updated }))
      window.dispatchEvent(new Event('transactions-updated'))
      onMoved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const feedback = (
    <>
      {message && <p className="text-xs text-green-700 dark:text-green-400">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  )

  // keep the confirmation visible even when moving the last name empties the list
  if (unmapped.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{t('blueprintEditor.unmappedNone')}</p>
        {feedback}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t('blueprintEditor.unmappedHelp')}</p>
      {unmapped.map((u) => (
        <div key={u.category} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-48 font-medium">
            {u.category} <span className="font-normal text-muted-foreground">({t('blueprintEditor.transactionsCount', { n: u.transactions })})</span>
          </span>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => add(u.category)}>
            {t('blueprintEditor.addToBlueprint')}
          </Button>
          <Select value={target[u.category] ?? ''} onChange={(e) => setTarget((p) => ({ ...p, [u.category]: e.target.value }))} className="h-8 w-48" aria-label={`${u.category} ${t('blueprintEditor.moveTo')}`}>
            <option value="">{t('blueprintEditor.moveTo')}</option>
            {options.map(({ node, depth }) => (
              <option key={node.key} value={node.key}>
                {'  '.repeat(depth)}
                {node.label}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" className="h-8" disabled={!target[u.category]} onClick={() => move(u.category)}>
            {t('blueprintEditor.moveApply')}
          </Button>
        </div>
      ))}
      {feedback}
    </div>
  )
}
