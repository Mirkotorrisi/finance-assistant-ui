"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { Message, MessagePart, TextPart, UiMetadataPart } from "@/lib/types/chat"

// Must stay in sync with the marker defined in app/api/ai/chat/route.ts
const UI_METADATA_MARKER = '__UI_METADATA__:'

/**
 * Scan every text part in assistant messages for the UI_METADATA_MARKER.
 * When found:
 *  - the text before the marker is kept as a clean TextPart
 *  - the JSON after the marker is parsed into a UiMetadataPart
 * This allows ChatMessage to render <UIRenderer /> for the extracted metadata.
 */
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

      // Keep the human-readable text before the marker
      const cleanText = textPart.text.substring(0, markerIndex).trimEnd()
      if (cleanText) {
        newParts.push({ type: 'text', text: cleanText } as TextPart)
      }

      // Parse and inject the ui-metadata part
      try {
        const jsonStr = textPart.text.substring(markerIndex + UI_METADATA_MARKER.length)
        const uiMetadata = JSON.parse(jsonStr)
        newParts.push({ type: 'ui-metadata', uiMetadata } as UiMetadataPart)
      } catch (err) {
        // Malformed JSON – fall back to keeping the original text unchanged
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
    <Card className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList messages={processedMessages} isLoading={isLoading} />
      </div>
      <ChatInput onSubmit={onSubmit} isLoading={isLoading} />
    </Card>
  )
}
