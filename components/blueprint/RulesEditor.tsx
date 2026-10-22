'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { flatten } from '@/lib/blueprint-edit'
import type { Blueprint } from '@/lib/types/blueprint'

interface Props {
  draft: Blueprint
  onChange: (next: Blueprint) => void
}

export function RulesEditor({ draft, onChange }: Props) {
  const { t } = useTranslation()
  const rules = draft.rules ?? []
  const options = flatten(draft.categories)
  const patch = (index: number, change: Partial<(typeof rules)[number]>) =>
    onChange({ ...draft, rules: rules.map((r, i) => (i === index ? { ...r, ...change } : r)) })

  return (
    <div className="space-y-2">
      {rules.map((rule, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Input
            value={rule.pattern}
            onChange={(e) => patch(i, { pattern: e.target.value })}
            placeholder={t('blueprintEditor.patternPlaceholder')}
            aria-label={t('blueprintEditor.patternPlaceholder')}
            className="h-8 w-64"
          />
          <span className="text-muted-foreground">→</span>
          <Select value={rule.category} onChange={(e) => patch(i, { category: e.target.value })} className="h-8 w-56" aria-label={t('blueprintEditor.chooseCategory')}>
            <option value="" disabled>
              {t('blueprintEditor.chooseCategory')}
            </option>
            {options.map(({ node, depth }) => (
              <option key={node.key} value={node.key}>
                {'  '.repeat(depth)}
                {node.label}
              </option>
            ))}
          </Select>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" title={t('blueprintEditor.remove')} onClick={() => onChange({ ...draft, rules: rules.filter((_, j) => j !== i) })}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange({ ...draft, rules: [...rules, { pattern: '', category: '' }] })}>
        <Plus className="h-3.5 w-3.5" />
        {t('blueprintEditor.addRule')}
      </Button>
    </div>
  )
}
