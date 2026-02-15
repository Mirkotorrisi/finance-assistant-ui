export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: Error | null
}

// UI Message part types for extracting content
export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolCallPart {
  type: 'tool-call'
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

export interface ToolResultPart {
  type: 'tool-result'
  toolCallId: string
  toolName: string
  result: unknown
  isError?: boolean
}

// Allow any other part types that might come from the AI SDK
// Examples: 'reasoning' parts, 'step-start' parts, or future part types
// This ensures forward compatibility with AI SDK updates
export interface OtherPart {
  type: string
  [key: string]: unknown
}

export type MessagePart = TextPart | ToolCallPart | ToolResultPart | OtherPart

// Extended Message interface that supports parts
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  createdAt?: Date
}
