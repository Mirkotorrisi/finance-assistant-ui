"use client"

import { useState, FormEvent, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ChatInputProps {
  onSubmit: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({ onSubmit, isLoading = false, disabled = false }: ChatInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      onSubmit(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4">
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={isLoading || disabled}
          rows={1}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px] max-h-40 overflow-y-auto leading-relaxed"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 160) + 'px'
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        size="icon"
        className="h-12 w-12 rounded-xl shrink-0 shadow-sm"
      >
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Send className="h-4 w-4" />
        }
      </Button>
    </form>
  )
}
