'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IpsStatusBadge } from '@/components/advisor/IpsStatusBadge'
import { useTranslation } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import { PROFILE_BLOCKS } from '@/lib/profile-edit'
import { profileService } from '@/lib/services/profile.service'
import type { ProfileResponse } from '@/lib/types/profile'

interface ProfileReviewProps {
  title?: string
  /** No parameters: the card always shows the current project's profile. */
  params?: Record<string, never>
}

/** Read-only view of the client profile, with the interview's completeness; editing happens on /advisor. */
export function ProfileReview({ title }: ProfileReviewProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    profileService
      .get()
      .then((p) => {
        setData(p)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('profileReview.loadError')))
  }, [t])

  useEffect(() => {
    load()
    const events = ['profile-updated', 'workspace-changed']
    events.forEach((e) => window.addEventListener(e, load))
    return () => events.forEach((e) => window.removeEventListener(e, load))
  }, [load])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return <div className="h-40 animate-pulse rounded-xl bg-muted" />

  const { profile } = data
  const s = profile.situation
  const opt = (group: string, value: string) => t(`advisor.options.${group}.${value}`)
  const activeGoals = profile.goals.filter((g) => g.status !== 'dropped')
  const allocation = profile.ips.target_allocation.map((a) => `${opt('assetClass', a.asset_class)} ${a.weight}%`).join(', ')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title ?? t('profileReview.title')}</CardTitle>
          <IpsStatusBadge status={data.ips_status} />
        </div>
        {data.version > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('advisor.version', { n: data.version, by: t(`advisor.by.${data.updated_by}`) })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="mb-1.5 font-medium">{t('profileReview.completeness')}</p>
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {PROFILE_BLOCKS.map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-xs">
                {data.completeness[b] ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={data.completeness[b] ? '' : 'text-muted-foreground'}>{t(`profileReview.blocks.${b}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 font-medium">{t('profileReview.situation')}</p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>
              {s.income.net_monthly !== null
                ? t('profileReview.income', {
                    amount: formatCurrency(s.income.net_monthly),
                    kind: opt('incomeKind', s.income.kind),
                    stability: opt('stability', s.income.stability),
                  })
                : t('profileReview.incomeUnknown')}
            </li>
            {s.expenses_monthly !== null && <li>{t('profileReview.expenses', { amount: formatCurrency(s.expenses_monthly) })}</li>}
            <li>
              {s.emergency_fund.amount !== null
                ? t('profileReview.emergency', { amount: formatCurrency(s.emergency_fund.amount), months: s.emergency_fund.target_months })
                : t('profileReview.emergencyUnknown')}
            </li>
            <li>{s.debts.length ? t('profileReview.debts', { n: s.debts.length }) : t('profileReview.noDebts')}</li>
            <li>{t('profileReview.housing', { status: opt('housing', s.housing.status) })}</li>
            <li>{t('profileReview.household', { adults: s.household.adults, dependents: s.household.dependents })}</li>
          </ul>
        </div>

        <div>
          <p className="mb-1 font-medium">{t('profileReview.goals')}</p>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground">{t('profileReview.noGoals')}</p>
          ) : (
            <ul className="space-y-0.5">
              {activeGoals.map((g) => (
                <li key={g.key} className="flex flex-wrap items-center gap-1.5">
                  <span>{g.label}</span>
                  {g.amount !== null && <span className="text-muted-foreground">{formatCurrency(g.amount)}</span>}
                  {g.target_date && <span className="text-muted-foreground">{g.target_date}</span>}
                  <Badge variant="outline" className="text-xs">
                    {t('profileReview.priority', { n: g.priority })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 font-medium">{t('profileReview.risk')}</p>
          <p className="text-muted-foreground">
            {t('profileReview.tolerance', {
              t: profile.risk.tolerance ?? '–',
              c: profile.risk.capacity ?? '–',
            })}{' '}
            · {opt('experience', profile.risk.experience)}
          </p>
        </div>

        <div>
          <p className="mb-1 font-medium">{t('profileReview.ips')}</p>
          {profile.ips.target_allocation.length === 0 && !profile.ips.objective ? (
            <p className="text-muted-foreground">{t('profileReview.noIps')}</p>
          ) : (
            <div className="space-y-0.5 text-muted-foreground">
              {profile.ips.objective && <p>{profile.ips.objective}</p>}
              {allocation && <p>{t('profileReview.allocation', { text: allocation })}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/advisor">
              <Pencil className="h-3.5 w-3.5" />
              {t('profileReview.edit')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
