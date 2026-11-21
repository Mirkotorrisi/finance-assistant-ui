'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import type { IpsStatus } from '@/lib/types/profile'

export function IpsStatusBadge({ status }: { status: IpsStatus }) {
  const { t } = useTranslation()
  if (status === 'approved') {
    return (
      <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
        {t('advisor.ips.statusApproved')}
      </Badge>
    )
  }
  if (status === 'pending') {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        {t('advisor.ips.statusPending')}
      </Badge>
    )
  }
  return <Badge variant="outline">{t('advisor.ips.statusNone')}</Badge>
}
