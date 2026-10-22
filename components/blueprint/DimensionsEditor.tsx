'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommitInput } from './CommitInput'
import { useTranslation } from '@/lib/i18n'
import { renameDimension, renameDimensionValue, slugify } from '@/lib/blueprint-edit'
import type { Blueprint } from '@/lib/types/blueprint'

interface Props {
  draft: Blueprint
  /** The saved blueprint's dimensions, to tell stable keys from new ones. */
  saved: Blueprint
  onChange: (next: Blueprint) => void
}

function freshKey(label: string, taken: string[]): string {
  let key = slugify(label)
  for (let i = 2; taken.includes(key); i++) key = `${slugify(label)}_${i}`
  return key
}

export function DimensionsEditor({ draft, saved, onChange }: Props) {
  const { t } = useTranslation()
  const dims = draft.dimensions ?? []
  const savedDims = new Map((saved.dimensions ?? []).map((d) => [d.key, new Set(d.values.map((v) => v.key))]))
  const patch = (key: string, fn: (d: (typeof dims)[number]) => (typeof dims)[number]) =>
    onChange({ ...draft, dimensions: dims.map((d) => (d.key === key ? fn(d) : d)) })

  const addDimension = () => {
    const label = t('blueprintEditor.newDimension')
    const value = t('blueprintEditor.newValue')
    onChange({
      ...draft,
      dimensions: [...dims, { key: freshKey(label, dims.map((d) => d.key)), label, values: [{ key: slugify(value), label: value }] }],
    })
  }

  return (
    <div className="space-y-4">
      {dims.map((d) => (
        <div key={d.key} className="rounded-lg border border-border/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CommitInput
              value={d.label}
              onCommit={(label) => onChange(renameDimension(draft, d.key, label, !savedDims.has(d.key)))}
              placeholder={t('blueprintEditor.dimensionName')}
              label={t('blueprintEditor.dimensionName')}
              className="h-8 max-w-xs"
            />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" title={t('blueprintEditor.remove')} onClick={() => onChange({ ...draft, dimensions: dims.filter((x) => x.key !== d.key) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {d.values.map((v) => (
              <span key={v.key} className="flex items-center gap-1">
                <CommitInput
                  value={v.label}
                  onCommit={(label) => onChange(renameDimensionValue(draft, d.key, v.key, label, !savedDims.get(d.key)?.has(v.key)))}
                  placeholder={t('blueprintEditor.valuePlaceholder')}
                  label={t('blueprintEditor.valuePlaceholder')}
                  className="h-8 w-36"
                />
                {d.values.length > 1 && ( // a dimension needs at least one value
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" title={t('blueprintEditor.remove')} onClick={() => patch(d.key, (x) => ({ ...x, values: x.values.filter((y) => y.key !== v.key) }))}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </span>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => {
                const label = t('blueprintEditor.newValue')
                patch(d.key, (x) => ({ ...x, values: [...x.values, { key: freshKey(label, x.values.map((y) => y.key)), label }] }))
              }}
            >
              <Plus className="h-3 w-3" />
              {t('blueprintEditor.addValue')}
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addDimension}>
        <Plus className="h-3.5 w-3.5" />
        {t('blueprintEditor.addDimension')}
      </Button>
    </div>
  )
}
