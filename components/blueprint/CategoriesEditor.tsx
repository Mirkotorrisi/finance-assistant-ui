'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, IndentDecrease, IndentIncrease, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import {
  addCategory, allKeys, deleteCategory, flatten, indent, moveWithinSiblings, outdent, renameCategory, uniqueKey, MAX_DEPTH,
} from '@/lib/blueprint-edit'
import type { Blueprint } from '@/lib/types/blueprint'

interface Props {
  draft: Blueprint
  /** Keys that exist in the saved blueprint: their key is stable, a rename leaves an alias. */
  savedKeys: Set<string>
  onChange: (next: Blueprint) => void
}

function Row({
  node, depth, isNew, draft, onChange,
}: {
  node: ReturnType<typeof flatten>[number]['node']
  depth: number
  isNew: boolean
  draft: Blueprint
  onChange: (next: Blueprint) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(node.label)
  const [lastSeen, setLastSeen] = useState(node.label)
  // follow external changes (undo, import) without clobbering what is being typed
  if (node.label !== lastSeen) {
    setLastSeen(node.label)
    setValue(node.label)
  }

  // a rename is committed once, when editing ends: committing per keystroke would leave an alias for every prefix
  const commit = () => {
    const label = value.trim()
    if (!label) return setValue(node.label)
    if (label !== node.label) onChange(renameCategory(draft, node.key, label, isNew))
  }
  const sub = () => {
    const label = t('blueprintEditor.newCategory')
    const key = uniqueKey(label, allKeys(draft.categories))
    onChange({ ...draft, categories: addCategory(draft.categories, node.key, { key, label }) })
  }
  const icon = 'h-3.5 w-3.5'
  const btn = 'h-7 w-7'

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-0.5" style={{ paddingLeft: `${depth * 1.25}rem` }}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder={t('blueprintEditor.labelPlaceholder')}
        aria-label={t('blueprintEditor.labelPlaceholder')}
        className="h-8 w-56 min-w-0"
      />
      <span className="hidden text-xs text-muted-foreground sm:inline">{node.key}</span>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={node.kind === 'income'}
          onChange={(e) =>
            onChange({
              ...draft,
              categories: updateKind(draft.categories ?? [], node.key, e.target.checked ? 'income' : 'expense'),
            })
          }
        />
        {t('blueprintEditor.income')}
      </label>
      <Button type="button" variant="ghost" size="icon" className={btn} title={t('blueprintEditor.moveUp')} onClick={() => onChange({ ...draft, categories: moveWithinSiblings(draft.categories, node.key, -1) })}>
        <ArrowUp className={icon} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={btn} title={t('blueprintEditor.moveDown')} onClick={() => onChange({ ...draft, categories: moveWithinSiblings(draft.categories, node.key, 1) })}>
        <ArrowDown className={icon} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={btn} title={t('blueprintEditor.indent')} onClick={() => onChange({ ...draft, categories: indent(draft.categories, node.key) })}>
        <IndentIncrease className={icon} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={btn} title={t('blueprintEditor.outdent')} onClick={() => onChange({ ...draft, categories: outdent(draft.categories, node.key) })}>
        <IndentDecrease className={icon} />
      </Button>
      {depth + 1 < MAX_DEPTH && (
        <Button type="button" variant="ghost" size="icon" className={btn} title={t('blueprintEditor.addSub')} onClick={sub}>
          <Plus className={icon} />
        </Button>
      )}
      <Button type="button" variant="ghost" size="icon" className={`${btn} text-destructive`} title={t('blueprintEditor.remove')} onClick={() => onChange(deleteCategory(draft, node.key))}>
        <Trash2 className={icon} />
      </Button>
      {(node.aliases?.length ?? 0) > 0 && (
        <span className="basis-full text-xs text-muted-foreground" style={{ paddingLeft: '0.25rem' }}>
          {t('blueprintEditor.aliasesHint', { aliases: node.aliases!.join(', ') })}
        </span>
      )}
    </div>
  )
}

function updateKind(nodes: NonNullable<Blueprint['categories']>, key: string, kind: 'income' | 'expense'): NonNullable<Blueprint['categories']> {
  return nodes.map((n) =>
    n.key === key ? { ...n, kind } : n.children?.length ? { ...n, children: updateKind(n.children, key, kind) } : n,
  )
}

export function CategoriesEditor({ draft, savedKeys, onChange }: Props) {
  const { t } = useTranslation()
  const rows = flatten(draft.categories)

  const addRoot = () => {
    const label = t('blueprintEditor.newCategory')
    const key = uniqueKey(label, allKeys(draft.categories))
    onChange({ ...draft, categories: addCategory(draft.categories, null, { key, label }) })
  }

  return (
    <div className="space-y-2">
      {rows.map(({ node, depth }) => (
        <Row key={node.key} node={node} depth={depth} isNew={!savedKeys.has(node.key)} draft={draft} onChange={onChange} />
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRoot}>
        <Plus className="h-3.5 w-3.5" />
        {t('blueprintEditor.addCategory')}
      </Button>
    </div>
  )
}
