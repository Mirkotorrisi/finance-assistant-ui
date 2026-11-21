'use client'

import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import type { BankingStatus } from '@/lib/types/banking'

const KEY_COMMAND =
  'openssl req -x509 -newkey rsa:4096 -nodes -keyout ~/.finance-assistant/secrets/enablebanking.pem -out ~/.finance-assistant/secrets/enablebanking.crt -days 3650 -subj "/CN=finance-assistant"'

function Mark({ ok }: { ok: boolean }) {
  return ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-destructive" />
}

export function SetupCard({ status }: { status: BankingStatus }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('banking.setup.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('banking.setup.intro')}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            {t('banking.setup.step1')}
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs">{status.redirect_url}</code>
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2" onClick={() => copy('redirect', status.redirect_url)}>
                <Copy className="h-3 w-3" />
                {copied === 'redirect' ? t('banking.setup.copied') : t('banking.setup.copy')}
              </Button>
            </div>
            {status.redirect_url.startsWith('http://') && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{t('banking.setup.httpsOnly')}</p>
            )}
          </li>
          <li>
            {t('banking.setup.step2')}
            <div className="mt-1 flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded bg-muted p-2 text-xs">{KEY_COMMAND}</pre>
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2" onClick={() => copy('key', KEY_COMMAND)}>
                <Copy className="h-3 w-3" />
                {copied === 'key' ? t('banking.setup.copied') : t('banking.setup.copy')}
              </Button>
            </div>
          </li>
          <li>
            {t('banking.setup.step3')}
            <pre className="mt-1 rounded bg-muted p-2 text-xs">
              ENABLE_BANKING_APP_ID=&lt;application id&gt;{'\n'}# ENABLE_BANKING_KEY_PATH={status.key_path}
            </pre>
          </li>
          <li>{t('banking.setup.step4')}</li>
          <li>{t('banking.setup.step5')}</li>
        </ol>
        <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/40 p-3">
          <span className="flex items-center gap-1.5">
            <Mark ok={status.app_id_set} /> ENABLE_BANKING_APP_ID
          </span>
          <span className="flex items-center gap-1.5">
            <Mark ok={status.key_found} /> {t('banking.setup.keyAt', { path: status.key_path })}
          </span>
          <Badge variant="outline">{t('banking.setup.consentDays', { n: status.consent_days })}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
