import { cn } from "@/lib/utils"
import { Message, TextPart, ToolCallPart, ToolResultPart } from "@/lib/types/chat"
import { ToolResultRenderer } from "./ToolResultRenderer"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <div className="flex flex-col gap-2">
          {message.parts.map((part, index) => {
            if (part.type === 'text') {
              const textPart = part as TextPart
              return (
                <div key={index} className="flex-1">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {textPart.text}
                  </p>
                  {isStreaming && index === message.parts.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
              )
            }
            
            if (part.type === 'tool-result') {
              const toolResultPart = part as ToolResultPart
              if (!toolResultPart.isError) {
                return (
                  <div key={index} className="my-2">
                    <ToolResultRenderer 
                      toolName={toolResultPart.toolName}
                      result={toolResultPart.result}
                    />
                  </div>
                )
              } else {
                return (
                  <div key={index} className="my-2 p-3 bg-red-100 text-red-800 rounded">
                    <p className="text-sm font-semibold">Tool Error:</p>
                    <p className="text-sm">{JSON.stringify(toolResultPart.result)}</p>
                  </div>
                )
              }
            }
            
            if (part.type === 'tool-call') {
              const toolCallPart = part as ToolCallPart
              return (
                <div key={index} className="text-sm text-gray-500 italic">
                  Calling {toolCallPart.toolName}...
                </div>
              )
            }
            
            return null
          })}
        </div>
      </div>
    </div>
  )
}
