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

export interface MessagePart {
  type: string
  [key: string]: unknown
}
