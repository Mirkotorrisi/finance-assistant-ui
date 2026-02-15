import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core'

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: jsonb('content').notNull(), // Store message parts as JSON
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
