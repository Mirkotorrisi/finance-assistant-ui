import { db } from '../client'
import { chats, messages, type NewChat, type NewMessage } from '../schema'
import { eq, desc } from 'drizzle-orm'

export async function createChat(userId: string, title?: string) {
  const [chat] = await db.insert(chats).values({ userId, title }).returning()
  return chat
}

export async function getChatsByUserId(userId: string) {
  return db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.updatedAt))
}

export async function getChatWithMessages(chatId: string) {
  const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
  const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt)
  
  return {
    ...chat[0],
    messages: chatMessages
  }
}

export async function saveMessage(chatId: string, role: string, content: unknown) {
  const [message] = await db.insert(messages).values({
    chatId,
    role,
    content
  }).returning()
  
  // Update chat's updatedAt
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))
  
  return message
}

export async function deleteChat(chatId: string) {
  await db.delete(chats).where(eq(chats.id, chatId))
}
