'use client'

import { InvestmentsView } from '@/components/investments/InvestmentsView'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function InvestmentsPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('investments.title')} subtitle={t('investments.subtitle')} className="max-w-5xl" />
      <PageBody className="max-w-5xl">
        <InvestmentsView />
      </PageBody>
    </div>
  )
}
