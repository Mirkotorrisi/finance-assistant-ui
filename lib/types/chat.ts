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

// UI metadata part emitted when a Python agent response contains ui_metadata
export interface UiMetadataPart {
  type: 'ui-metadata'
  uiMetadata: unknown
}

// Allow any other part types that might come from the AI SDK
// Examples: 'reasoning' parts, 'step-start' parts, or future part types
// This ensures forward compatibility with AI SDK updates
export interface OtherPart {
  type: string
  [key: string]: unknown
}

export type MessagePart = TextPart | ToolCallPart | ToolResultPart | UiMetadataPart | OtherPart

// Extended Message interface that supports parts
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  createdAt?: Date
}

// ---------------------------------------------------------------- stored history (API /api/chat-sessions)

export interface ChatSessionSummary {
  id: string
  user_id: string
  title: string
  backend: string | null
  message_count: number
  created_at: string | null
  updated_at: string | null
}

export interface StoredChatMessage {
  id: number
  session_id: string
  role: 'user' | 'assistant'
  content: string
  components: unknown[]
  tools: string[]
  error: string | null
  created_at: string | null
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: StoredChatMessage[]
}
