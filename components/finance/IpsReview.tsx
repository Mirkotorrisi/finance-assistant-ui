'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AllocationBars } from '@/components/advisor/AllocationBars'
import { IpsStatusBadge } from '@/components/advisor/IpsStatusBadge'
import { useTranslation } from '@/lib/i18n'
import { profileService } from '@/lib/services/profile.service'
import type { InvestmentPolicy, IpsStatus } from '@/lib/types/profile'

type SaveState = 'idle' | 'saving' | 'draft' | 'approved' | 'error'

interface IpsReviewProps {
  title?: string
  params?: {
    /** The policy to review: the `ips` field of a propose_ips response. */
    ips?: Partial<InvestmentPolicy>
  }
}

/** A proposed Investment Policy Statement: the user saves it as a draft or saves and approves it. */
export function IpsReview({ title, params }: IpsReviewProps) {
  const { t } = useTranslation()
  const ips = params?.ips
  const [current, setCurrent] = useState<IpsStatus | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const loadStatus = useCallback(() => {
    profileService
      .get()
      .then((p) => setCurrent(p.ips_status))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    loadStatus()
    window.addEventListener('workspace-changed', loadStatus)
    return () => window.removeEventListener('workspace-changed', loadStatus)
  }, [loadStatus])

  if (!ips) return null

  async function save(approve: boolean) {
    setSaveState('saving')
    setErrorMsg('')
    try {
      await profileService.patch({ ips }, 'user')
      if (approve) await profileService.approveIps()
      window.dispatchEvent(new Event('profile-updated'))
      setSaveState(approve ? 'approved' : 'draft')
    } catch (err) {
      setSaveState('error')
      setErrorMsg(err instanceof Error ? err.message : t('ipsReview.error'))
    }
  }

  if (saveState === 'draft' || saveState === 'approved') {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {saveState === 'approved' ? t('ipsReview.successApproved') : t('ipsReview.successDraft')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const targets = ips.target_allocation ?? []
  const constraints = ips.constraints ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title ?? t('ipsReview.title')}</CardTitle>
          {current && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {t('ipsReview.current')} <IpsStatusBadge status={current} />
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t('ipsReview.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="mb-1 font-medium">{t('ipsReview.objective')}</p>
          <p className="text-muted-foreground">{ips.objective || t('ipsReview.none')}</p>
          {ips.horizon_years != null && <p className="text-muted-foreground">{t('ipsReview.horizon', { n: ips.horizon_years })}</p>}
        </div>
        <div>
          <p className="mb-1.5 font-medium">{t('ipsReview.allocation')}</p>
          <AllocationBars targets={targets} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 font-medium">{t('ipsReview.rebalance')}</p>
            <p className="text-muted-foreground">{ips.rebalance_rule || t('ipsReview.none')}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">{t('ipsReview.contributions')}</p>
            <p className="text-muted-foreground">{ips.contribution_plan || t('ipsReview.none')}</p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-medium">{t('ipsReview.constraints')}</p>
          {constraints.length === 0 ? (
            <p className="text-muted-foreground">{t('ipsReview.none')}</p>
          ) : (
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              {constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-muted-foreground">
          {t('ipsReview.cadence')}: {t(`advisor.options.cadence.${ips.review_cadence ?? 'quarterly'}`)}
        </p>
        {ips.notes && <p className="text-muted-foreground">{ips.notes}</p>}

        <div className="flex flex-col gap-2 pt-1">
          {saveState === 'error' && <p className="text-xs text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? t('ipsReview.saving') : t('ipsReview.saveDraft')}
            </Button>
            <Button size="sm" onClick={() => save(true)} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? t('ipsReview.saving') : t('ipsReview.saveApprove')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
