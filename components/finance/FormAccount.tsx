'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accountsService } from '@/lib/services/accounts.service'
import type { AccountCreate } from '@/lib/types/account'
import { useTranslation } from '@/lib/i18n'

interface FormAccountProps {
  title?: string
  onSuccess?: () => void
}

const DEFAULT_FORM: AccountCreate = {
  name: '',
  account_type: 'checking',
  currency: 'EUR',
  is_active: true,
  current_balance: 0,
}

export function FormAccount({ title, onSuccess }: FormAccountProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<AccountCreate>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(field: keyof AccountCreate, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await accountsService.create(form)
      setSuccess(true)
      setForm(DEFAULT_FORM)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('formAccount.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('formAccount.defaultTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">{t('formAccount.name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('formAccount.namePlaceholder')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="account_type">{t('formAccount.type')}</Label>
              <Input
                id="account_type"
                value={form.account_type}
                onChange={(e) => handleChange('account_type', e.target.value)}
                placeholder={t('formAccount.typePlaceholder')}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">{t('common.currency')}</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="EUR"
                maxLength={3}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="current_balance">{t('formAccount.initialBalance')}</Label>
            <Input
              id="current_balance"
              type="number"
              step="0.01"
              value={form.current_balance}
              onChange={(e) => handleChange('current_balance', parseFloat(e.target.value) || 0)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{t('formAccount.success')}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('formAccount.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
