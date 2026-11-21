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
    <form onSubmit={handleSubmit} className="flex items-start gap-3 p-4">
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={isLoading || disabled}
          rows={1}
          aria-describedby="chat-input-hint"
          className="h-12 max-h-40 min-h-[48px] w-full resize-none overflow-y-auto rounded-xl border border-input bg-card px-4 py-3 text-sm leading-relaxed shadow-card transition-[border-color,box-shadow] placeholder:text-muted-foreground/80 hover:border-foreground/25 focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 160) + 'px'
          }}
        />
        <p id="chat-input-hint" className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
          {t('chat.inputHint')}
        </p>
      </div>
      <Button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        size="icon"
        className="h-12 w-12 shrink-0 rounded-xl"
      >
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Send className="h-4 w-4" />
        }
      </Button>
    </form>
  )
}
