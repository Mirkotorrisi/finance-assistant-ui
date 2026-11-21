'use client'

import { BlueprintEditor } from '@/components/blueprint/BlueprintEditor'
import { PageBody, PageHeader } from '@/components/layout/PageHeader'
import { useTranslation } from '@/lib/i18n'

export default function BlueprintPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageHeader title={t('blueprintEditor.title')} subtitle={t('blueprintEditor.subtitle')} className="max-w-4xl" />
      <PageBody className="max-w-4xl">
        <BlueprintEditor />
      </PageBody>
    </div>
  )
}
