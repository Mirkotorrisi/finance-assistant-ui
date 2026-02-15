import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { tools } from '@/lib/ai/tools'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert UI messages to the format expected by streamText
    const formattedMessages = messages.map((msg) => {
      // Extract text content from parts if present
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((part: { type: string }) => part.type === 'text')
        const content = textParts.map((part: { text: string }) => part.text).join('')
        return {
          role: msg.role,
          content,
        }
      }
      // Otherwise use content directly if available
      return {
        role: msg.role,
        content: msg.content || '',
      }
    })

    const result = await streamText({
      model: openai('gpt-4o'),
      messages: formattedMessages,
      system: 'You are a helpful financial assistant. You help users understand their finances, analyze transactions, and provide financial insights.',
      tools,
      onFinish: (result) => {
        console.log('Finish event:', {
          text: result.text,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults,
        })
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI Chat Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
