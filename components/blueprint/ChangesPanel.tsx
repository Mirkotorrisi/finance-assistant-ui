'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { BlueprintPreview } from '@/lib/types/blueprint'

interface Props {
  dirty: boolean
  preview: BlueprintPreview | null
  serverError: string | null
}

/** What saving would change, and why it cannot be saved when it cannot. */
export function ChangesPanel({ dirty, preview, serverError }: Props) {
  const { t } = useTranslation()
  if (!dirty) return <p className="text-sm text-muted-foreground">{t('blueprintEditor.noChanges')}</p>
  if (serverError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        <p className="font-medium">{t('blueprintEditor.invalid')}</p>
        <p className="mt-0.5 break-words">{serverError}</p>
      </div>
    )
  }
  if (!preview) return <p className="text-sm text-muted-foreground">…</p>

  const { diff, impact } = preview
  const lines: string[] = []
  if (diff.categories.added.length) lines.push(t('blueprintEditor.added', { n: diff.categories.added.length }))
  if (diff.categories.removed.length) lines.push(t('blueprintEditor.removed', { n: diff.categories.removed.length }))
  if (diff.categories.renamed.length) lines.push(t('blueprintEditor.renamed', { n: diff.categories.renamed.length }))
  if (diff.categories.moved.length) lines.push(t('blueprintEditor.movedCats', { n: diff.categories.moved.length }))
  if (diff.groups.added.length + diff.groups.removed.length + diff.groups.changed.length) lines.push(t('blueprintEditor.groupsChanged'))
  if (!lines.length) lines.push(t('blueprintEditor.otherChanged'))

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {impact.affected_transactions > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('blueprintEditor.impact', { n: impact.affected_transactions })}
        </p>
      )}
    </div>
  )
}
