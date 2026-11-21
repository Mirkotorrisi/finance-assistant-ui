'use client'

import { Suspense } from 'react'
import { BanksView } from '@/components/banking/BanksView'
import { Skeleton } from '@/components/ui/skeleton'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function BankingPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('banking.title')} subtitle={t('banking.subtitle')} className="max-w-5xl" />
      <PageBody className="max-w-5xl">
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <BanksView />
        </Suspense>
      </PageBody>
    </div>
  )
}
