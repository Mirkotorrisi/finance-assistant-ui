"use client"

import { useMemo } from "react"
import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { Message, MessagePart, TextPart, UiMetadataPart } from "@/lib/types/chat"

const UI_METADATA_MARKER = '__UI_METADATA__:'

function processMessages(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.role !== 'assistant') return message

    const newParts: MessagePart[] = []

    for (const part of message.parts) {
      if (part.type !== 'text') {
        newParts.push(part)
        continue
      }

      const textPart = part as TextPart
      const markerIndex = textPart.text.indexOf(UI_METADATA_MARKER)

      if (markerIndex === -1) {
        newParts.push(textPart)
        continue
      }

      const cleanText = textPart.text.substring(0, markerIndex).trimEnd()
      if (cleanText) {
        newParts.push({ type: 'text', text: cleanText } as TextPart)
      }

      try {
        const jsonStr = textPart.text.substring(markerIndex + UI_METADATA_MARKER.length)
        const uiMetadata = JSON.parse(jsonStr)
        newParts.push({ type: 'ui-metadata', uiMetadata } as UiMetadataPart)
      } catch (err) {
        console.error('Failed to parse ui_metadata from agent response:', err)
        newParts.push(textPart)
      }
    }

    return { ...message, parts: newParts }
  })
}

interface ChatContainerProps {
  messages: Message[]
  onSubmit: (message: string) => void
  isLoading?: boolean
}

export function ChatContainer({ messages, onSubmit, isLoading = false }: ChatContainerProps) {
  const processedMessages = useMemo(() => processMessages(messages), [messages])

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={processedMessages} isLoading={isLoading} />
      </div>
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
