'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'

interface Chat {
  id: string
  title: string
  updatedAt: string
}

interface ChatHistoryProps {
  userId: string
  currentChatId?: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export function ChatHistory({ userId, currentChatId, onSelectChat, onNewChat }: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChats()
  }, [userId])

  async function fetchChats() {
    try {
      setError(null)
      const response = await fetch(`/api/chats?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error('Failed to fetch chats:', error)
      setError('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(chatId: string) {
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete chat')
      setChats(chats.filter(c => c.id !== chatId))
    } catch (error) {
      console.error('Failed to delete chat:', error)
      setError('Failed to delete chat')
    }
  }

  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-1 p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  flex items-center justify-between p-3 rounded hover:bg-gray-100 cursor-pointer
                  ${currentChatId === chat.id ? 'bg-gray-100' : ''}
                `}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{chat.title || 'Untitled Chat'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(chat.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
