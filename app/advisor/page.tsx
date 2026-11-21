'use client'

import { AdvisorView } from '@/components/advisor/AdvisorView'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function AdvisorPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('advisor.title')} subtitle={t('advisor.subtitle')} className="max-w-5xl" />
      <PageBody className="max-w-5xl">
        <AdvisorView />
      </PageBody>
    </div>
  )
}
