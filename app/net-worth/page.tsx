'use client'

import { NetWorthView } from '@/components/net-worth/NetWorthView'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function NetWorthPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('netWorth.title')} subtitle={t('netWorth.subtitle')} className="max-w-6xl" />
      <PageBody className="max-w-6xl">
        <NetWorthView />
      </PageBody>
    </div>
  )
}
