'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onCommit: (value: string) => void
  placeholder?: string
  label: string
  className?: string
}

/**
 * A text input that reports its value once editing ends (blur or Enter). Renames in the editor change keys and
 * aliases, so they must not happen on every keystroke.
 */
export function CommitInput({ value, onCommit, placeholder, label, className }: Props) {
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value) // follow external changes (revert, import) without disturbing typing
    setText(value)
  }
  const commit = () => {
    const trimmed = text.trim()
    if (!trimmed) return setText(value)
    if (trimmed !== value) onCommit(trimmed)
  }
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      aria-label={label}
      className={className}
    />
  )
}
