'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import { netWorthService } from '@/lib/services/net-worth.service'
import type { NetWorthAccount } from '@/lib/types/net-worth'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: NetWorthAccount[]
  onSaved: () => void
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function SnapshotForm({ open, onOpenChange, accounts, onSaved }: Props) {
  const { t } = useTranslation()
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(today())
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setAccountId((current) => current || (accounts.length === 1 ? String(accounts[0].id) : ''))
    }
  }, [open, accounts])

  const amount = Number(balance.replace(',', '.'))
  const valid = accountId !== '' && date !== '' && balance.trim() !== '' && Number.isFinite(amount)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await netWorthService.record({
        account_id: Number(accountId),
        date,
        balance: amount,
        note: note.trim() || undefined,
      })
      setBalance('')
      setNote('')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('netWorth.form.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('netWorth.form.title')}</DialogTitle>
          <DialogDescription>{t('netWorth.form.description')}</DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('netWorth.form.noAccounts')}</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="snap-account">{t('netWorth.form.account')}</Label>
              <Select id="snap-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">{t('netWorth.form.choose')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="snap-date">{t('netWorth.form.date')}</Label>
                <Input id="snap-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="snap-balance">{t('netWorth.form.balance')}</Label>
                <Input
                  id="snap-balance"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snap-note">{t('netWorth.form.note')}</Label>
              <Input
                id="snap-note"
                placeholder={t('netWorth.form.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={!valid || saving} onClick={save}>
              {saving ? t('netWorth.form.saving') : t('netWorth.form.save')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
