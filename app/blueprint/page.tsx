'use client'

import { BlueprintEditor } from '@/components/blueprint/BlueprintEditor'
import { useTranslation } from '@/lib/i18n'

export default function BlueprintPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('blueprintEditor.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('blueprintEditor.subtitle')}</p>
        </div>
      </div>
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <BlueprintEditor />
      </div>
    </div>
  )
}
