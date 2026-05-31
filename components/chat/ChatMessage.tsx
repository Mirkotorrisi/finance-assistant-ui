import { cn } from "@/lib/utils"
import { Message, TextPart, ToolCallPart, ToolResultPart, UiMetadataPart } from "@/lib/types/chat"
import { UIRenderer } from "@/components/generated/UIRenderer"
import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 rounded-full items-center justify-center",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted border border-border text-muted-foreground"
      )}>
        {isUser
          ? <User className="h-4 w-4" />
          : <Bot className="h-4 w-4" />
        }
      </div>

      {/* Message content */}
      <div className={cn(
        "flex flex-col gap-2 min-w-0",
        isUser ? "items-end max-w-[75%]" : "items-start max-w-[85%]"
      )}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            const textPart = part as TextPart
            return (
              <div
                key={index}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm shadow-xs"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{textPart.text}</p>
                {isStreaming && index === message.parts.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse rounded-full align-middle" />
                )}
              </div>
            )
          }

          if (part.type === 'tool-call') {
            const toolCallPart = part as ToolCallPart
            return (
              <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground italic px-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
                Calling {toolCallPart.toolName}…
              </div>
            )
          }

          if (part.type === 'tool-result') {
            const toolResultPart = part as ToolResultPart
            if (toolResultPart.isError) {
              return (
                <div key={index} className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm">
                  <p className="font-semibold text-destructive mb-1">Tool Error</p>
                  <p className="text-destructive/80">{JSON.stringify(toolResultPart.result)}</p>
                </div>
              )
            }
            return null
          }

          if (part.type === 'ui-metadata') {
            const uiMetadataPart = part as UiMetadataPart
            return (
              <div key={index} className="w-full">
                <UIRenderer plan={uiMetadataPart.uiMetadata} />
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
