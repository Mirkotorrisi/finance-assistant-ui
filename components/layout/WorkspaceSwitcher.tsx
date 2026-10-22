'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { workspacesService } from '@/lib/services/workspaces.service'
import type { TemplateInfo, Workspace } from '@/lib/types/blueprint'
import { getWorkspaceId, setWorkspaceId } from '@/lib/workspace'

const NEW = 'new'

/** Choose the project the whole app works in, or create one (empty or from a template). */
export function WorkspaceSwitcher() {
  const { t, locale } = useTranslation()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [templateKey, setTemplateKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      Promise.all([workspacesService.list(), workspacesService.current()])
        .then(([list, current]) => {
          if (cancelled) return
          setWorkspaces(list)
          setCurrentId(getWorkspaceId() ?? current.id)
        })
        .catch(() => undefined) // the API may still be starting; the switcher just stays empty
    void refresh()
    window.addEventListener('workspace-changed', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('workspace-changed', refresh)
    }
  }, [])

  useEffect(() => {
    if (open) workspacesService.templates(locale).then(setTemplates).catch(() => setTemplates([]))
  }, [open, locale])

  function choose(value: string) {
    if (value === NEW) return setOpen(true)
    setWorkspaceId(Number(value))
    window.dispatchEvent(new Event('workspace-changed'))
    window.location.reload() // every page re-reads its data for the new project
  }

  async function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const base = templateKey ? await workspacesService.template(templateKey, locale) : { name: trimmed }
      const created = await workspacesService.create(trimmed, { ...base, name: trimmed })
      setWorkspaceId(created.id)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workspace.failed'))
      setBusy(false)
    }
  }

  return (
    <>
      <Select
        value={currentId === null ? '' : String(currentId)}
        onChange={(e) => choose(e.target.value)}
        aria-label={t('workspace.label')}
        className="h-8 w-40 text-xs"
        title={t('workspace.label')}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
        <option value={NEW}>{t('workspace.newProject')}</option>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('workspace.createHelp')}</p>
            <div className="space-y-2">
              <Label htmlFor="project-name">{t('workspace.name')}</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('workspace.namePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-template">{t('workspace.template')}</Label>
              <Select id="project-template" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                <option value="">{t('workspace.blank')}</option>
                {templates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>
                    {tpl.name}
                  </option>
                ))}
              </Select>
              {templateKey && <p className="text-xs text-muted-foreground">{templates.find((x) => x.key === templateKey)?.description}</p>}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                {t('upload.cancel')}
              </Button>
              <Button onClick={create} disabled={busy || !name.trim()}>
                {busy ? t('workspace.creating') : t('workspace.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
