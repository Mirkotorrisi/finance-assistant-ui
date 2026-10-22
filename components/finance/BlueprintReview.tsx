'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { Blueprint, BlueprintCategory, BlueprintPreview } from '@/lib/types/blueprint'
import { setWorkspaceId } from '@/lib/workspace'

type SaveState = 'idle' | 'saving' | 'success' | 'error'

interface BlueprintReviewProps {
  title?: string
  params?: {
    /** 'update' replaces the current project's blueprint, 'create' makes a new project, 'view' only shows it. */
    mode?: 'update' | 'create' | 'view'
    name?: string
    blueprint?: Blueprint
  }
}

function CategoryTree({
  nodes,
  depth,
  groupsOf,
}: {
  nodes: BlueprintCategory[]
  depth: number
  groupsOf: (key: string) => string[]
}) {
  return (
    <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1 border-l border-border/60 pl-3'}>
      {nodes.map((node) => (
        <li key={node.key}>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-medium">{node.label}</span>
            <span className="text-xs text-muted-foreground">{node.key}</span>
            {node.kind === 'income' && <Badge variant="secondary">+</Badge>}
            {groupsOf(node.key).map((g) => (
              <Badge key={g} variant="outline" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
          {node.children && node.children.length > 0 && (
            <CategoryTree nodes={node.children} depth={depth + 1} groupsOf={groupsOf} />
          )}
        </li>
      ))}
    </ul>
  )
}

function flatten(nodes: BlueprintCategory[] = [], into: Record<string, string> = {}): Record<string, string> {
  for (const n of nodes) {
    into[n.key] = n.label
    flatten(n.children, into)
  }
  return into
}

export function BlueprintReview({ title, params }: BlueprintReviewProps) {
  const { t } = useTranslation()
  const draft = params?.blueprint
  const mode = params?.mode === 'create' ? 'create' : params?.mode === 'view' ? 'view' : 'update'
  const readOnly = mode === 'view'

  const [name, setName] = useState(params?.name ?? draft?.name ?? '')
  const [instructions, setInstructions] = useState(draft?.instructions ?? '')
  const [preview, setPreview] = useState<BlueprintPreview | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const labels = useMemo(() => flatten(draft?.categories), [draft])
  const groups = draft?.groups ?? []
  const groupsOf = (key: string) =>
    groups
      .filter((g) => {
        const members = new Set(g.members)
        // a group lists categories; a member category covers its own subtree
        const covers = (nodes: BlueprintCategory[] = [], inside = false): boolean =>
          nodes.some((n) => {
            const here = inside || members.has(n.key)
            return (n.key === key && here) || covers(n.children, here)
          })
        return covers(draft?.categories)
      })
      .map((g) => g.label)

  // The blueprint that would be saved: the draft plus the two fields editable here
  const finalBlueprint = (): Blueprint => ({
    ...(draft as Blueprint),
    name: name.trim() || draft?.name || '',
    instructions,
  })

  // In update mode, show what the change would do before saving it
  useEffect(() => {
    if (!draft || mode !== 'update') return
    let cancelled = false
    workspacesService
      .current()
      .then((ws) => workspacesService.previewBlueprint(ws.id, draft))
      .then((p) => !cancelled && setPreview(p))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [draft, mode])

  if (!draft) return null

  async function handleSave() {
    setSaveState('saving')
    setErrorMsg('')
    try {
      const blueprint = finalBlueprint()
      if (mode === 'create') {
        const created = await workspacesService.create(blueprint.name, blueprint)
        setWorkspaceId(created.id)
        window.dispatchEvent(new Event('workspace-changed'))
      } else {
        const current = await workspacesService.current()
        await workspacesService.putBlueprint(current.id, blueprint)
        window.dispatchEvent(new Event('blueprint-updated'))
      }
      setSaveState('success')
    } catch (err) {
      setSaveState('error')
      setErrorMsg(err instanceof Error ? err.message : t('blueprintReview.error'))
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(finalBlueprint(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blueprint-${(name || 'project').toLowerCase().replace(/\s+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (saveState === 'success') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {mode === 'create' ? t('blueprintReview.successCreate', { name }) : t('blueprintReview.successUpdate')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const removed = preview?.diff.categories.removed ?? []
  const hasChanges = preview && !preview.diff.is_empty

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title ?? (readOnly ? t('blueprintReview.titleView') : t('blueprintReview.title'))}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {mode === 'create'
            ? t('blueprintReview.subtitleCreate')
            : mode === 'view'
              ? t('blueprintReview.subtitleView')
              : t('blueprintReview.subtitleUpdate')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">
            {mode === 'create' ? t('blueprintReview.projectName') : t('blueprintReview.blueprintName')}
          </p>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" readOnly={readOnly} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('blueprintReview.instructions')}</p>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t('blueprintReview.instructionsPlaceholder')}
            className="text-sm"
            readOnly={readOnly}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('blueprintReview.categories')}</p>
          {draft.categories && draft.categories.length > 0 ? (
            <CategoryTree nodes={draft.categories} depth={0} groupsOf={groupsOf} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('blueprintReview.none')}</p>
          )}
        </div>

        {groups.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">{t('blueprintReview.groups')}</p>
            <ul className="space-y-1 text-sm">
              {groups.map((g) => (
                <li key={g.key}>
                  <span className="font-medium">{g.label}</span>
                  <span className="text-muted-foreground"> — {g.members.map((m) => labels[m] ?? m).join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(draft.dimensions?.length ?? 0) > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">{t('blueprintReview.dimensions')}</p>
            <ul className="space-y-1 text-sm">
              {draft.dimensions!.map((d) => (
                <li key={d.key}>
                  <span className="font-medium">{d.label}</span>
                  <span className="text-muted-foreground"> — {d.values.map((v) => v.label).join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'update' && preview && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="mb-1 font-medium">{t('blueprintReview.changes')}</p>
            {!hasChanges ? (
              <p className="text-muted-foreground">{t('blueprintReview.noChanges')}</p>
            ) : (
              <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                {preview.diff.categories.added.length > 0 && (
                  <li>{t('blueprintReview.added', { n: preview.diff.categories.added.length })}</li>
                )}
                {removed.length > 0 && <li>{t('blueprintReview.removed', { n: removed.length })}</li>}
                {preview.diff.categories.renamed.length > 0 && (
                  <li>{t('blueprintReview.renamed', { n: preview.diff.categories.renamed.length })}</li>
                )}
                {preview.diff.categories.moved.length > 0 && (
                  <li>{t('blueprintReview.moved', { n: preview.diff.categories.moved.length })}</li>
                )}
                {(preview.diff.groups.added.length + preview.diff.groups.removed.length + preview.diff.groups.changed.length) > 0 && (
                  <li>{t('blueprintReview.groupsChanged')}</li>
                )}
              </ul>
            )}
            {preview.impact.affected_transactions > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t('blueprintReview.impact', { n: preview.impact.affected_transactions })}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {saveState === 'error' && <p className="text-xs text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {t('blueprintReview.download')}
            </Button>
            {!readOnly && (
              <Button onClick={handleSave} disabled={saveState === 'saving' || !name.trim()} size="sm">
                {saveState === 'saving'
                  ? t('blueprintReview.saving')
                  : mode === 'create'
                    ? t('blueprintReview.saveCreate')
                    : t('blueprintReview.saveUpdate')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
