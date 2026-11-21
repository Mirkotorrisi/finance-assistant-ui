'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import type { IpsStatus } from '@/lib/types/profile'

export function IpsStatusBadge({ status }: { status: IpsStatus }) {
  const { t } = useTranslation()
  if (status === 'approved') {
    return (
      <Badge className="border-positive/25 bg-positive/10 text-positive">
        {t('advisor.ips.statusApproved')}
      </Badge>
    )
  }
  if (status === 'pending') {
    return (
      <Badge className="border-warning/30 bg-warning/10 text-warning">
        {t('advisor.ips.statusPending')}
      </Badge>
    )
  }
  return <Badge variant="outline">{t('advisor.ips.statusNone')}</Badge>
}
