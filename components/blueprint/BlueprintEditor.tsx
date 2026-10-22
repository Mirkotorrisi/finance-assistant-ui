'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n'
import { allKeys, isDirty } from '@/lib/blueprint-edit'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { Blueprint, BlueprintPreview, CategoryUsage } from '@/lib/types/blueprint'
import { CategoriesEditor } from './CategoriesEditor'
import { ChangesPanel } from './ChangesPanel'
import { DimensionsEditor } from './DimensionsEditor'
import { GroupsEditor } from './GroupsEditor'
import { ReassignPanel } from './ReassignPanel'
import { RulesEditor } from './RulesEditor'
import { UnmappedPanel } from './UnmappedPanel'

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {help && <p className="text-sm text-muted-foreground">{help}</p>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

export function BlueprintEditor() {
  const { t } = useTranslation()
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [saved, setSaved] = useState<Blueprint | null>(null)
  const [draft, setDraft] = useState<Blueprint | null>(null)
  const [usage, setUsage] = useState<CategoryUsage[]>([])
  const [preview, setPreview] = useState<BlueprintPreview | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [reassign, setReassign] = useState<BlueprintPreview['impact']['by_category'] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const workspace = await workspacesService.current()
      const { blueprint } = await workspacesService.getBlueprint(workspace.id)
      setWorkspaceId(workspace.id)
      setSaved(blueprint)
      setDraft(blueprint)
      setPreview(null)
      setServerError(null)
      setLoadError(null)
      setUsage(await workspacesService.categoryUsage())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('blueprintEditor.loadFailed'))
    }
  }, [t])

  useEffect(() => {
    void load()
    const reload = () => void load()
    window.addEventListener('workspace-changed', reload)
    window.addEventListener('blueprint-updated', reload)
    return () => {
      window.removeEventListener('workspace-changed', reload)
      window.removeEventListener('blueprint-updated', reload)
    }
  }, [load])

  const dirty = saved !== null && draft !== null && isDirty(saved, draft)
  const savedKeys = useMemo(() => allKeys(saved?.categories), [saved])

  // Preview what saving would do (and whether it is valid), shortly after the user stops typing
  useEffect(() => {
    if (!dirty || workspaceId === null || draft === null) {
      setPreview(null)
      setServerError(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      workspacesService
        .previewBlueprint(workspaceId, draft)
        .then((p) => {
          if (cancelled) return
          setPreview(p)
          setServerError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setPreview(null)
          setServerError(err instanceof Error ? err.message : String(err))
        })
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [draft, dirty, workspaceId])

  async function save() {
    if (!draft || workspaceId === null) return
    setSaving(true)
    setNotice(null)
    try {
      const removedWithData = preview?.impact.by_category ?? []
      const result = await workspacesService.putBlueprint(workspaceId, draft)
      setSaved(result.blueprint)
      setDraft(result.blueprint)
      setPreview(null)
      setNotice({ kind: 'ok', text: t('blueprintEditor.saved') })
      if (removedWithData.length > 0) setReassign(removedWithData)
      setUsage(await workspacesService.categoryUsage())
      window.dispatchEvent(new Event('blueprint-saved'))
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  function exportJson() {
    if (!draft) return
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blueprint-${(draft.name || 'project').toLowerCase().replace(/\s+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file: File) {
    setNotice(null)
    try {
      const parsed = JSON.parse(await file.text())
      const { blueprint } = await workspacesService.validate(parsed)
      setDraft(blueprint) // a draft like any other: review the changes, then save
      setNotice({ kind: 'ok', text: t('blueprintEditor.importLoaded') })
    } catch (err) {
      setNotice({ kind: 'error', text: `${t('blueprintEditor.importFailed')} ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="mr-2 inline h-4 w-4" />
        {t('blueprintEditor.loadFailed')}: {loadError}
      </div>
    )
  }
  if (!draft) return <p className="text-sm text-muted-foreground">…</p>

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} aria-label={t('blueprintEditor.import')} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {t('blueprintEditor.import')}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJson}>
          <Download className="h-3.5 w-3.5" />
          {t('blueprintEditor.export')}
        </Button>
      </div>

      {reassign && saved && <ReassignPanel entries={reassign} blueprint={saved} onDone={() => { setReassign(null); void workspacesService.categoryUsage().then(setUsage) }} />}

      <Section title={t('blueprintEditor.general')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium">{t('blueprintEditor.name')}</p>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-9" aria-label={t('blueprintEditor.name')} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">{t('blueprintEditor.description')}</p>
            <Input value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="h-9" aria-label={t('blueprintEditor.description')} />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('blueprintEditor.instructions')}</p>
          <Textarea value={draft.instructions ?? ''} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} className="text-sm" aria-label={t('blueprintEditor.instructions')} />
          <p className="mt-1 text-xs text-muted-foreground">{t('blueprintEditor.instructionsHelp')}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.settings?.detect_transfers ?? true}
            onChange={(e) => setDraft({ ...draft, settings: { ...draft.settings, detect_transfers: e.target.checked } })}
          />
          {t('blueprintEditor.detectTransfers')}
        </label>
      </Section>

      <Section title={t('blueprintEditor.categories')} help={t('blueprintEditor.categoriesHelp')}>
        <CategoriesEditor draft={draft} savedKeys={savedKeys} onChange={setDraft} />
      </Section>

      <Section title={t('blueprintEditor.unmapped')}>
        <UnmappedPanel usage={usage} draft={draft} onChange={setDraft} onMoved={() => void workspacesService.categoryUsage().then(setUsage)} />
      </Section>

      <Section title={t('blueprintEditor.groups')} help={t('blueprintEditor.groupsHelp')}>
        <GroupsEditor draft={draft} savedKeys={new Set((saved?.groups ?? []).map((g) => g.key))} onChange={setDraft} />
      </Section>

      <Section title={t('blueprintEditor.dimensions')} help={t('blueprintEditor.dimensionsHelp')}>
        <DimensionsEditor draft={draft} saved={saved ?? draft} onChange={setDraft} />
      </Section>

      <Section title={t('blueprintEditor.rules')} help={t('blueprintEditor.rulesHelp')}>
        <RulesEditor draft={draft} onChange={setDraft} />
      </Section>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-start gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">
              {dirty ? t('blueprintEditor.unsaved') : t('blueprintEditor.changes')}
            </p>
            <ChangesPanel dirty={dirty} preview={preview} serverError={serverError} />
            {notice && (
              <p className={`flex items-center gap-1.5 text-sm ${notice.kind === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                {notice.kind === 'ok' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {notice.text}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!dirty || saving} onClick={() => { setDraft(saved); setNotice(null) }}>
              {t('blueprintEditor.revert')}
            </Button>
            <Button disabled={!dirty || saving || !!serverError || !preview} onClick={save}>
              {saving ? t('blueprintEditor.saving') : t('blueprintEditor.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
