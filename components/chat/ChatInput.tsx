"use client"

import { useState, FormEvent, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSubmit: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({ onSubmit, isLoading = false, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      onSubmit(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isLoading || disabled}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
