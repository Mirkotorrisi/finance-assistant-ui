'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { parseNumber } from '@/lib/profile-edit'

/**
 * Form controls that report a value once editing ends (blur or Enter), so each change is one small PATCH to the
 * profile. They follow external changes (a save from another tab, a project switch) without disturbing typing.
 */

function useDraft<T>(value: T): [T, (v: T) => void] {
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    setText(value)
  }
  return [text, setText]
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface TextProps {
  label: string
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  allowEmpty?: boolean
  className?: string
}

export function TextField({ label, value, onCommit, placeholder, allowEmpty = true, className }: TextProps) {
  const [text, setText] = useDraft(value)
  const commit = () => {
    const trimmed = text.trim()
    if (!trimmed && !allowEmpty) return setText(value)
    if (trimmed !== value) onCommit(trimmed)
  }
  return (
    <Field label={label}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder={placeholder}
        aria-label={label}
        className={className ?? 'h-9'}
      />
    </Field>
  )
}

export function TextareaField({ label, value, onCommit, placeholder, hint }: Omit<TextProps, 'className'> & { hint?: string }) {
  const [text, setText] = useDraft(value)
  const commit = () => {
    if (text.trim() !== value) onCommit(text.trim())
  }
  return (
    <Field label={label} hint={hint}>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} placeholder={placeholder} aria-label={label} className="text-sm" />
    </Field>
  )
}

interface NumberProps {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
  hint?: string
  min?: number
  max?: number
  step?: number
  /** When false an empty input is ignored instead of clearing the value. */
  nullable?: boolean
}

export function NumberField({ label, value, onCommit, hint, min, max, step, nullable = true }: NumberProps) {
  const external = value === null ? '' : String(value)
  const [text, setText] = useDraft(external)
  const [invalid, setInvalid] = useState(false)
  const commit = () => {
    const parsed = parseNumber(text)
    if (parsed === undefined || (parsed === null && !nullable)) {
      setInvalid(true)
      setText(external)
      return
    }
    setInvalid(false)
    if (parsed !== value) onCommit(parsed)
  }
  return (
    <Field label={label} hint={hint}>
      <Input
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={label}
        aria-invalid={invalid || undefined}
        min={min}
        max={max}
        step={step}
        className={invalid ? 'h-9 border-destructive' : 'h-9'}
      />
    </Field>
  )
}

interface SelectProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  optionLabel: (value: T) => string
  onCommit: (value: T) => void
}

export function SelectField<T extends string>({ label, value, options, optionLabel, onCommit }: SelectProps<T>) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onCommit(e.target.value as T)} aria-label={label}>
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel(o)}
          </option>
        ))}
      </Select>
    </Field>
  )
}

export function DateField({ label, value, onCommit }: { label: string; value: string | null; onCommit: (v: string | null) => void }) {
  return (
    <Field label={label}>
      <Input type="date" value={value ?? ''} onChange={(e) => onCommit(e.target.value || null)} aria-label={label} className="h-9" />
    </Field>
  )
}
