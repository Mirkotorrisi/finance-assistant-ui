import { cn } from "@/lib/utils"
import { Message, TextPart, ToolCallPart, ToolResultPart } from "@/lib/types/chat"
import { ToolResultRenderer } from "./ToolResultRenderer"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

// Helper function to render tool result parts
function renderToolResult(part: ToolResultPart, index: number) {
  if (!part.isError) {
    return (
      <div key={index} className="my-2">
        <ToolResultRenderer 
          toolName={part.toolName}
          result={part.result}
        />
      </div>
    )
  }
  
  return (
    <div key={index} className="my-2 p-3 bg-red-100 text-red-800 rounded">
      <p className="text-sm font-semibold">Tool Error:</p>
      <p className="text-sm">{JSON.stringify(part.result)}</p>
    </div>
  )
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
              return renderToolResult(part as ToolResultPart, index)
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
