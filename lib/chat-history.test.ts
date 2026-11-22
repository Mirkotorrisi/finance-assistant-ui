import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupSessionsByDay, parseApiDate, sessionIdFromSearch, storedToMessages } from './chat-history.ts'
import type { ChatSessionSummary, StoredChatMessage } from './types/chat.ts'

const session = (id: string, updated_at: string): ChatSessionSummary => ({
  id, user_id: 'u', title: id, backend: 'claude', message_count: 2, created_at: updated_at, updated_at,
})

test('naive API timestamps are read as UTC', () => {
  assert.equal(parseApiDate('2026-11-22T10:00:00')?.toISOString(), '2026-11-22T10:00:00.000Z')
  assert.equal(parseApiDate('2026-11-22T10:00:00+02:00')?.toISOString(), '2026-11-22T08:00:00.000Z')
  assert.equal(parseApiDate(null), undefined)
  assert.equal(parseApiDate('garbage'), undefined)
})

test('stored messages become chat messages with text, components and errors', () => {
  const stored: StoredChatMessage[] = [
    { id: 1, session_id: 's', role: 'user', content: 'Quanto ho speso?', components: [], tools: [], error: null, created_at: '2026-11-22T10:00:00' },
    { id: 2, session_id: 's', role: 'assistant', content: '300 €.', components: [{ type: 'SpendingChart' }], tools: ['spending_report'], error: null, created_at: null },
    { id: 3, session_id: 's', role: 'assistant', content: '', components: [], tools: [], error: 'timeout', created_at: null },
    { id: 4, session_id: 's', role: 'assistant', content: '', components: [], tools: [], error: null, created_at: null },
  ]
  const messages = storedToMessages(stored)
  assert.deepEqual(messages.map((m) => m.id), ['h-1', 'h-2', 'h-3'])
  assert.deepEqual(messages[0].parts, [{ type: 'text', text: 'Quanto ho speso?' }])
  assert.equal(messages[0].createdAt?.toISOString(), '2026-11-22T10:00:00.000Z')
  assert.deepEqual(messages[1].parts.map((p) => p.type), ['text', 'ui-metadata'])
  assert.deepEqual((messages[1].parts[1] as { uiMetadata: unknown }).uiMetadata, { text: '', components: [{ type: 'SpendingChart' }] })
  assert.deepEqual(messages[2].parts, [{ type: 'tool-result', toolCallId: '3-error', toolName: 'agent', result: 'timeout', isError: true }])
})

test('sessions are grouped by local day, order preserved, empty groups dropped', () => {
  const now = new Date(2026, 10, 22, 15, 0, 0) // local time
  const at = (d: Date) => d.toISOString() // zone-aware, so the bucket does not depend on the machine's zone
  const groups = groupSessionsByDay(
    [
      session('a', at(new Date(2026, 10, 22, 9))),
      session('b', at(new Date(2026, 10, 21, 23, 30))),
      session('c', at(new Date(2026, 10, 18, 12))),
      session('d', at(new Date(2026, 10, 1, 12))),
      session('e', at(new Date(2026, 10, 22, 0, 5))),
    ],
    now,
  )
  assert.deepEqual(
    groups.map((g) => [g.key, g.sessions.map((s) => s.id)]),
    [['today', ['a', 'e']], ['yesterday', ['b']], ['thisWeek', ['c']], ['older', ['d']]],
  )
  assert.deepEqual(groupSessionsByDay([], now), [])
})

test('the session id in the URL is accepted only as a plain token', () => {
  assert.equal(sessionIdFromSearch('?session=3f2a-b'), '3f2a-b')
  assert.equal(sessionIdFromSearch('?session=a%2Fb'), undefined)
  assert.equal(sessionIdFromSearch(''), undefined)
})
