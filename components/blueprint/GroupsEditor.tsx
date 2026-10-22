'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommitInput } from './CommitInput'
import { useTranslation } from '@/lib/i18n'
import { flatten, renameGroup, slugify } from '@/lib/blueprint-edit'
import type { Blueprint } from '@/lib/types/blueprint'

interface Props {
  draft: Blueprint
  /** Group keys in the saved blueprint: those keys are stable, new groups take their key from their name. */
  savedKeys: Set<string>
  onChange: (next: Blueprint) => void
}

export function GroupsEditor({ draft, savedKeys, onChange }: Props) {
  const { t } = useTranslation()
  const groups = draft.groups ?? []
  const rows = flatten(draft.categories)

  const patch = (key: string, fn: (g: (typeof groups)[number]) => (typeof groups)[number]) =>
    onChange({ ...draft, groups: groups.map((g) => (g.key === key ? fn(g) : g)) })

  const add = () => {
    const label = t('blueprintEditor.newGroup')
    const taken = new Set(groups.map((g) => g.key))
    let key = slugify(label)
    for (let i = 2; taken.has(key); i++) key = `${slugify(label)}_${i}`
    onChange({ ...draft, groups: [...groups, { key, label, members: [] }] })
  }

  const remove = (key: string) =>
    onChange({
      ...draft,
      groups: groups.filter((g) => g.key !== key),
      reports: (draft.reports ?? []).filter((r) => r.group !== key), // a view of a removed group has nothing to show
    })

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.key} className="rounded-lg border border-border/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CommitInput
              value={g.label}
              onCommit={(label) => onChange(renameGroup(draft, g.key, label, !savedKeys.has(g.key)))}
              placeholder={t('blueprintEditor.groupName')}
              label={t('blueprintEditor.groupName')}
              className="h-8 max-w-xs"
            />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" title={t('blueprintEditor.remove')} onClick={() => remove(g.key)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mb-1 text-xs text-muted-foreground">{t('blueprintEditor.members')}</p>
          <div className="grid gap-0.5 sm:grid-cols-2">
            {rows.map(({ node, depth }) => (
              <label key={node.key} className="flex items-center gap-1.5 text-sm" style={{ paddingLeft: `${depth}rem` }}>
                <input
                  type="checkbox"
                  checked={g.members.includes(node.key)}
                  onChange={(e) =>
                    patch(g.key, (x) => ({
                      ...x,
                      members: e.target.checked ? [...x.members, node.key] : x.members.filter((m) => m !== node.key),
                    }))
                  }
                />
                {node.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" />
        {t('blueprintEditor.addGroup')}
      </Button>
    </div>
  )
}
