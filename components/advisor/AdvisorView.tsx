'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvisorReport } from '@/components/finance/AdvisorReport'
import { DecisionsList } from '@/components/advisor/DecisionsList'
import { GoalsEditor } from '@/components/advisor/GoalsEditor'
import { IpsEditor } from '@/components/advisor/IpsEditor'
import { ProfileForm } from '@/components/advisor/ProfileForm'
import { RiskForm } from '@/components/advisor/RiskForm'
import { useTranslation } from '@/lib/i18n'
import { profileService } from '@/lib/services/profile.service'
import type { ProfileResponse } from '@/lib/types/profile'

const TABS = ['profile', 'goals', 'risk', 'ips', 'decisions', 'review'] as const

export function AdvisorView() {
  const { t } = useTranslation()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(() => {
    profileService
      .get()
      .then((p) => {
        setData(p)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('advisor.loadError')))
  }, [t])

  useEffect(() => {
    load()
    window.addEventListener('workspace-changed', load)
    return () => window.removeEventListener('workspace-changed', load)
  }, [load])

  // the chat's IpsReview card saves too: follow it without reloading the whole page
  useEffect(() => {
    const onUpdated = () => load()
    window.addEventListener('profile-updated', onUpdated)
    return () => window.removeEventListener('profile-updated', onUpdated)
  }, [load])

  const applied = (saved: ProfileResponse) => {
    setData(saved)
    setSaveError(null)
    setSavedAt(Date.now())
    window.dispatchEvent(new Event('profile-saved'))
  }

  const onPatch = useCallback(async (doc: Record<string, unknown>) => {
    try {
      applied(await profileService.patch(doc, 'user'))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('advisor.saveError'))
    }
  }, [t])

  const onApprove = useCallback(async () => {
    try {
      applied(await profileService.approveIps())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('advisor.saveError'))
    }
  }, [t])

  useEffect(() => {
    if (savedAt === null) return
    const id = window.setTimeout(() => setSavedAt(null), 2000)
    return () => window.clearTimeout(id)
  }, [savedAt])

  if (error && !data) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return <div className="h-64 animate-pulse rounded-xl bg-muted" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {data.version > 0 ? t('advisor.version', { n: data.version, by: t(`advisor.by.${data.updated_by}`) }) : t('advisor.noVersion')}
        </span>
        <span className="flex items-center gap-1.5">
          {saveError && <span className="text-destructive">{saveError}</span>}
          {savedAt !== null && !saveError && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              {t('advisor.saved')}
            </span>
          )}
        </span>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`advisor.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile">
          <ProfileForm profile={data.profile} onPatch={onPatch} />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsEditor goals={data.profile.goals} onPatch={onPatch} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskForm risk={data.profile.risk} onPatch={onPatch} />
        </TabsContent>
        <TabsContent value="ips">
          <IpsEditor ips={data.profile.ips} status={data.ips_status} approvedAt={data.ips_approved_at} onPatch={onPatch} onApprove={onApprove} />
        </TabsContent>
        <TabsContent value="decisions">
          <DecisionsList />
        </TabsContent>
        <TabsContent value="review">
          <AdvisorReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
