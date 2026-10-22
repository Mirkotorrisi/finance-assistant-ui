'use client'

import { ReviewQueue } from '@/components/review/ReviewQueue'
import { useTranslation } from '@/lib/i18n'

export default function ReviewPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('review.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('review.subtitle')}</p>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <ReviewQueue />
      </div>
    </div>
  )
}
