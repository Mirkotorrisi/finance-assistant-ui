'use client'

import { ReviewQueue } from '@/components/review/ReviewQueue'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function ReviewPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('review.title')} subtitle={t('review.subtitle')} className="max-w-3xl" />
      <PageBody className="max-w-3xl">
        <ReviewQueue />
      </PageBody>
    </div>
  )
}
